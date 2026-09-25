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

CREATE INDEX idx_invitations_sent_by        ON invitations (sent_by);
CREATE INDEX idx_invitations_recipient_user ON invitations (recipient_user_id);
CREATE INDEX idx_invitations_token          ON invitations (token);
CREATE INDEX idx_invitations_status         ON invitations (status);
CREATE INDEX idx_invitations_property       ON invitations (property_id);

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
CREATE INDEX idx_notif_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX idx_notif_user_all     ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notif_type         ON notifications (notification_type);

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

CREATE INDEX idx_notif_prefs_user ON notification_preferences (user_id);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  invitations                   IS 'Invite records for linking tenants to properties or inviting co-managers.';
COMMENT ON COLUMN invitations.token             IS 'URL-safe cryptographic token embedded in the invitation link. Single-use.';
COMMENT ON COLUMN invitations.recipient_email   IS 'Email address of the invitee when they are not yet a platform user.';
COMMENT ON TABLE  notifications                 IS 'In-app and multi-channel notification log. Append-only except for is_read updates.';
COMMENT ON TABLE  notification_preferences      IS 'Per-user opt-in/out for specific notification types and channels.';
