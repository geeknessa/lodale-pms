-- =============================================================================
-- Migration: V002__create_properties.sql
-- Description: Creates the properties, property_amenities, and
--              property_images tables. A property can be publicly listed
--              (vacant) or privately managed (occupied).
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE property_type AS ENUM (
    'apartment',
    'duplex',
    'bungalow',
    'semi_detached',
    'detached',
    'terraced',
    'studio',
    'room_and_parlour',
    'mansion',
    'commercial'
);

CREATE TYPE property_status AS ENUM (
    'draft',            -- Saved but not yet submitted for review
    'pending_review',   -- Submitted; awaiting ownership verification
    'active_vacant',    -- Verified and accepting applications
    'active_occupied',  -- Tenant-linked; not publicly listed
    'inactive',         -- Taken off market by the landlord
    'suspended'         -- Suspended by an admin
);

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

CREATE INDEX idx_properties_landlord  ON properties (landlord_id);
CREATE INDEX idx_properties_status    ON properties (status);
CREATE INDEX idx_properties_city      ON properties (city);
CREATE INDEX idx_properties_bedrooms  ON properties (bedrooms);
CREATE INDEX idx_properties_rent      ON properties (rent_amount);
CREATE INDEX idx_properties_location  ON properties (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search: combine title + address for fast keyword search
CREATE INDEX idx_properties_fts ON properties
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

CREATE INDEX idx_property_amenities_property ON property_amenities (property_id);

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

CREATE INDEX idx_property_images_property   ON property_images (property_id, sort_order);

-- Ensure only one cover image per property
CREATE UNIQUE INDEX idx_property_images_cover
    ON property_images (property_id)
    WHERE is_cover = TRUE;

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  properties                    IS 'Rental property listings managed by landlords.';
COMMENT ON COLUMN properties.slug               IS 'URL-safe unique identifier used in public-facing listing URLs.';
COMMENT ON COLUMN properties.rent_amount        IS 'Rent amount in Nigerian Naira (NGN). Denomination matches rent_period.';
COMMENT ON COLUMN properties.current_tenant_id  IS 'Denormalised FK to the current active tenant. Derived from active lease.';
COMMENT ON TABLE  property_amenities            IS 'Variable-length list of amenity tags attached to a property.';
COMMENT ON TABLE  property_images               IS 'Media assets (photos) associated with a property listing.';
