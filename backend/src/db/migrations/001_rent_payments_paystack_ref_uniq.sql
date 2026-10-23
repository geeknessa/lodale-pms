-- Migration: Add unique index on rent_payments for Paystack references
--
-- IMPORTANT: Before applying this migration, the operator must first check for existing duplicates:
-- SELECT reference_number, COUNT(*) FROM rent_payments WHERE payment_method = 'Paystack' GROUP BY 1 HAVING COUNT(*) > 1;
-- (the index will fail if duplicates exist).
--

CREATE UNIQUE INDEX IF NOT EXISTS rent_payments_paystack_ref_uniq ON rent_payments (reference_number) WHERE payment_method = 'Paystack';
