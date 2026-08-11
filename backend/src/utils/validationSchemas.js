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
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  address_line1: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required").optional(),
  state: z.string().min(2, "State is required").optional(),
  rent_amount: z.number().positive("Rent amount must be positive").or(z.string().regex(/^\d+$/).transform(Number)),
  bedrooms: z.number().min(0).optional().or(z.string().regex(/^\d+$/).transform(Number).optional()),
  bathrooms: z.number().min(0).optional().or(z.string().regex(/^\d+$/).transform(Number).optional()),
  property_type: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  landlord_id: z.string().uuid().optional(),
  ownership_doc: z.string().optional(),
  ownership_doc_url: z.string().optional()
});

export const reviewPropertySchema = z.object({
  action: z.enum(['approve', 'reject', 'request_info'], { errorMap: () => ({ message: "Action must be approve, reject, or request_info" }) }),
  reason: z.string().optional(),
  notes: z.string().optional()
});
