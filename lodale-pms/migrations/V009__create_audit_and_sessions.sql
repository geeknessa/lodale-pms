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

CREATE INDEX idx_audit_actor        ON audit_log (actor_id);
CREATE INDEX idx_audit_entity       ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_created      ON audit_log (created_at DESC);
CREATE INDEX idx_audit_action       ON audit_log (action);

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
CREATE INDEX idx_sessions_user          ON user_sessions (user_id);
CREATE INDEX idx_sessions_jti           ON user_sessions (access_token_jti);
CREATE INDEX idx_sessions_status        ON user_sessions (status, expires_at)
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

CREATE INDEX idx_admin_actions_admin    ON admin_actions (admin_id);
CREATE INDEX idx_admin_actions_target   ON admin_actions (target_user_id);
CREATE INDEX idx_admin_actions_type     ON admin_actions (action_type);
CREATE INDEX idx_admin_actions_created  ON admin_actions (created_at DESC);

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  audit_log             IS 'Immutable platform-wide audit trail of all data-mutating operations.';
COMMENT ON COLUMN audit_log.actor_id    IS 'NULL when the change was made by an automated system process.';
COMMENT ON TABLE  user_sessions         IS 'Active JWT sessions with refresh token support. Hashed tokens only.';
COMMENT ON TABLE  admin_actions         IS 'Log of privileged administrative operations for accountability.';
