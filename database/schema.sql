-- Enable required extensions for UUID generation and crypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Migration: V001__create_users.sql
-- Description: Creates the core users table and supporting enums/types.
--              Users can be tenants, landlords, or both (dual-role).
--              Identity verification is performed via NIMC NIN lookup.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
    'tenant',
    'landlord',
    'admin'
);

DROP TYPE IF EXISTS auth_provider CASCADE;
CREATE TYPE auth_provider AS ENUM (
    'email',
    'google',
    'apple'
);

DROP TYPE IF EXISTS verification_status CASCADE;
CREATE TYPE verification_status AS ENUM (
    'unverified',
    'pending',
    'verified',
    'rejected'
);

-- ─── Table: users ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    phone_number        VARCHAR(15),

    -- Authentication
    password_hash       TEXT,                                   -- NULL for OAuth-only accounts
    auth_provider       auth_provider   NOT NULL DEFAULT 'email',
    oauth_provider_id   VARCHAR(255),                           -- External provider UID (Google sub, etc.)

    -- Role
    primary_role        user_role       NOT NULL DEFAULT 'tenant',

    -- NIN Identity Verification (NIMC)
    nin_hash            VARCHAR(64)     UNIQUE,                 -- SHA-256 of the 11-digit NIN, never stored in plain text
    nin_verified_at     TIMESTAMPTZ,
    id_verification_status  verification_status NOT NULL DEFAULT 'unverified',

    -- Profile
    avatar_url          TEXT,
    bio                 TEXT,

    -- Reputation / Scores (denormalised for fast read)
    tenant_score        NUMERIC(3, 2)   DEFAULT 0.00,           -- 0.00–5.00 — Tenant Reliability Score
    landlord_score      NUMERIC(3, 2)   DEFAULT 0.00,           -- 0.00–5.00 — Landlord Reliability Score
    tenant_review_count  INT            DEFAULT 0,
    landlord_review_count INT           DEFAULT 0,

    -- Account state
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ                             -- Soft delete
);

-- ─── Constraints ─────────────────────────────────────────────────────────────

-- Email uniqueness enforced only on active (non-deleted) rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

-- OAuth accounts need a unique (provider, provider_id) tuple
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
    ON users (auth_provider, oauth_provider_id)
    WHERE oauth_provider_id IS NOT NULL;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_primary_role ON users (primary_role);
CREATE INDEX IF NOT EXISTS idx_users_created_at   ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at   ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  users                         IS 'Platform user accounts for both tenants and landlords.';
COMMENT ON COLUMN users.nin_hash                IS 'SHA-256 hash of the 11-digit NIMC NIN. Plain-text NIN is never persisted.';
COMMENT ON COLUMN users.tenant_score            IS 'Denormalised average tenant reliability score (0–5). Recomputed on each new review.';
COMMENT ON COLUMN users.landlord_score          IS 'Denormalised average landlord reliability score (0–5). Recomputed on each new review.';
COMMENT ON COLUMN users.primary_role            IS 'A user who added a property effectively holds both roles; primary_role reflects how they signed up.';


-- =============================================================================
-- Migration: V002__create_properties.sql
-- Description: Creates the properties, property_amenities, and
--              property_images tables. A property can be publicly listed
--              (vacant) or privately managed (occupied).
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS property_type CASCADE;
CREATE TYPE property_type AS ENUM (
    'single_house',
    'duplex',
    'apartment_building',
    'estate',
    'hostel',
    'commercial_building',
    'boys_quarters',
    'apartment',
    'bungalow',
    'semi_detached',
    'detached',
    'terraced',
    'studio',
    'room_and_parlour',
    'mansion',
    'commercial'
);

DROP TYPE IF EXISTS property_status CASCADE;
CREATE TYPE property_status AS ENUM (
    'draft',            -- Saved but not yet submitted for review
    'pending_review',   -- Submitted; awaiting ownership verification
    'active_vacant',    -- Verified and accepting applications
    'active_occupied',  -- Tenant-linked; not publicly listed
    'inactive',         -- Taken off market by the landlord
    'suspended'         -- Suspended by an admin
);

DROP TYPE IF EXISTS rent_period CASCADE;
CREATE TYPE rent_period AS ENUM (
    'monthly',
    'quarterly',
    'biannually',
    'annually'
);

-- ─── Table: properties ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    landlord_id         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Descriptive
    title               VARCHAR(200)    NOT NULL,               -- e.g. "Skyline Apartments, Block 4"
    slug                VARCHAR(220)    UNIQUE NOT NULL,        -- URL-safe: "skyline-apartments-block-4"
    description         TEXT,
    property_type       property_type   NOT NULL DEFAULT 'apartment',

    -- Location
    address_line1       VARCHAR(255)    NOT NULL,
    address_line2       VARCHAR(255),
    city                VARCHAR(100)    NOT NULL DEFAULT 'Lagos',
    state               VARCHAR(100)    NOT NULL DEFAULT 'Lagos',
    country             VARCHAR(100)    NOT NULL DEFAULT 'Nigeria',
    latitude            NUMERIC(10, 7),
    longitude           NUMERIC(10, 7),

    -- Specifications
    bedrooms            SMALLINT        NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms           SMALLINT        NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    toilets             SMALLINT        DEFAULT 1,
    size_sqm            NUMERIC(8, 2),                          -- Floor area in square metres

    -- Financials
    rent_amount         NUMERIC(14, 2)  NOT NULL,               -- In Naira (NGN)
    rent_period         rent_period     NOT NULL DEFAULT 'annually',
    security_deposit    NUMERIC(14, 2)  DEFAULT 0.00,
    agency_fee          NUMERIC(14, 2)  DEFAULT 0.00,
    legal_fee           NUMERIC(14, 2)  DEFAULT 0.00,

    -- Availability
    status              property_status NOT NULL DEFAULT 'draft',
    available_from      DATE,
    is_furnished        BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Current tenant linkage (denormalised FK for quick lookups)
    current_tenant_id   UUID            REFERENCES users (id) ON DELETE SET NULL,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_properties_landlord  ON properties (landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_status    ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_city      ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms  ON properties (bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_rent      ON properties (rent_amount);
CREATE INDEX IF NOT EXISTS idx_properties_location  ON properties (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search: combine title + address for fast keyword search
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties
    USING GIN (
        to_tsvector('english', title || ' ' || address_line1 || ' ' || city)
    );

-- ─── Trigger ─────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Table: property_amenities ───────────────────────────────────────────────
-- Normalised list of amenities per property (avoids wide boolean columns)

CREATE TABLE IF NOT EXISTS property_amenities (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID    NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    amenity         VARCHAR(100) NOT NULL,       -- e.g. 'Prepaid Meter', 'Borehole', '24/7 Security'
    UNIQUE (property_id, amenity)
);

CREATE INDEX IF NOT EXISTS idx_property_amenities_property ON property_amenities (property_id);

-- ─── Table: property_images ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_images (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID        NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    storage_url     TEXT        NOT NULL,        -- Cloud storage URL (e.g. Cloudflare R2, S3)
    thumbnail_url   TEXT,
    caption         VARCHAR(200),
    sort_order      SMALLINT    NOT NULL DEFAULT 0,
    is_cover        BOOLEAN     NOT NULL DEFAULT FALSE,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property   ON property_images (property_id, sort_order);

-- Ensure only one cover image per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_cover
    ON property_images (property_id)
    WHERE is_cover = TRUE;

-- ─── Table: property_blocks ──────────────────────────────────────────────────
-- Optional blocks / buildings / floors within a property (e.g. Block A, Floor 1)

CREATE TABLE IF NOT EXISTS property_blocks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID        NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_blocks_property ON property_blocks (property_id);

-- ─── Table: property_units ───────────────────────────────────────────────────
-- Individual rental units/houses/flats associated with a property

CREATE TABLE IF NOT EXISTS property_units (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id         UUID            NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    block_id            UUID            REFERENCES property_blocks (id) ON DELETE SET NULL,
    unit_name           VARCHAR(100)    NOT NULL,
    bedrooms            SMALLINT        NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms           SMALLINT        NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    rent_amount         NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    rent_period         rent_period     NOT NULL DEFAULT 'annually',
    status              VARCHAR(30)     NOT NULL DEFAULT 'vacant',
    current_tenant_id   UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_units_property ON property_units (property_id);
CREATE INDEX IF NOT EXISTS idx_property_units_block    ON property_units (block_id);
CREATE INDEX IF NOT EXISTS idx_property_units_status   ON property_units (status);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  properties                    IS 'Rental property listings managed by landlords.';
COMMENT ON COLUMN properties.slug               IS 'URL-safe unique identifier used in public-facing listing URLs.';
COMMENT ON COLUMN properties.rent_amount        IS 'Rent amount in Nigerian Naira (NGN). Denomination matches rent_period.';
COMMENT ON COLUMN properties.current_tenant_id  IS 'Denormalised FK to the current active tenant. Derived from active lease.';
COMMENT ON TABLE  property_amenities            IS 'Variable-length list of amenity tags attached to a property.';
COMMENT ON TABLE  property_images               IS 'Media assets (photos) associated with a property listing.';
COMMENT ON TABLE  property_blocks               IS 'Optional building block / floor grouping within a multi-unit property.';
COMMENT ON TABLE  property_units                IS 'Individual rental units or flats inside a property.';


-- =============================================================================
-- Migration: V003__create_applications.sql
-- Description: Manages tenant applications to vacant property listings.
--              Applications bundle the tenant's verified profile and any
--              required supporting documents for the landlord's review.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS application_status CASCADE;
CREATE TYPE application_status AS ENUM (
    'submitted',        -- Tenant has submitted; awaiting landlord review
    'under_review',     -- Landlord has opened the application
    'shortlisted',      -- Landlord has shortlisted the tenant
    'approved',         -- Application accepted; pending lease generation
    'rejected',         -- Application declined by landlord
    'withdrawn',        -- Withdrawn by the tenant before a decision
    'expired'           -- No action taken within the validity window
);

-- ─── Table: applications ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parties
    property_id         UUID                NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
    tenant_id           UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Status lifecycle
    status              application_status  NOT NULL DEFAULT 'submitted',
    status_changed_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Tenant's submitted snapshot (captured at submission time)
    -- These denormalise key tenant fields so history is preserved even if the
    -- tenant later updates their profile.
    snapshot_full_name      VARCHAR(200)    NOT NULL,
    snapshot_email          VARCHAR(255)    NOT NULL,
    snapshot_nin_verified   BOOLEAN         NOT NULL DEFAULT FALSE,
    snapshot_tenant_score   NUMERIC(3, 2),

    -- Additional info provided by the applicant
    message_to_landlord TEXT,

    -- Rejection reason (populated when status = 'rejected')
    rejection_reason    TEXT,

    -- Expiry
    expires_at          TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ─── Constraints ─────────────────────────────────────────────────────────────

-- A tenant can have at most one active (non-rejected, non-withdrawn) application per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_active_unique
    ON applications (property_id, tenant_id)
    WHERE status NOT IN ('rejected', 'withdrawn', 'expired');

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_applications_property      ON applications (property_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant        ON applications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status        ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created       ON applications (created_at DESC);

-- ─── Trigger ─────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Keep status_changed_at in sync whenever status changes
CREATE OR REPLACE FUNCTION sync_application_status_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        NEW.status_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_status_ts
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION sync_application_status_ts();

-- ─── Table: application_documents ───────────────────────────────────────────
-- Documents the landlord may request (employment letter, guarantor form, etc.)

DROP TYPE IF EXISTS document_type CASCADE;
CREATE TYPE document_type AS ENUM (
    'employment_letter',
    'guarantor_form',
    'bank_statement',
    'pay_slip',
    'reference_letter',
    'government_id',
    'utility_bill',
    'other'
);

DROP TYPE IF EXISTS document_status CASCADE;
CREATE TYPE document_status AS ENUM (
    'requested',
    'uploaded',
    'accepted',
    'rejected'
);

CREATE TABLE IF NOT EXISTS application_documents (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID            NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    document_type   document_type   NOT NULL DEFAULT 'other',
    label           VARCHAR(200),                               -- Human-readable label
    storage_url     TEXT,                                       -- NULL until tenant uploads
    status          document_status NOT NULL DEFAULT 'requested',
    notes           TEXT,
    requested_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    uploaded_at     TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_docs_application ON application_documents (application_id);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  applications                          IS 'Tenant rental applications to specific property listings.';
COMMENT ON COLUMN applications.snapshot_full_name       IS 'Full name captured at submission time; not affected by later profile edits.';
COMMENT ON COLUMN applications.snapshot_nin_verified    IS 'NIN verification flag captured at submission to prevent backdating.';
COMMENT ON TABLE  application_documents                 IS 'Supporting documents requested by a landlord for an application.';


-- =============================================================================
-- Migration: V004__create_leases.sql
-- Description: Digital lease (tenancy agreement) records. A lease is created
--              when a landlord approves an application and both parties
--              digitally sign. Replaces physical paper agreements.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE lease_status AS ENUM (
    'draft',            -- Generated from application approval; unsigned
    'pending_tenant',   -- Awaiting tenant digital signature
    'pending_landlord', -- Awaiting landlord countersignature
    'active',           -- Fully signed and in force
    'expired',          -- Past end_date with no renewal
    'renewed',          -- Superseded by a new lease (linked via previous_lease_id)
    'terminated',       -- Ended early (with or without fault)
    'surrendered'       -- Tenant voluntarily vacated ahead of end_date
);

CREATE TYPE termination_reason AS ENUM (
    'mutual_agreement',
    'tenant_breach',
    'landlord_breach',
    'non_payment',
    'property_sold',
    'demolition',
    'personal_use',
    'other'
);

-- ─── Table: leases ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leases (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    property_id         UUID            NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
    tenant_id           UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    landlord_id         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    application_id      UUID            UNIQUE REFERENCES applications (id) ON DELETE SET NULL,
    previous_lease_id   UUID            REFERENCES leases (id) ON DELETE SET NULL, -- Renewal chain

    -- Terms
    start_date          DATE            NOT NULL,
    end_date            DATE            NOT NULL CHECK (end_date > start_date),
    rent_amount         NUMERIC(14, 2)  NOT NULL,   -- Frozen at signing; property rent can change later
    rent_period         rent_period     NOT NULL,
    security_deposit    NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    deposit_held_by     UUID            REFERENCES users (id), -- Landlord or 3rd-party escrow

    -- Digital signatures
    status                      lease_status    NOT NULL DEFAULT 'draft',
    tenant_signed_at            TIMESTAMPTZ,
    landlord_signed_at          TIMESTAMPTZ,
    tenant_signature_ip         INET,
    landlord_signature_ip       INET,

    -- Termination
    termination_date            DATE,
    termination_reason          termination_reason,
    termination_notice_given    DATE,
    termination_notes           TEXT,

    -- Deposit disposition
    deposit_returned_amount     NUMERIC(14, 2),
    deposit_returned_at         TIMESTAMPTZ,
    deposit_deduction_notes     TEXT,

    -- Document
    contract_document_url       TEXT,           -- PDF of the signed agreement

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─── Constraints ─────────────────────────────────────────────────────────────

-- Only one active lease per property at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_leases_property_active
    ON leases (property_id)
    WHERE status = 'active';

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leases_property    ON leases (property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant      ON leases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord    ON leases (landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_status      ON leases (status);
CREATE INDEX IF NOT EXISTS idx_leases_end_date    ON leases (end_date);           -- For renewal/expiry jobs

-- ─── Trigger ─────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_leases_updated_at
    BEFORE UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- When a lease becomes 'active', update the property's current_tenant_id
CREATE OR REPLACE FUNCTION sync_property_tenant_on_lease()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
        UPDATE properties
           SET current_tenant_id = NEW.tenant_id,
               status = 'active_occupied'
         WHERE id = NEW.property_id;
    END IF;

    IF NEW.status IN ('expired', 'terminated', 'surrendered')
       AND OLD.status = 'active' THEN
        UPDATE properties
           SET current_tenant_id = NULL,
               status = 'active_vacant'
         WHERE id = NEW.property_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lease_sync_property
    AFTER UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION sync_property_tenant_on_lease();

-- ─── Table: lease_clauses ────────────────────────────────────────────────────
-- Optional custom clauses appended to the standard lease template

CREATE TABLE IF NOT EXISTS lease_clauses (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id    UUID    NOT NULL REFERENCES leases (id) ON DELETE CASCADE,
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    heading     VARCHAR(200),
    body        TEXT    NOT NULL,
    added_by    UUID    REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_clauses_lease ON lease_clauses (lease_id, sort_order);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  leases                        IS 'Digital tenancy agreements between a landlord and a tenant.';
COMMENT ON COLUMN leases.rent_amount            IS 'Rent amount frozen at the time of signing. Independent of property.rent_amount.';
COMMENT ON COLUMN leases.previous_lease_id      IS 'Self-referential FK forming a renewal chain. NULL for initial leases.';
COMMENT ON COLUMN leases.deposit_held_by        IS 'References the user (usually landlord) or escrow account holding the deposit.';
COMMENT ON TABLE  lease_clauses                 IS 'Custom clauses appended by either party beyond the standard lease template.';


-- =============================================================================
-- Migration: V005__create_rent_payments.sql
-- Description: The financial ledger for rent payments, invoices, and
--              legally-binding digital receipts. Every payment event is
--              immutably recorded; records are never deleted.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'issued',           -- Sent to tenant
    'partially_paid',
    'paid',
    'overdue',
    'waived',           -- Written off by the landlord
    'void'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'successful',
    'failed',
    'reversed',         -- Charge-back or refund initiated
    'cancelled'
);

CREATE TYPE payment_method AS ENUM (
    'bank_transfer',
    'card',
    'ussd',
    'bank_branch',
    'cash',             -- Recorded manually by landlord
    'wallet'            -- In-app wallet if implemented
);

CREATE TYPE payment_direction AS ENUM (
    'rent',
    'security_deposit',
    'agency_fee',
    'legal_fee',
    'maintenance_charge',
    'late_penalty',
    'deposit_refund',
    'other'
);

-- ─── Table: rent_invoices ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rent_invoices (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    lease_id            UUID            NOT NULL REFERENCES leases (id) ON DELETE RESTRICT,
    tenant_id           UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    landlord_id         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Invoice details
    invoice_number      VARCHAR(50)     UNIQUE NOT NULL,        -- Human-readable: INV-2025-001
    direction           payment_direction NOT NULL DEFAULT 'rent',
    amount_due          NUMERIC(14, 2)  NOT NULL,
    amount_paid         NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    amount_outstanding  NUMERIC(14, 2)  GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    currency            CHAR(3)         NOT NULL DEFAULT 'NGN',

    -- Billing period (for rent invoices)
    period_start        DATE,
    period_end          DATE,

    -- Dates
    issue_date          DATE            NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE            NOT NULL,
    paid_date           DATE,

    -- Status
    status              invoice_status  NOT NULL DEFAULT 'draft',

    -- Late fee configuration
    late_fee_rate       NUMERIC(5, 4)   DEFAULT 0.00,           -- Daily rate e.g. 0.0005 = 0.05%
    late_fee_accrued    NUMERIC(14, 2)  DEFAULT 0.00,

    -- Notes
    notes               TEXT,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_lease     ON rent_invoices (lease_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant    ON rent_invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_landlord  ON rent_invoices (landlord_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status    ON rent_invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date  ON rent_invoices (due_date);

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON rent_invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Table: rent_payments ────────────────────────────────────────────────────
-- Immutable payment event log. One invoice can have multiple partial payments.

CREATE TABLE IF NOT EXISTS rent_payments (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    invoice_id          UUID            NOT NULL REFERENCES rent_invoices (id) ON DELETE RESTRICT,
    lease_id            UUID            NOT NULL REFERENCES leases (id) ON DELETE RESTRICT,
    paid_by             UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    received_by         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Amount
    amount              NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    currency            CHAR(3)         NOT NULL DEFAULT 'NGN',
    direction           payment_direction NOT NULL DEFAULT 'rent',

    -- Payment channel
    method              payment_method  NOT NULL DEFAULT 'bank_transfer',
    status              payment_status  NOT NULL DEFAULT 'pending',

    -- Gateway / Reference
    gateway_reference   VARCHAR(255),               -- Paystack/Flutterwave transaction ref
    gateway_response    JSONB,                      -- Raw webhook payload stored for auditing
    internal_reference  VARCHAR(100) UNIQUE,        -- Our own idempotency key

    -- Timestamps
    initiated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    confirmed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,

    -- Manual entry (cash payments recorded by landlord)
    is_manual           BOOLEAN         NOT NULL DEFAULT FALSE,
    manual_note         TEXT,
    recorded_by         UUID            REFERENCES users (id) ON DELETE SET NULL
);

-- Payments are append-only; do NOT allow deletes
CREATE RULE no_delete_rent_payments AS
    ON DELETE TO rent_payments
    DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_payments_invoice    ON rent_payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease      ON rent_payments (lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_by    ON rent_payments (paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON rent_payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_initiated  ON rent_payments (initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway    ON rent_payments (gateway_reference)
    WHERE gateway_reference IS NOT NULL;

-- ─── Table: payment_receipts ─────────────────────────────────────────────────
-- Legally-binding digital receipts auto-generated on payment confirmation

CREATE TABLE IF NOT EXISTS payment_receipts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID        UNIQUE NOT NULL REFERENCES rent_payments (id) ON DELETE RESTRICT,
    receipt_number  VARCHAR(50) UNIQUE NOT NULL,    -- e.g. RCP-2025-00312
    document_url    TEXT,                           -- PDF stored in object storage
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Snapshot fields (preserved even if lease/user data changes)
    snapshot_tenant_name    VARCHAR(200) NOT NULL,
    snapshot_landlord_name  VARCHAR(200) NOT NULL,
    snapshot_property_address TEXT       NOT NULL,
    snapshot_amount         NUMERIC(14, 2) NOT NULL,
    snapshot_period         TEXT
);

CREATE INDEX IF NOT EXISTS idx_receipts_payment ON payment_receipts (payment_id);

-- ─── Trigger: update invoice amounts on payment confirmation ─────────────────

CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only process successful payments
    IF NEW.status = 'successful' AND (OLD.status IS NULL OR OLD.status <> 'successful') THEN
        UPDATE rent_invoices
           SET amount_paid = amount_paid + NEW.amount,
               paid_date   = CURRENT_DATE,
               status      = CASE
                               WHEN (amount_paid + NEW.amount) >= amount_due THEN 'paid'::invoice_status
                               ELSE 'partially_paid'::invoice_status
                             END,
               updated_at  = NOW()
         WHERE id = NEW.invoice_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_update_invoice
    AFTER INSERT OR UPDATE ON rent_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  rent_invoices                     IS 'Rent invoices issued per billing cycle. One per period per lease.';
COMMENT ON COLUMN rent_invoices.invoice_number      IS 'Human-readable invoice identifier. Format: INV-YYYY-NNNN.';
COMMENT ON COLUMN rent_invoices.amount_outstanding  IS 'Computed column: amount_due - amount_paid. Always current.';
COMMENT ON TABLE  rent_payments                     IS 'Immutable ledger of all payment events. Never deleted; use status for lifecycle.';
COMMENT ON COLUMN rent_payments.gateway_response    IS 'Raw JSON webhook payload from payment gateway (Paystack/Flutterwave). For audit trail.';
COMMENT ON TABLE  payment_receipts                  IS 'Legally-binding digital receipts auto-generated upon payment confirmation.';


-- =============================================================================
-- Migration: V006__create_maintenance.sql
-- Description: Maintenance request (repair ticket) workflow. Tenants submit
--              tickets, landlords triage and assign contractors, and both
--              parties can track resolution. All events are logged to a
--              timeline and synced to the property ledger.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE maintenance_category AS ENUM (
    'plumbing',
    'electrical',
    'structural',
    'pest_control',
    'appliance',
    'security',
    'cleaning',
    'hvac',
    'painting',
    'landscaping',
    'other'
);

CREATE TYPE maintenance_priority AS ENUM (
    'low',
    'medium',
    'high',
    'emergency'
);

CREATE TYPE maintenance_status AS ENUM (
    'open',             -- Submitted by tenant; not yet acknowledged
    'acknowledged',     -- Landlord has seen the ticket
    'in_progress',      -- Contractor assigned; work underway
    'pending_inspection', -- Work done; awaiting landlord/tenant sign-off
    'resolved',         -- Both parties confirm resolution
    'closed',           -- Archived after resolution
    'disputed',         -- Tenant disputes the resolution quality
    'cancelled'         -- Cancelled before resolution (e.g. false alarm)
);

-- ─── Table: maintenance_requests ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    property_id         UUID                    NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
    lease_id            UUID                    REFERENCES leases (id) ON DELETE SET NULL,
    reported_by         UUID                    NOT NULL REFERENCES users (id) ON DELETE RESTRICT,  -- Usually tenant
    assigned_to         UUID                    REFERENCES users (id) ON DELETE SET NULL,            -- Contractor / landlord

    -- Ticket details
    title               VARCHAR(255)            NOT NULL,
    description         TEXT                    NOT NULL,
    category            maintenance_category    NOT NULL DEFAULT 'other',
    priority            maintenance_priority    NOT NULL DEFAULT 'medium',
    status              maintenance_status      NOT NULL DEFAULT 'open',
    status_changed_at   TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    -- Location within property
    area_within_property VARCHAR(100),           -- e.g. "Master Bedroom", "Kitchen"

    -- Resolution
    resolution_notes    TEXT,
    resolved_at         TIMESTAMPTZ,
    tenant_confirmed_at TIMESTAMPTZ,

    -- Cost tracking
    estimated_cost      NUMERIC(14, 2),
    actual_cost         NUMERIC(14, 2),
    charged_to_tenant   BOOLEAN     NOT NULL DEFAULT FALSE,
    charge_reason       TEXT,

    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_property     ON maintenance_requests (property_id);
CREATE INDEX IF NOT EXISTS idx_maint_lease        ON maintenance_requests (lease_id);
CREATE INDEX IF NOT EXISTS idx_maint_reported_by  ON maintenance_requests (reported_by);
CREATE INDEX IF NOT EXISTS idx_maint_status       ON maintenance_requests (status);
CREATE INDEX IF NOT EXISTS idx_maint_priority     ON maintenance_requests (priority);
CREATE INDEX IF NOT EXISTS idx_maint_created      ON maintenance_requests (created_at DESC);

CREATE TRIGGER trg_maintenance_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Keep status_changed_at in sync
CREATE OR REPLACE FUNCTION sync_maintenance_status_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        NEW.status_changed_at = NOW();
        IF NEW.status = 'resolved' THEN
            NEW.resolved_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_status_ts
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION sync_maintenance_status_ts();

-- ─── Table: maintenance_media ────────────────────────────────────────────────
-- Photos/videos attached to a maintenance request or its resolution

CREATE TYPE media_stage AS ENUM (
    'report',           -- Attached when reporting the issue
    'in_progress',      -- Work-in-progress photos
    'resolution'        -- After-fix evidence
);

CREATE TABLE IF NOT EXISTS maintenance_media (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID        NOT NULL REFERENCES maintenance_requests (id) ON DELETE CASCADE,
    uploaded_by     UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    storage_url     TEXT        NOT NULL,
    thumbnail_url   TEXT,
    media_type      VARCHAR(50),                    -- MIME type
    stage           media_stage NOT NULL DEFAULT 'report',
    caption         VARCHAR(255),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_media_request ON maintenance_media (request_id, stage);

-- ─── Table: maintenance_timeline ─────────────────────────────────────────────
-- Immutable audit trail of all status changes and comments

CREATE TYPE timeline_event_type AS ENUM (
    'status_change',
    'comment',
    'contractor_assigned',
    'media_added',
    'cost_updated',
    'tenant_confirmed'
);

CREATE TABLE IF NOT EXISTS maintenance_timeline (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID                    NOT NULL REFERENCES maintenance_requests (id) ON DELETE CASCADE,
    actor_id        UUID                    REFERENCES users (id) ON DELETE SET NULL,
    event_type      timeline_event_type     NOT NULL,
    old_status      maintenance_status,
    new_status      maintenance_status,
    note            TEXT,
    metadata        JSONB,                          -- Flexible payload for event-specific data
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_timeline_request ON maintenance_timeline (request_id, created_at DESC);

-- Auto-log status changes to the timeline
CREATE OR REPLACE FUNCTION log_maintenance_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO maintenance_timeline (request_id, actor_id, event_type, old_status, new_status)
        VALUES (NEW.id, NULL, 'status_change', OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_log_status
    AFTER UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION log_maintenance_status_change();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  maintenance_requests              IS 'Repair and maintenance tickets raised against a tenanted property.';
COMMENT ON COLUMN maintenance_requests.charged_to_tenant IS 'TRUE if the landlord determines the cost is the tenant''s responsibility (e.g. tenant damage).';
COMMENT ON TABLE  maintenance_media                 IS 'Photos/videos attached to a maintenance ticket at various stages.';
COMMENT ON TABLE  maintenance_timeline              IS 'Immutable audit trail of all events on a maintenance request.';


-- =============================================================================
-- Migration: V007__create_reviews.sql
-- Description: Mutual review system. At the end of a lease (or after a set
--              period), tenants review landlords and landlords review tenants.
--              Aggregated scores feed back into users.tenant_score and
--              users.landlord_score for the platform's Reliability Scores.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE reviewer_role AS ENUM (
    'tenant',       -- Tenant reviewing their landlord
    'landlord'      -- Landlord reviewing their tenant
);

CREATE TYPE review_status AS ENUM (
    'pending',      -- Eligible but not yet submitted
    'submitted',    -- Review written; awaiting period end for visibility
    'published',    -- Visible on the platform
    'flagged',      -- Reported as inappropriate; pending moderation
    'removed'       -- Removed by moderation
);

-- ─── Table: reviews ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    lease_id        UUID            NOT NULL REFERENCES leases (id) ON DELETE RESTRICT,
    property_id     UUID            NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
    reviewer_id     UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    reviewee_id     UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    reviewer_role   reviewer_role   NOT NULL,

    -- Scores (all 1–5)
    overall_score           SMALLINT NOT NULL CHECK (overall_score BETWEEN 1 AND 5),

    -- Tenant-reviewing-landlord specific scores
    responsiveness_score    SMALLINT CHECK (responsiveness_score BETWEEN 1 AND 5),
    property_condition_score SMALLINT CHECK (property_condition_score BETWEEN 1 AND 5),
    deposit_handling_score  SMALLINT CHECK (deposit_handling_score BETWEEN 1 AND 5),
    communication_score     SMALLINT CHECK (communication_score BETWEEN 1 AND 5),

    -- Landlord-reviewing-tenant specific scores
    rent_payment_score      SMALLINT CHECK (rent_payment_score BETWEEN 1 AND 5),
    property_care_score     SMALLINT CHECK (property_care_score BETWEEN 1 AND 5),
    behaviour_score         SMALLINT CHECK (behaviour_score BETWEEN 1 AND 5),

    -- Free text
    body                    TEXT,
    is_anonymous            BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Status
    status                  review_status NOT NULL DEFAULT 'pending',
    published_at            TIMESTAMPTZ,
    flagged_at              TIMESTAMPTZ,
    flag_reason             TEXT,

    -- Moderation
    moderated_by            UUID        REFERENCES users (id) ON DELETE SET NULL,
    moderated_at            TIMESTAMPTZ,

    -- Audit
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each party can only review the other once per lease
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_per_lease
    ON reviews (lease_id, reviewer_id, reviewer_role);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer  ON reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee  ON reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property  ON reviews (property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status    ON reviews (status);

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: recompute reliability score on publish ─────────────────────────

CREATE OR REPLACE FUNCTION update_user_reliability_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_avg   NUMERIC(3, 2);
    v_count INT;
BEGIN
    -- Only run when a review is freshly published
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published') THEN

        IF NEW.reviewer_role = 'tenant' THEN
            -- Tenant reviewed landlord → update landlord_score on the reviewee
            SELECT ROUND(AVG(overall_score)::NUMERIC, 2), COUNT(*)
              INTO v_avg, v_count
              FROM reviews
             WHERE reviewee_id = NEW.reviewee_id
               AND reviewer_role = 'tenant'
               AND status = 'published';

            UPDATE users
               SET landlord_score        = v_avg,
                   landlord_review_count = v_count,
                   updated_at            = NOW()
             WHERE id = NEW.reviewee_id;

        ELSIF NEW.reviewer_role = 'landlord' THEN
            -- Landlord reviewed tenant → update tenant_score on the reviewee
            SELECT ROUND(AVG(overall_score)::NUMERIC, 2), COUNT(*)
              INTO v_avg, v_count
              FROM reviews
             WHERE reviewee_id = NEW.reviewee_id
               AND reviewer_role = 'landlord'
               AND status = 'published';

            UPDATE users
               SET tenant_score        = v_avg,
                   tenant_review_count = v_count,
                   updated_at          = NOW()
             WHERE id = NEW.reviewee_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_update_score
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_reliability_score();

-- ─── Table: review_responses ─────────────────────────────────────────────────
-- The reviewed party can reply to a published review once

CREATE TABLE IF NOT EXISTS review_responses (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID        UNIQUE NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    author_id   UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    body        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses (review_id);

CREATE TRIGGER trg_review_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  reviews                       IS 'Mutual end-of-lease reviews between tenants and landlords.';
COMMENT ON COLUMN reviews.reviewer_role         IS '"tenant" means the tenant is reviewing the landlord; "landlord" means the landlord is reviewing the tenant.';
COMMENT ON COLUMN reviews.is_anonymous          IS 'When TRUE, the reviewer''s name is hidden but the score is still counted.';
COMMENT ON TABLE  review_responses              IS 'One-time response from the reviewed party. Limited to one reply per review.';


-- =============================================================================
-- Migration: V008__create_invitations_notifications.sql
-- Description: Two supporting systems:
--   1. Invitations — Landlords invite existing/new tenants to link their
--      profile to a property (when the property is already occupied).
--   2. Notifications — In-app notification log for system events sent to
--      users (payment due, application status, maintenance update, etc.)
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 1: INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE invitation_type AS ENUM (
    'tenant_link',          -- Landlord invites an existing tenant to link to their property
    'co_landlord',          -- Invite another user to co-manage a property
    'guarantor'             -- Tenant invites a guarantor to sign
);

CREATE TYPE invitation_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired',
    'revoked'
);

CREATE TABLE IF NOT EXISTS invitations (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who sent and who should receive
    sent_by         UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    -- Target can be an existing user (recipient_user_id) or a prospective user (recipient_email)
    recipient_user_id UUID              REFERENCES users (id) ON DELETE SET NULL,
    recipient_email VARCHAR(255),       -- Used when the invitee isn't on the platform yet
    recipient_name  VARCHAR(200),       -- Display name from Add Property form

    -- Context
    invitation_type invitation_type     NOT NULL DEFAULT 'tenant_link',
    property_id     UUID                REFERENCES properties (id) ON DELETE CASCADE,
    lease_id        UUID                REFERENCES leases (id) ON DELETE SET NULL,

    -- Status
    status          invitation_status   NOT NULL DEFAULT 'pending',
    status_changed_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- Token used in the invitation link (URL-safe, cryptographically random)
    token           VARCHAR(128)        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(48), 'base64'),
    expires_at      TIMESTAMPTZ         NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- Optional message from sender
    message         TEXT,

    -- Audit
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Ensure at least one form of recipient is provided
    CONSTRAINT chk_recipient CHECK (
        recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_invitations_sent_by        ON invitations (sent_by);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_user ON invitations (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token          ON invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_status         ON invitations (status);
CREATE INDEX IF NOT EXISTS idx_invitations_property       ON invitations (property_id);

CREATE TRIGGER trg_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION sync_invitation_status_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        NEW.status_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invitation_status_ts
    BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION sync_invitation_status_ts();

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 2: NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE notification_channel AS ENUM (
    'in_app',
    'email',
    'sms',
    'push'
);

CREATE TYPE notification_type AS ENUM (
    -- Payments
    'rent_due',
    'rent_overdue',
    'payment_received',
    'payment_failed',
    'receipt_issued',

    -- Applications
    'application_received',
    'application_status_changed',
    'application_approved',
    'application_rejected',

    -- Leases
    'lease_generated',
    'lease_signed',
    'lease_expiring_soon',
    'lease_expired',

    -- Maintenance
    'maintenance_submitted',
    'maintenance_acknowledged',
    'maintenance_assigned',
    'maintenance_resolved',
    'maintenance_disputed',

    -- Invitations
    'invitation_received',
    'invitation_accepted',
    'invitation_expired',

    -- Reviews
    'review_requested',
    'review_published',
    'review_responded',

    -- System
    'account_verified',
    'system_alert',
    'general'
);

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    channel         notification_channel    NOT NULL DEFAULT 'in_app',
    notification_type notification_type     NOT NULL DEFAULT 'general',

    -- Content
    title           VARCHAR(255)            NOT NULL,
    body            TEXT                    NOT NULL,
    action_url      TEXT,                               -- Deep link / route path

    -- Related entities (optional; for UI deep-linking)
    related_entity_type VARCHAR(50),                    -- e.g. 'lease', 'maintenance_request'
    related_entity_id   UUID,

    -- Delivery
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    delivery_error  TEXT,

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index: unread notifications per user — fast badge count queries
CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notif_user_all     ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_type         ON notifications (notification_type);

-- Mark read — no update trigger needed; created_at is write-once
-- Enforce: read_at must be set when is_read flips to TRUE
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_notification_read_at();

-- ─── Table: notification_preferences ────────────────────────────────────────
-- Per-user, per-channel, per-type opt-out/opt-in settings

CREATE TABLE IF NOT EXISTS notification_preferences (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    notification_type   notification_type       NOT NULL,
    channel             notification_channel    NOT NULL,
    is_enabled          BOOLEAN                 NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, notification_type, channel)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences (user_id);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  invitations                   IS 'Invite records for linking tenants to properties or inviting co-managers.';
COMMENT ON COLUMN invitations.token             IS 'URL-safe cryptographic token embedded in the invitation link. Single-use.';
COMMENT ON COLUMN invitations.recipient_email   IS 'Email address of the invitee when they are not yet a platform user.';
COMMENT ON TABLE  notifications                 IS 'In-app and multi-channel notification log. Append-only except for is_read updates.';
COMMENT ON TABLE  notification_preferences      IS 'Per-user opt-in/out for specific notification types and channels.';


-- =============================================================================
-- Migration: V009__create_audit_and_sessions.sql
-- Description: Platform-level audit logging and user session management.
--   1. audit_log      — Immutable record of every data-changing action
--   2. user_sessions  — JWT / refresh-token session tracking
--   3. admin_actions  — Elevated admin-only action log (moderation, bans)
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 1: AUDIT LOG
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'verify',
    'approve',
    'reject',
    'publish',
    'suspend',
    'restore',
    'export'
);

CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID            REFERENCES users (id) ON DELETE SET NULL,    -- NULL = system action
    action          audit_action    NOT NULL,
    entity_type     VARCHAR(80)     NOT NULL,    -- Table name: 'leases', 'users', etc.
    entity_id       UUID,                        -- PK of the affected row
    old_values      JSONB,                       -- Snapshot before change
    new_values      JSONB,                       -- Snapshot after change
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB,                       -- Any additional context
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Audit log is append-only
CREATE RULE no_update_audit_log AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_log AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action       ON audit_log (action);

-- Partition candidate for large deployments:
-- PARTITION BY RANGE (created_at) -- monthly partitions

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 2: USER SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE session_status AS ENUM (
    'active',
    'expired',
    'revoked'
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- Token identifiers (store hashes, never plain tokens)
    access_token_jti    VARCHAR(128)    UNIQUE NOT NULL,     -- JWT ID claim (hashed)
    refresh_token_hash  VARCHAR(128)    UNIQUE,              -- Hashed refresh token

    -- Device / client info
    device_name         VARCHAR(200),
    user_agent          TEXT,
    ip_address          INET,

    -- Lifecycle
    status              session_status  NOT NULL DEFAULT 'active',
    issued_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ     NOT NULL,
    last_active_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    revoked_at          TIMESTAMPTZ
);

-- Fast lookup by token
CREATE INDEX IF NOT EXISTS idx_sessions_user          ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jti           ON user_sessions (access_token_jti);
CREATE INDEX IF NOT EXISTS idx_sessions_status        ON user_sessions (status, expires_at)
    WHERE status = 'active';

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 3: ADMIN ACTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE admin_action_type AS ENUM (
    'verify_property',
    'reject_property',
    'suspend_user',
    'reinstate_user',
    'remove_review',
    'resolve_dispute',
    'issue_warning',
    'ban_user',
    'override_payment',
    'generate_report',
    'other'
);

CREATE TABLE IF NOT EXISTS admin_actions (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    action_type     admin_action_type   NOT NULL,

    -- Target entity
    target_user_id  UUID                REFERENCES users (id) ON DELETE SET NULL,
    target_entity_type VARCHAR(80),
    target_entity_id   UUID,

    -- Outcome
    reason          TEXT,
    notes           TEXT,
    metadata        JSONB,

    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin    ON admin_actions (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target   ON admin_actions (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type     ON admin_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created  ON admin_actions (created_at DESC);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  audit_log             IS 'Immutable platform-wide audit trail of all data-mutating operations.';
COMMENT ON COLUMN audit_log.actor_id    IS 'NULL when the change was made by an automated system process.';
COMMENT ON TABLE  user_sessions         IS 'Active JWT sessions with refresh token support. Hashed tokens only.';
COMMENT ON TABLE  admin_actions         IS 'Log of privileged administrative operations for accountability.';


-- =============================================================================
-- Migration: V010__create_admin_panel.sql
-- Description: Adds the structured database layer required to power the
--              admin control panel:
--
--   1. admin_role enum + column on users
--   2. listing_approval_queue   — workflow queue for property approvals
--   3. review_moderation_queue  — workflow queue for flagged review moderation
--   4. user_management_actions  — rich action log for user management events
--   5. v_admin_dashboard_stats  — real-time aggregated stats view
--
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 1: ADMIN ROLE SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS admin_role CASCADE;
CREATE TYPE admin_role AS ENUM (
    'super_admin',  -- Full platform access; can promote/demote other admins
    'moderator',    -- Review & listing moderation only
    'support'       -- Read-only access + user communication tools
);

-- Non-breaking addition to the existing users table.
-- NULL for all non-admin users; set when primary_role = 'admin'.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS admin_role admin_role;

-- Index for fast "who are the admins?" queries on the admin panel dashboard
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users (admin_role)
    WHERE admin_role IS NOT NULL;

COMMENT ON COLUMN users.admin_role IS 'Granular admin sub-role. NULL for tenants and landlords. Set only when primary_role = ''admin''.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 2: LISTING APPROVAL QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE listing_queue_status AS ENUM (
    'queued',           -- Submitted; not yet picked up by an admin
    'under_review',     -- Assigned admin is actively reviewing
    'approved',         -- Listing verified; property.status → active_vacant
    'rejected',         -- Listing failed verification; property.status → draft
    'escalated'         -- Referred to a senior admin / super_admin
);

CREATE TYPE listing_priority AS ENUM (
    'normal',
    'high',
    'urgent'
);

CREATE TABLE IF NOT EXISTS listing_approval_queue (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The property under review
    property_id         UUID                    NOT NULL REFERENCES properties (id) ON DELETE CASCADE,

    -- Who submitted it (the landlord)
    submitted_by        UUID                    NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Workflow state
    queue_status        listing_queue_status    NOT NULL DEFAULT 'queued',
    priority            listing_priority        NOT NULL DEFAULT 'normal',

    -- Assignment
    assigned_to         UUID                    REFERENCES users (id) ON DELETE SET NULL,  -- NULL = unassigned
    assigned_at         TIMESTAMPTZ,

    -- Timeline
    submitted_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,                        -- Set when a final decision is made

    -- Decision
    decision_by         UUID                    REFERENCES users (id) ON DELETE SET NULL,
    rejection_reason    TEXT,                               -- Required when queue_status = 'rejected'

    -- Admin notes (internal, not visible to landlord)
    verification_notes  TEXT,

    -- Extensible metadata: e.g. { "documents_checked": true, "location_verified": false }
    metadata            JSONB,

    -- Audit
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- A property should only appear in the queue once per submission cycle
-- (resolved entries can be re-queued after landlord edits)
CREATE UNIQUE INDEX IF NOT EXISTS idx_laq_property_open
    ON listing_approval_queue (property_id)
    WHERE queue_status IN ('queued', 'under_review', 'escalated');

CREATE INDEX IF NOT EXISTS idx_laq_status          ON listing_approval_queue (queue_status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_laq_assigned_to     ON listing_approval_queue (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_laq_submitted_by    ON listing_approval_queue (submitted_by);
CREATE INDEX IF NOT EXISTS idx_laq_priority        ON listing_approval_queue (priority, submitted_at DESC);

CREATE TRIGGER trg_laq_updated_at
    BEFORE UPDATE ON listing_approval_queue
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sync property status when queue decision is made ────────────────

CREATE OR REPLACE FUNCTION sync_property_status_on_decision()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.queue_status <> OLD.queue_status THEN
        IF NEW.queue_status = 'approved' THEN
            UPDATE properties
               SET status     = 'active_vacant',
                   updated_at = NOW()
             WHERE id = NEW.property_id
               AND status = 'pending_review';  -- Safety guard

        ELSIF NEW.queue_status = 'rejected' THEN
            UPDATE properties
               SET status     = 'draft',
                   updated_at = NOW()
             WHERE id = NEW.property_id
               AND status = 'pending_review';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_laq_sync_property_status
    AFTER UPDATE ON listing_approval_queue
    FOR EACH ROW EXECUTE FUNCTION sync_property_status_on_decision();

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  listing_approval_queue            IS 'Admin workflow queue for verifying and approving landlord property listings.';
COMMENT ON COLUMN listing_approval_queue.priority   IS 'Escalation priority: normal → high → urgent. Urgent listings surface at the top of the admin queue.';
COMMENT ON COLUMN listing_approval_queue.metadata   IS 'Extensible JSONB for admin checklist flags, document verification state, and other structured notes.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 3: REVIEW MODERATION QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE report_reason AS ENUM (
    'spam',
    'offensive_language',
    'false_information',
    'harassment',
    'conflict_of_interest',
    'other'
);

CREATE TYPE moderation_queue_status AS ENUM (
    'open',             -- Report received; awaiting admin triage
    'under_review',     -- An admin is actively reviewing the report
    'resolved_kept',    -- Report dismissed; review remains published
    'resolved_removed', -- Review removed; review.status → removed
    'escalated'         -- Referred to super_admin for final decision
);

CREATE TABLE IF NOT EXISTS review_moderation_queue (
    id                  UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The review being moderated
    review_id           UUID                        NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,

    -- Who filed the report
    reported_by         UUID                        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    report_reason       report_reason               NOT NULL,
    report_body         TEXT,                                   -- Optional detailed explanation from reporter

    -- Workflow state
    queue_status        moderation_queue_status     NOT NULL DEFAULT 'open',

    -- Assignment
    assigned_to         UUID                        REFERENCES users (id) ON DELETE SET NULL,
    assigned_at         TIMESTAMPTZ,

    -- Moderation decision
    moderation_notes    TEXT,                                   -- Internal admin notes
    resolution_reason   TEXT,                                   -- Explanation of the decision (may be shared with reporter)
    resolved_by         UUID                        REFERENCES users (id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- A user can only file one active report per review (prevents report flooding)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rmq_unique_active_report
    ON review_moderation_queue (review_id, reported_by)
    WHERE queue_status IN ('open', 'under_review', 'escalated');

CREATE INDEX IF NOT EXISTS idx_rmq_status         ON review_moderation_queue (queue_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rmq_review         ON review_moderation_queue (review_id);
CREATE INDEX IF NOT EXISTS idx_rmq_assigned_to    ON review_moderation_queue (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rmq_report_reason  ON review_moderation_queue (report_reason);

CREATE TRIGGER trg_rmq_updated_at
    BEFORE UPDATE ON review_moderation_queue
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sync review status when moderation resolves ─────────────────────

CREATE OR REPLACE FUNCTION sync_review_status_on_moderation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.queue_status <> OLD.queue_status THEN
        IF NEW.queue_status = 'resolved_removed' THEN
            UPDATE reviews
               SET status       = 'removed',
                   moderated_by = NEW.resolved_by,
                   moderated_at = NEW.resolved_at,
                   updated_at   = NOW()
             WHERE id = NEW.review_id;

        ELSIF NEW.queue_status = 'resolved_kept' THEN
            -- Unflag the review; restore to published
            UPDATE reviews
               SET status       = 'published',
                   moderated_by = NEW.resolved_by,
                   moderated_at = NEW.resolved_at,
                   updated_at   = NOW()
             WHERE id = NEW.review_id
               AND status = 'flagged';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rmq_sync_review_status
    AFTER UPDATE ON review_moderation_queue
    FOR EACH ROW EXECUTE FUNCTION sync_review_status_on_moderation();

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  review_moderation_queue               IS 'Admin workflow queue for moderating user-reported reviews.';
COMMENT ON COLUMN review_moderation_queue.report_body   IS 'Free-text elaboration provided by the reporter. Optional.';
COMMENT ON COLUMN review_moderation_queue.resolution_reason IS 'May be surfaced to the reporter as a moderation outcome explanation.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 4: USER MANAGEMENT ACTIONS
-- ─────────────────────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS user_mgmt_action CASCADE;
CREATE TYPE user_mgmt_action AS ENUM (
    'suspend',          -- Temporarily restrict login
    'reinstate',        -- Lift a suspension
    'ban',              -- Permanent account ban
    'unban',            -- Reverse a ban
    'verify_id',        -- Manually approve NIN / identity verification
    'reject_id',        -- Reject identity verification attempt
    'promote_admin',    -- Grant admin access (sets primary_role = admin)
    'demote_admin',     -- Remove admin access
    'assign_admin_role',-- Set/change admin sub-role
    'issue_warning',    -- Formal warning (no restriction)
    'force_logout',     -- Revoke all active sessions
    'delete_account'    -- Initiate soft-delete
);

CREATE TABLE IF NOT EXISTS user_management_actions (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    target_user_id      UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Actor (the admin)
    admin_id            UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Action
    action              user_mgmt_action    NOT NULL,

    -- State snapshots (capture before/after for accountability and rollback)
    previous_state      JSONB,              -- Relevant user fields before the action
    new_state           JSONB,              -- Relevant user fields after the action

    -- Justification (mandatory for destructive actions)
    reason              TEXT                NOT NULL,

    -- Duration (for time-limited actions: suspension, temporary ban)
    expires_at          TIMESTAMPTZ,        -- NULL = permanent / indefinite

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- user_management_actions is append-only: no updates, no deletes
CREATE RULE no_update_uma AS ON UPDATE TO user_management_actions DO INSTEAD NOTHING;
CREATE RULE no_delete_uma AS ON DELETE TO user_management_actions DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_uma_target_user    ON user_management_actions (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uma_admin          ON user_management_actions (admin_id);
CREATE INDEX IF NOT EXISTS idx_uma_action         ON user_management_actions (action);
CREATE INDEX IF NOT EXISTS idx_uma_created        ON user_management_actions (created_at DESC);

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  user_management_actions               IS 'Immutable log of all admin actions taken against user accounts. Append-only for accountability.';
COMMENT ON COLUMN user_management_actions.previous_state IS 'JSONB snapshot of relevant user fields (is_active, primary_role, id_verification_status, etc.) before this action was applied.';
COMMENT ON COLUMN user_management_actions.new_state      IS 'JSONB snapshot of the same fields after this action was applied.';
COMMENT ON COLUMN user_management_actions.expires_at     IS 'For time-limited actions (suspension, temp ban). NULL means the action has no built-in expiry.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 5: ADMIN DASHBOARD STATS VIEW
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_admin_dashboard_stats AS
SELECT
    -- Listing Approval
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status IN ('queued', 'under_review'))               AS pending_listings,
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status = 'queued')                                   AS unassigned_listings,
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status = 'approved'
        AND reviewed_at >= NOW() - INTERVAL '7 days')                 AS approvals_last_7d,

    -- Review Moderation
    (SELECT COUNT(*) FROM review_moderation_queue
      WHERE queue_status IN ('open', 'under_review'))                 AS open_review_flags,
    (SELECT COUNT(*) FROM review_moderation_queue
      WHERE queue_status = 'resolved_removed'
        AND resolved_at >= NOW() - INTERVAL '7 days')                 AS removals_last_7d,

    -- User Management
    (SELECT COUNT(*) FROM users
      WHERE is_active = FALSE
        AND deleted_at IS NULL)                                        AS suspended_users,
    (SELECT COUNT(*) FROM users
      WHERE id_verification_status = 'pending'
        AND deleted_at IS NULL)                                        AS pending_verifications,
    (SELECT COUNT(*) FROM users
      WHERE primary_role = 'admin'
        AND deleted_at IS NULL)                                        AS total_admins,

    -- Platform Health
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)             AS total_users,
    (SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL)        AS total_properties,
    (SELECT COUNT(*) FROM properties
      WHERE status = 'pending_review')                                AS properties_pending_review;

COMMENT ON VIEW v_admin_dashboard_stats IS 'Real-time aggregated statistics for the admin dashboard header cards. Computed at query time — no materialisation needed at current scale.';
