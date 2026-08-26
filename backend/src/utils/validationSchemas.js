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
  notes: z.string().optional(),
  monthlyIncome: z.union([z.number(), z.string()]).optional(),
  employmentStatus: z.string().optional(),
  employerName: z.string().optional(),
  occupation: z.string().optional(),
  maritalStatus: z.string().optional(),
  dependants: z.union([z.number(), z.string()]).optional(),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorRelationship: z.string().optional(),
  guarantorEmail: z.string().email().optional().or(z.literal(''))
});

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
  rules: z.string().optional(),
  cover_image: z.string().optional(),
  images: z.array(z.string()).optional(),
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
    status: z.string().optional()
  })).optional()
});

export const reviewPropertySchema = z.object({
  action: z.enum(['approve', 'reject', 'request_info'], { errorMap: () => ({ message: "Action must be approve, reject, or request_info" }) }),
  reason: z.string().optional(),
  notes: z.string().optional()
});
