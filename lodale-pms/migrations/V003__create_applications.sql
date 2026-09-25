-- =============================================================================
-- Migration: V003__create_applications.sql
-- Description: Manages tenant applications to vacant property listings.
--              Applications bundle the tenant's verified profile and any
--              required supporting documents for the landlord's review.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

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
CREATE UNIQUE INDEX idx_applications_active_unique
    ON applications (property_id, tenant_id)
    WHERE status NOT IN ('rejected', 'withdrawn', 'expired');

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_applications_property      ON applications (property_id);
CREATE INDEX idx_applications_tenant        ON applications (tenant_id);
CREATE INDEX idx_applications_status        ON applications (status);
CREATE INDEX idx_applications_created       ON applications (created_at DESC);

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

CREATE INDEX idx_app_docs_application ON application_documents (application_id);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  applications                          IS 'Tenant rental applications to specific property listings.';
COMMENT ON COLUMN applications.snapshot_full_name       IS 'Full name captured at submission time; not affected by later profile edits.';
COMMENT ON COLUMN applications.snapshot_nin_verified    IS 'NIN verification flag captured at submission to prevent backdating.';
COMMENT ON TABLE  application_documents                 IS 'Supporting documents requested by a landlord for an application.';
