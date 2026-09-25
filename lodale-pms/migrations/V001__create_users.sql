-- =============================================================================
-- Migration: V001__create_users.sql
-- Description: Creates the core users table and supporting enums/types.
--              Users can be tenants, landlords, or both (dual-role).
--              Identity verification is performed via NIMC NIN lookup.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
    'tenant',
    'landlord',
    'admin'
);

CREATE TYPE auth_provider AS ENUM (
    'email',
    'google',
    'apple'
);

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
    phone_number        VARCHAR(20),

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
CREATE UNIQUE INDEX idx_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

-- OAuth accounts need a unique (provider, provider_id) tuple
CREATE UNIQUE INDEX idx_users_oauth
    ON users (auth_provider, oauth_provider_id)
    WHERE oauth_provider_id IS NOT NULL;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_users_primary_role ON users (primary_role);
CREATE INDEX idx_users_created_at   ON users (created_at DESC);
CREATE INDEX idx_users_deleted_at   ON users (deleted_at) WHERE deleted_at IS NOT NULL;

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
