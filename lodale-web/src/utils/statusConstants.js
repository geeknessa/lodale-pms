/**
 * Canonical Application Statuses and Labels for Lodale PMS Frontend
 */

export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  INSPECTION_PENDING: 'inspection_pending',
  DECLINED: 'declined',
  APPROVED: 'approved',
  INVOICE_ISSUED: 'invoice_issued',
  PAYMENT_PENDING: 'payment_pending',
  RENT_PAID: 'rent_paid',
  LEASE_SENT: 'lease_sent',
  LEASE_SIGNED: 'lease_signed',
  MOVED_IN: 'moved_in'
};

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.SUBMITTED]: 'Application Submitted',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'Under Review',
  [APPLICATION_STATUS.INSPECTION_PENDING]: 'Inspection Scheduled',
  [APPLICATION_STATUS.APPROVED]: 'Application Approved',
  [APPLICATION_STATUS.INVOICE_ISSUED]: 'Invoice Issued',
  [APPLICATION_STATUS.PAYMENT_PENDING]: 'Payment Pending Verification',
  [APPLICATION_STATUS.RENT_PAID]: 'Payment Completed',
  [APPLICATION_STATUS.LEASE_SENT]: 'Lease Agreement Ready',
  [APPLICATION_STATUS.LEASE_SIGNED]: 'Lease Agreement Signed',
  [APPLICATION_STATUS.MOVED_IN]: 'Move-in Complete',
  [APPLICATION_STATUS.DECLINED]: 'Declined'
};

export const INVOICE_STATUS = {
  UNPAID: 'unpaid',
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

export const LEASE_STATUS = {
  DRAFT: 'draft',
  AWAITING_SIGNATURE: 'awaiting_signature',
  PARTIALLY_SIGNED: 'partially_signed',
  FULLY_SIGNED: 'fully_signed',
  ACTIVE: 'active',
  CANCELLED: 'cancelled'
};

export const INSPECTION_STATUS = {
  REQUESTED: 'requested',
  SCHEDULED: 'scheduled',
  COMPLETED_PASSED: 'completed_passed',
  COMPLETED_FAILED: 'completed_failed',
  CANCELLED: 'cancelled'
};

export const PLATFORM_FEE_PERCENT = 3.5;
