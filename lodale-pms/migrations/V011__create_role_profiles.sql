-- =============================================================================
-- Migration: V011__create_role_profiles.sql
-- Description: Decouples base authentication identity from role-specific dashboard profiles.
-- Prevents cross-dashboard profile mutation and state leak between Admin, Landlord, and Tenant.
-- =============================================================================

-- 1. Tenant Profiles Table
CREATE TABLE IF NOT EXISTS tenant_profiles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    first_name              VARCHAR(100)    NOT NULL DEFAULT '',
    last_name               VARCHAR(100)    NOT NULL DEFAULT '',
    phone_number            VARCHAR(25),
    avatar_url              TEXT,
    bio                     TEXT,
    address                 TEXT,
    dob                     DATE,
    location                VARCHAR(150),
    postal_code             VARCHAR(20),
    
    -- Tenant-specific attributes
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(25),
    employment_status       VARCHAR(50),
    annual_income           NUMERIC(14,2),
    preferred_move_in_date  DATE,
    
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 2. Landlord Profiles Table
CREATE TABLE IF NOT EXISTS landlord_profiles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    first_name              VARCHAR(100)    NOT NULL DEFAULT '',
    last_name               VARCHAR(100)    NOT NULL DEFAULT '',
    phone_number            VARCHAR(25),
    avatar_url              TEXT,
    bio                     TEXT,
    address                 TEXT,
    dob                     DATE,
    location                VARCHAR(150),
    postal_code             VARCHAR(20),
    
    -- Landlord & Business Payout attributes
    company_name            VARCHAR(200),
    tax_identification_no   VARCHAR(50),
    bank_name               VARCHAR(100),
    bank_account_name       VARCHAR(150),
    bank_account_number     VARCHAR(30),
    payout_frequency        VARCHAR(30)     DEFAULT 'monthly',
    
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 3. Admin Profiles Table
CREATE TABLE IF NOT EXISTS admin_profiles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    display_name            VARCHAR(150)    NOT NULL DEFAULT 'System Admin',
    username                VARCHAR(100)    NOT NULL DEFAULT 'admin',
    phone_number            VARCHAR(25),
    avatar_url              TEXT,
    department              VARCHAR(100)    DEFAULT 'Operations',
    admin_level             VARCHAR(50)     DEFAULT 'superadmin',
    permissions             JSONB           DEFAULT '["all"]'::jsonb,
    
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user_id ON tenant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_user_id ON landlord_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);

-- Auto-update updated_at triggers
CREATE TRIGGER trg_tenant_profiles_updated_at
    BEFORE UPDATE ON tenant_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_landlord_profiles_updated_at
    BEFORE UPDATE ON landlord_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
