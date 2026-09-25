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

CREATE INDEX idx_maint_property     ON maintenance_requests (property_id);
CREATE INDEX idx_maint_lease        ON maintenance_requests (lease_id);
CREATE INDEX idx_maint_reported_by  ON maintenance_requests (reported_by);
CREATE INDEX idx_maint_status       ON maintenance_requests (status);
CREATE INDEX idx_maint_priority     ON maintenance_requests (priority);
CREATE INDEX idx_maint_created      ON maintenance_requests (created_at DESC);

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

CREATE INDEX idx_maint_media_request ON maintenance_media (request_id, stage);

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

CREATE INDEX idx_maint_timeline_request ON maintenance_timeline (request_id, created_at DESC);

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
