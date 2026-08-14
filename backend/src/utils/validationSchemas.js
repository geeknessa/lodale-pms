import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['tenant', 'landlord', 'admin']).optional(),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required")
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
  landlord_id: z.string().optional(),
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
