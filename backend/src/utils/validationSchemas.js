import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['tenant', 'landlord']).optional(),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required")
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone_number: z.string().optional(),
  avatar_url: z.string().optional()
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  propertyId: z.string().optional().nullable(),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long")
});

export const applyPropertySchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  notes: z.string().optional().nullable(),
  monthlyIncome: z.union([z.number(), z.string()]).optional().nullable(),
  employmentStatus: z.string().optional().nullable(),
  employerName: z.string().optional().nullable(),
  employerContact: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  dependants: z.union([z.number(), z.string()]).optional().nullable(),
  guarantorName: z.string().optional().nullable(),
  guarantorPhone: z.string().optional().nullable(),
  guarantorRelationship: z.string().optional().nullable(),
  guarantorEmail: z.string().email().optional().or(z.literal('')).nullable(),
  unitName: z.string().optional().nullable()
}).passthrough();

export const generateLeaseSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  applicationId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  rentAmount: z.number().positive("Rent amount must be positive").or(z.string().transform(Number)),
  rentPeriod: z.string().min(1, "Rent period is required"),
  securityDeposit: z.number().nonnegative().optional().or(z.string().transform(Number).optional()),
  customClauses: z.string().optional(),
  includePets: z.boolean().optional(),
  includeSmoking: z.boolean().optional(),
  includeLateFee: z.boolean().optional()
});

export const createPropertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  address_line1: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  rent_amount: z.number().nonnegative("Rent amount cannot be negative").or(z.string().transform(Number)).optional().default(0),
  bedrooms: z.number().min(0).optional().or(z.string().transform(Number).optional()),
  bathrooms: z.number().min(0).optional().or(z.string().transform(Number).optional()),
  property_type: z.string().optional(),
  latitude: z.union([z.number(), z.string().transform(Number)]).nullable().optional(),
  longitude: z.union([z.number(), z.string().transform(Number)]).nullable().optional(),
  amenities: z.array(z.string()).optional(),
  ownership_doc: z.string().optional(),
  ownership_doc_url: z.string().optional(),
  ownership_doc_type: z.string().optional(),
  rules: z.union([z.string(), z.array(z.string())]).optional(),
  cover_image: z.string().optional(),
  images: z.array(z.string()).optional(),
  is_occupied: z.boolean().optional(),
  tenant_name: z.string().nullable().optional(),
  tenant_contact: z.string().nullable().optional(),
  lease_start_date: z.string().nullable().optional(),
  available_from: z.string().nullable().optional(),
  landlord_id: z.string().optional(),
  blocks: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  units: z.array(z.object({
    id: z.string().optional(),
    unit_name: z.string(),
    block_name: z.string().optional(),
    bedrooms: z.number().min(0).optional().or(z.string().transform(Number).optional()),
    bathrooms: z.number().min(0).optional().or(z.string().transform(Number).optional()),
    rent_amount: z.number().nonnegative().optional().or(z.string().transform(Number).optional()),
    rent_period: z.string().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
    amenities: z.string().optional(),
    rules: z.string().optional(),
    images: z.array(z.string()).optional()
  })).optional()
});

export const reviewPropertySchema = z.object({
  action: z.enum(['approve', 'reject', 'request_info'], { errorMap: () => ({ message: "Action must be approve, reject, or request_info" }) }),
  reason: z.string().optional(),
  notes: z.string().optional()
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required")
});

export const updateApplicationStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable()
}).passthrough();

export const createMaintenanceSchema = z.object({
  propertyId: z.string().min(1).optional(),
  property_id: z.string().min(1).optional(),
  unitId: z.string().optional().nullable(),
  unit_id: z.string().optional().nullable(),
  title: z.string().optional(),
  issue_title: z.string().optional(),
  issueType: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  priority: z.string().optional(),
  category: z.string().optional(),
  photos: z.array(z.string()).optional()
}).passthrough().refine(data => data.propertyId || data.property_id, {
  message: "Property ID is required",
  path: ["propertyId"]
});

export const updateMaintenanceStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional().nullable()
}).passthrough();

export const createInvoiceSchema = z.object({
  propertyId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  landlordId: z.string().optional().nullable(),
  amount: z.number().positive("Amount must be positive").or(z.string().transform(Number)).optional(),
  grandTotal: z.number().positive("Amount must be positive").or(z.string().transform(Number)).optional(),
  subtotal: z.number().optional().nullable().or(z.string().transform(Number)),
  lodaleFee: z.number().optional().nullable().or(z.string().transform(Number)),
  dueDate: z.string().min(1, "Due date is required"),
  issueDate: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  items: z.any().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  note: z.string().optional().nullable()
}).passthrough();

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").or(z.string().transform(Number)).optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional().default('Bank Transfer'),
  reference: z.string().optional().nullable(),
  paymentReference: z.string().optional().nullable(),
  paymentProofUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable()
}).passthrough();

export const propertyActionSchema = z.object({
  reason: z.string().optional(),
  notes: z.string().optional()
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.string().min(1, "Type is required"),
  title: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  read: z.boolean().optional()
});

export const updateUserStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  reason: z.string().optional()
});

const supportTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  category: z.string().optional(),
  priority: z.string().optional()
});

const supportReplySchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  message: z.string().min(1, "Message is required")
});
export const payRestorationFeeSchema = z.object({
  paymentReference: z.string().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters")
});

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email format")
});

export const verifyEmailChangeSchema = z.object({
  code: z.string().min(1, "Verification code is required")
});

export const deactivateAccountSchema = z.object({
  reason: z.string().optional()
});
