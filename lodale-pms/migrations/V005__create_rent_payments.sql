-- =============================================================================
-- Migration: V005__create_rent_payments.sql
-- Description: The financial ledger for rent payments, invoices, and
--              legally-binding digital receipts. Every payment event is
--              immutably recorded; records are never deleted.
-- Author:      Lodale PMS – Database Architecture
-- =============================================================================

-- ─── Enum Types ─────────────────────────────────────────────────────────────

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'issued',           -- Sent to tenant
    'partially_paid',
    'paid',
    'overdue',
    'waived',           -- Written off by the landlord
    'void'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'successful',
    'failed',
    'reversed',         -- Charge-back or refund initiated
    'cancelled'
);

CREATE TYPE payment_method AS ENUM (
    'bank_transfer',
    'card',
    'ussd',
    'bank_branch',
    'cash',             -- Recorded manually by landlord
    'wallet'            -- In-app wallet if implemented
);

CREATE TYPE payment_direction AS ENUM (
    'rent',
    'security_deposit',
    'agency_fee',
    'legal_fee',
    'maintenance_charge',
    'late_penalty',
    'deposit_refund',
    'other'
);

-- ─── Table: rent_invoices ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rent_invoices (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    lease_id            UUID            NOT NULL REFERENCES leases (id) ON DELETE RESTRICT,
    tenant_id           UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    landlord_id         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Invoice details
    invoice_number      VARCHAR(50)     UNIQUE NOT NULL,        -- Human-readable: INV-2025-001
    direction           payment_direction NOT NULL DEFAULT 'rent',
    amount_due          NUMERIC(14, 2)  NOT NULL,
    amount_paid         NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    amount_outstanding  NUMERIC(14, 2)  GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    currency            CHAR(3)         NOT NULL DEFAULT 'NGN',

    -- Billing period (for rent invoices)
    period_start        DATE,
    period_end          DATE,

    -- Dates
    issue_date          DATE            NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE            NOT NULL,
    paid_date           DATE,

    -- Status
    status              invoice_status  NOT NULL DEFAULT 'draft',

    -- Late fee configuration
    late_fee_rate       NUMERIC(5, 4)   DEFAULT 0.00,           -- Daily rate e.g. 0.0005 = 0.05%
    late_fee_accrued    NUMERIC(14, 2)  DEFAULT 0.00,

    -- Notes
    notes               TEXT,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_lease     ON rent_invoices (lease_id);
CREATE INDEX idx_invoices_tenant    ON rent_invoices (tenant_id);
CREATE INDEX idx_invoices_landlord  ON rent_invoices (landlord_id);
CREATE INDEX idx_invoices_status    ON rent_invoices (status);
CREATE INDEX idx_invoices_due_date  ON rent_invoices (due_date);

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON rent_invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Table: rent_payments ────────────────────────────────────────────────────
-- Immutable payment event log. One invoice can have multiple partial payments.

CREATE TABLE IF NOT EXISTS rent_payments (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    invoice_id          UUID            NOT NULL REFERENCES rent_invoices (id) ON DELETE RESTRICT,
    lease_id            UUID            NOT NULL REFERENCES leases (id) ON DELETE RESTRICT,
    paid_by             UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    received_by         UUID            NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

    -- Amount
    amount              NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    currency            CHAR(3)         NOT NULL DEFAULT 'NGN',
    direction           payment_direction NOT NULL DEFAULT 'rent',

    -- Payment channel
    method              payment_method  NOT NULL DEFAULT 'bank_transfer',
    status              payment_status  NOT NULL DEFAULT 'pending',

    -- Gateway / Reference
    gateway_reference   VARCHAR(255),               -- Paystack/Flutterwave transaction ref
    gateway_response    JSONB,                      -- Raw webhook payload stored for auditing
    internal_reference  VARCHAR(100) UNIQUE,        -- Our own idempotency key

    -- Timestamps
    initiated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    confirmed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,

    -- Manual entry (cash payments recorded by landlord)
    is_manual           BOOLEAN         NOT NULL DEFAULT FALSE,
    manual_note         TEXT,
    recorded_by         UUID            REFERENCES users (id) ON DELETE SET NULL
);

-- Payments are append-only; do NOT allow deletes
CREATE RULE no_delete_rent_payments AS
    ON DELETE TO rent_payments
    DO INSTEAD NOTHING;

CREATE INDEX idx_payments_invoice    ON rent_payments (invoice_id);
CREATE INDEX idx_payments_lease      ON rent_payments (lease_id);
CREATE INDEX idx_payments_paid_by    ON rent_payments (paid_by);
CREATE INDEX idx_payments_status     ON rent_payments (status);
CREATE INDEX idx_payments_initiated  ON rent_payments (initiated_at DESC);
CREATE INDEX idx_payments_gateway    ON rent_payments (gateway_reference)
    WHERE gateway_reference IS NOT NULL;

-- ─── Table: payment_receipts ─────────────────────────────────────────────────
-- Legally-binding digital receipts auto-generated on payment confirmation

CREATE TABLE IF NOT EXISTS payment_receipts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID        UNIQUE NOT NULL REFERENCES rent_payments (id) ON DELETE RESTRICT,
    receipt_number  VARCHAR(50) UNIQUE NOT NULL,    -- e.g. RCP-2025-00312
    document_url    TEXT,                           -- PDF stored in object storage
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Snapshot fields (preserved even if lease/user data changes)
    snapshot_tenant_name    VARCHAR(200) NOT NULL,
    snapshot_landlord_name  VARCHAR(200) NOT NULL,
    snapshot_property_address TEXT       NOT NULL,
    snapshot_amount         NUMERIC(14, 2) NOT NULL,
    snapshot_period         TEXT
);

CREATE INDEX idx_receipts_payment ON payment_receipts (payment_id);

-- ─── Trigger: update invoice amounts on payment confirmation ─────────────────

CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only process successful payments
    IF NEW.status = 'successful' AND (OLD.status IS NULL OR OLD.status <> 'successful') THEN
        UPDATE rent_invoices
           SET amount_paid = amount_paid + NEW.amount,
               paid_date   = CURRENT_DATE,
               status      = CASE
                               WHEN (amount_paid + NEW.amount) >= amount_due THEN 'paid'::invoice_status
                               ELSE 'partially_paid'::invoice_status
                             END,
               updated_at  = NOW()
         WHERE id = NEW.invoice_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_update_invoice
    AFTER INSERT OR UPDATE ON rent_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE  rent_invoices                     IS 'Rent invoices issued per billing cycle. One per period per lease.';
COMMENT ON COLUMN rent_invoices.invoice_number      IS 'Human-readable invoice identifier. Format: INV-YYYY-NNNN.';
COMMENT ON COLUMN rent_invoices.amount_outstanding  IS 'Computed column: amount_due - amount_paid. Always current.';
COMMENT ON TABLE  rent_payments                     IS 'Immutable ledger of all payment events. Never deleted; use status for lifecycle.';
COMMENT ON COLUMN rent_payments.gateway_response    IS 'Raw JSON webhook payload from payment gateway (Paystack/Flutterwave). For audit trail.';
COMMENT ON TABLE  payment_receipts                  IS 'Legally-binding digital receipts auto-generated upon payment confirmation.';
