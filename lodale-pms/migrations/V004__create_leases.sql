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
CREATE UNIQUE INDEX idx_leases_property_active
    ON leases (property_id)
    WHERE status = 'active';

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_leases_property    ON leases (property_id);
CREATE INDEX idx_leases_tenant      ON leases (tenant_id);
CREATE INDEX idx_leases_landlord    ON leases (landlord_id);
CREATE INDEX idx_leases_status      ON leases (status);
CREATE INDEX idx_leases_end_date    ON leases (end_date);           -- For renewal/expiry jobs

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

CREATE INDEX idx_lease_clauses_lease ON lease_clauses (lease_id, sort_order);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  leases                        IS 'Digital tenancy agreements between a landlord and a tenant.';
COMMENT ON COLUMN leases.rent_amount            IS 'Rent amount frozen at the time of signing. Independent of property.rent_amount.';
COMMENT ON COLUMN leases.previous_lease_id      IS 'Self-referential FK forming a renewal chain. NULL for initial leases.';
COMMENT ON COLUMN leases.deposit_held_by        IS 'References the user (usually landlord) or escrow account holding the deposit.';
COMMENT ON TABLE  lease_clauses                 IS 'Custom clauses appended by either party beyond the standard lease template.';
