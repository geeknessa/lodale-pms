-- =============================================================================
-- Migration: V010__create_admin_panel.sql
-- Description: Adds the structured database layer required to power the
--              admin control panel:
--
--   1. admin_role enum + column on users
--   2. listing_approval_queue   — workflow queue for property approvals
--   3. review_moderation_queue  — workflow queue for flagged review moderation
--   4. user_management_actions  — rich action log for user management events
--   5. v_admin_dashboard_stats  — real-time aggregated stats view
--
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  PART 1: ADMIN ROLE SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE admin_role AS ENUM (
    'super_admin',  -- Full platform access; can promote/demote other admins
    'moderator',    -- Review & listing moderation only
    'support'       -- Read-only access + user communication tools
);

-- Non-breaking addition to the existing users table.
-- NULL for all non-admin users; set when primary_role = 'admin'.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS admin_role admin_role;

-- Index for fast "who are the admins?" queries on the admin panel dashboard
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users (admin_role)
    WHERE admin_role IS NOT NULL;

COMMENT ON COLUMN users.admin_role IS 'Granular admin sub-role. NULL for tenants and landlords. Set only when primary_role = ''admin''.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 2: LISTING APPROVAL QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE listing_queue_status AS ENUM (
    'queued',           -- Submitted; not yet picked up by an admin
    'under_review',     -- Assigned admin is actively reviewing
    'approved',         -- Listing verified; property.status → active_vacant
    'rejected',         -- Listing failed verification; property.status → draft
    'escalated'         -- Referred to a senior admin / super_admin
);

CREATE TYPE listing_priority AS ENUM (
    'normal',
    'high',
    'urgent'
);

CREATE TABLE IF NOT EXISTS listing_approval_queue (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The property under review
    property_id         UUID                    NOT NULL REFERENCES properties (id) ON DELETE CASCADE,

    -- Who submitted it (the landlord)
    submitted_by        UUID                    NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Workflow state
    queue_status        listing_queue_status    NOT NULL DEFAULT 'queued',
    priority            listing_priority        NOT NULL DEFAULT 'normal',

    -- Assignment
    assigned_to         UUID                    REFERENCES users (id) ON DELETE SET NULL,  -- NULL = unassigned
    assigned_at         TIMESTAMPTZ,

    -- Timeline
    submitted_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,                        -- Set when a final decision is made

    -- Decision
    decision_by         UUID                    REFERENCES users (id) ON DELETE SET NULL,
    rejection_reason    TEXT,                               -- Required when queue_status = 'rejected'

    -- Admin notes (internal, not visible to landlord)
    verification_notes  TEXT,

    -- Extensible metadata: e.g. { "documents_checked": true, "location_verified": false }
    metadata            JSONB,

    -- Audit
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- A property should only appear in the queue once per submission cycle
-- (resolved entries can be re-queued after landlord edits)
CREATE UNIQUE INDEX idx_laq_property_open
    ON listing_approval_queue (property_id)
    WHERE queue_status IN ('queued', 'under_review', 'escalated');

CREATE INDEX idx_laq_status          ON listing_approval_queue (queue_status, submitted_at DESC);
CREATE INDEX idx_laq_assigned_to     ON listing_approval_queue (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_laq_submitted_by    ON listing_approval_queue (submitted_by);
CREATE INDEX idx_laq_priority        ON listing_approval_queue (priority, submitted_at DESC);

CREATE TRIGGER trg_laq_updated_at
    BEFORE UPDATE ON listing_approval_queue
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sync property status when queue decision is made ────────────────

CREATE OR REPLACE FUNCTION sync_property_status_on_decision()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.queue_status <> OLD.queue_status THEN
        IF NEW.queue_status = 'approved' THEN
            UPDATE properties
               SET status     = 'active_vacant',
                   updated_at = NOW()
             WHERE id = NEW.property_id
               AND status = 'pending_review';  -- Safety guard

        ELSIF NEW.queue_status = 'rejected' THEN
            UPDATE properties
               SET status     = 'draft',
                   updated_at = NOW()
             WHERE id = NEW.property_id
               AND status = 'pending_review';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_laq_sync_property_status
    AFTER UPDATE ON listing_approval_queue
    FOR EACH ROW EXECUTE FUNCTION sync_property_status_on_decision();

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  listing_approval_queue            IS 'Admin workflow queue for verifying and approving landlord property listings.';
COMMENT ON COLUMN listing_approval_queue.priority   IS 'Escalation priority: normal → high → urgent. Urgent listings surface at the top of the admin queue.';
COMMENT ON COLUMN listing_approval_queue.metadata   IS 'Extensible JSONB for admin checklist flags, document verification state, and other structured notes.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 3: REVIEW MODERATION QUEUE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE report_reason AS ENUM (
    'spam',
    'offensive_language',
    'false_information',
    'harassment',
    'conflict_of_interest',
    'other'
);

CREATE TYPE moderation_queue_status AS ENUM (
    'open',             -- Report received; awaiting admin triage
    'under_review',     -- An admin is actively reviewing the report
    'resolved_kept',    -- Report dismissed; review remains published
    'resolved_removed', -- Review removed; review.status → removed
    'escalated'         -- Referred to super_admin for final decision
);

CREATE TABLE IF NOT EXISTS review_moderation_queue (
    id                  UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The review being moderated
    review_id           UUID                        NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,

    -- Who filed the report
    reported_by         UUID                        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    report_reason       report_reason               NOT NULL,
    report_body         TEXT,                                   -- Optional detailed explanation from reporter

    -- Workflow state
    queue_status        moderation_queue_status     NOT NULL DEFAULT 'open',

    -- Assignment
    assigned_to         UUID                        REFERENCES users (id) ON DELETE SET NULL,
    assigned_at         TIMESTAMPTZ,

    -- Moderation decision
    moderation_notes    TEXT,                                   -- Internal admin notes
    resolution_reason   TEXT,                                   -- Explanation of the decision (may be shared with reporter)
    resolved_by         UUID                        REFERENCES users (id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- A user can only file one active report per review (prevents report flooding)
CREATE UNIQUE INDEX idx_rmq_unique_active_report
    ON review_moderation_queue (review_id, reported_by)
    WHERE queue_status IN ('open', 'under_review', 'escalated');

CREATE INDEX idx_rmq_status         ON review_moderation_queue (queue_status, created_at DESC);
CREATE INDEX idx_rmq_review         ON review_moderation_queue (review_id);
CREATE INDEX idx_rmq_assigned_to    ON review_moderation_queue (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_rmq_report_reason  ON review_moderation_queue (report_reason);

CREATE TRIGGER trg_rmq_updated_at
    BEFORE UPDATE ON review_moderation_queue
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sync review status when moderation resolves ─────────────────────

CREATE OR REPLACE FUNCTION sync_review_status_on_moderation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.queue_status <> OLD.queue_status THEN
        IF NEW.queue_status = 'resolved_removed' THEN
            UPDATE reviews
               SET status       = 'removed',
                   moderated_by = NEW.resolved_by,
                   moderated_at = NEW.resolved_at,
                   updated_at   = NOW()
             WHERE id = NEW.review_id;

        ELSIF NEW.queue_status = 'resolved_kept' THEN
            -- Unflag the review; restore to published
            UPDATE reviews
               SET status       = 'published',
                   moderated_by = NEW.resolved_by,
                   moderated_at = NEW.resolved_at,
                   updated_at   = NOW()
             WHERE id = NEW.review_id
               AND status = 'flagged';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rmq_sync_review_status
    AFTER UPDATE ON review_moderation_queue
    FOR EACH ROW EXECUTE FUNCTION sync_review_status_on_moderation();

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  review_moderation_queue               IS 'Admin workflow queue for moderating user-reported reviews.';
COMMENT ON COLUMN review_moderation_queue.report_body   IS 'Free-text elaboration provided by the reporter. Optional.';
COMMENT ON COLUMN review_moderation_queue.resolution_reason IS 'May be surfaced to the reporter as a moderation outcome explanation.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 4: USER MANAGEMENT ACTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_mgmt_action AS ENUM (
    'suspend',          -- Temporarily restrict login
    'reinstate',        -- Lift a suspension
    'ban',              -- Permanent account ban
    'unban',            -- Reverse a ban
    'verify_id',        -- Manually approve NIN / identity verification
    'reject_id',        -- Reject identity verification attempt
    'promote_admin',    -- Grant admin access (sets primary_role = admin)
    'demote_admin',     -- Remove admin access
    'assign_admin_role',-- Set/change admin sub-role
    'issue_warning',    -- Formal warning (no restriction)
    'force_logout',     -- Revoke all active sessions
    'delete_account'    -- Initiate soft-delete
);

CREATE TABLE IF NOT EXISTS user_management_actions (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    target_user_id      UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Actor (the admin)
    admin_id            UUID                NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Action
    action              user_mgmt_action    NOT NULL,

    -- State snapshots (capture before/after for accountability and rollback)
    previous_state      JSONB,              -- Relevant user fields before the action
    new_state           JSONB,              -- Relevant user fields after the action

    -- Justification (mandatory for destructive actions)
    reason              TEXT                NOT NULL,

    -- Duration (for time-limited actions: suspension, temporary ban)
    expires_at          TIMESTAMPTZ,        -- NULL = permanent / indefinite

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- user_management_actions is append-only: no updates, no deletes
CREATE RULE no_update_uma AS ON UPDATE TO user_management_actions DO INSTEAD NOTHING;
CREATE RULE no_delete_uma AS ON DELETE TO user_management_actions DO INSTEAD NOTHING;

CREATE INDEX idx_uma_target_user    ON user_management_actions (target_user_id, created_at DESC);
CREATE INDEX idx_uma_admin          ON user_management_actions (admin_id);
CREATE INDEX idx_uma_action         ON user_management_actions (action);
CREATE INDEX idx_uma_created        ON user_management_actions (created_at DESC);

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE  user_management_actions               IS 'Immutable log of all admin actions taken against user accounts. Append-only for accountability.';
COMMENT ON COLUMN user_management_actions.previous_state IS 'JSONB snapshot of relevant user fields (is_active, primary_role, id_verification_status, etc.) before this action was applied.';
COMMENT ON COLUMN user_management_actions.new_state      IS 'JSONB snapshot of the same fields after this action was applied.';
COMMENT ON COLUMN user_management_actions.expires_at     IS 'For time-limited actions (suspension, temp ban). NULL means the action has no built-in expiry.';


-- ─────────────────────────────────────────────────────────────────────────────
--  PART 5: ADMIN DASHBOARD STATS VIEW
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_admin_dashboard_stats AS
SELECT
    -- Listing Approval
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status IN ('queued', 'under_review'))               AS pending_listings,
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status = 'queued')                                   AS unassigned_listings,
    (SELECT COUNT(*) FROM listing_approval_queue
      WHERE queue_status = 'approved'
        AND reviewed_at >= NOW() - INTERVAL '7 days')                 AS approvals_last_7d,

    -- Review Moderation
    (SELECT COUNT(*) FROM review_moderation_queue
      WHERE queue_status IN ('open', 'under_review'))                 AS open_review_flags,
    (SELECT COUNT(*) FROM review_moderation_queue
      WHERE queue_status = 'resolved_removed'
        AND resolved_at >= NOW() - INTERVAL '7 days')                 AS removals_last_7d,

    -- User Management
    (SELECT COUNT(*) FROM users
      WHERE is_active = FALSE
        AND deleted_at IS NULL)                                        AS suspended_users,
    (SELECT COUNT(*) FROM users
      WHERE id_verification_status = 'pending'
        AND deleted_at IS NULL)                                        AS pending_verifications,
    (SELECT COUNT(*) FROM users
      WHERE primary_role = 'admin'
        AND deleted_at IS NULL)                                        AS total_admins,

    -- Platform Health
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)             AS total_users,
    (SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL)        AS total_properties,
    (SELECT COUNT(*) FROM properties
      WHERE status = 'pending_review')                                AS properties_pending_review;

COMMENT ON VIEW v_admin_dashboard_stats IS 'Real-time aggregated statistics for the admin dashboard header cards. Computed at query time — no materialisation needed at current scale.';
