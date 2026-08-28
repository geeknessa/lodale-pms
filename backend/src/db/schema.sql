-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone_number VARCHAR(50),
    primary_role VARCHAR(20) NOT NULL DEFAULT 'tenant',
    id_verification_status VARCHAR(50) DEFAULT 'unverified',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    property_type VARCHAR(50),
    address_line1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    rent_amount NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    rent_period VARCHAR(20) DEFAULT 'annually',
    status VARCHAR(50) DEFAULT 'pending_review',
    cover_image TEXT,
    ownership_doc TEXT,
    ownership_doc_url TEXT,
    rules TEXT,
    images TEXT,
    is_occupied BOOLEAN DEFAULT false,
    tenant_name VARCHAR(255),
    tenant_contact VARCHAR(255),
    lease_start_date DATE,
    available_from DATE,
    deletion_reason TEXT,
    minimum_income_required NUMERIC(20, 2) DEFAULT 0.00,
    requires_guarantor BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTY AMENITIES TABLE
CREATE TABLE IF NOT EXISTS property_amenities (
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity VARCHAR(100) NOT NULL,
    PRIMARY KEY (property_id, amenity)
);

-- LANDLORD PROFILES TABLE (role-specific attributes for landlords)
CREATE TABLE IF NOT EXISTS landlord_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),                  -- e.g. 'individual', 'company', 'agency'
    tax_id VARCHAR(100),
    bank_name VARCHAR(150),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(150),
    total_properties_managed INTEGER DEFAULT 0,
    years_in_business INTEGER,
    professional_license VARCHAR(100),
    website_url TEXT,
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TENANT PROFILES TABLE (role-specific attributes for tenants)
CREATE TABLE IF NOT EXISTS tenant_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    nationality VARCHAR(100),
    occupation VARCHAR(150),
    employer_name VARCHAR(255),
    employment_status VARCHAR(50),               -- e.g. 'employed', 'self_employed', 'student', 'unemployed'
    monthly_income NUMERIC(15, 2),
    marital_status VARCHAR(50),                  -- e.g. 'single', 'married', 'divorced'
    number_of_dependants SMALLINT DEFAULT 0,
    guarantor_name VARCHAR(255),
    guarantor_phone VARCHAR(50),
    guarantor_email VARCHAR(255),
    guarantor_relationship VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    preferred_move_in_date DATE,
    max_budget NUMERIC(15, 2),
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LISTING APPROVAL QUEUE TABLE
CREATE TABLE IF NOT EXISTS listing_approval_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    queue_status VARCHAR(50) DEFAULT 'queued',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- PROPERTY APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS property_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, tenant_id)
);

-- LEASES TABLE
CREATE TABLE IF NOT EXISTS leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    application_id UUID UNIQUE REFERENCES property_applications(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC(20, 2) NOT NULL,
    rent_period VARCHAR(20) NOT NULL,
    security_deposit NUMERIC(20, 2) DEFAULT 0.00,
    custom_clauses TEXT,
    include_pets BOOLEAN DEFAULT false,
    include_smoking BOOLEAN DEFAULT false,
    include_late_fee BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft',
    tenant_signed_at TIMESTAMPTZ,
    landlord_signed_at TIMESTAMPTZ,
    tenant_signature_ip VARCHAR(50),
    landlord_signature_ip VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RENT INVOICES TABLE
CREATE TABLE IF NOT EXISTS rent_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'overdue'
    billing_period_start DATE,
    billing_period_end DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RENT PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS rent_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES rent_invoices(id) ON DELETE SET NULL,
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'bank_transfer', 'card'
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MAINTENANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(30) DEFAULT 'medium', -- 'low', 'medium', 'high', 'emergency'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
