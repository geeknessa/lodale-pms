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
CREATE UNIQUE INDEX idx_reviews_unique_per_lease
    ON reviews (lease_id, reviewer_id, reviewer_role);

CREATE INDEX idx_reviews_reviewer  ON reviews (reviewer_id);
CREATE INDEX idx_reviews_reviewee  ON reviews (reviewee_id);
CREATE INDEX idx_reviews_property  ON reviews (property_id);
CREATE INDEX idx_reviews_status    ON reviews (status);

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

CREATE INDEX idx_review_responses_review ON review_responses (review_id);

CREATE TRIGGER trg_review_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  reviews                       IS 'Mutual end-of-lease reviews between tenants and landlords.';
COMMENT ON COLUMN reviews.reviewer_role         IS '"tenant" means the tenant is reviewing the landlord; "landlord" means the landlord is reviewing the tenant.';
COMMENT ON COLUMN reviews.is_anonymous          IS 'When TRUE, the reviewer''s name is hidden but the score is still counted.';
COMMENT ON TABLE  review_responses              IS 'One-time response from the reviewed party. Limited to one reply per review.';
