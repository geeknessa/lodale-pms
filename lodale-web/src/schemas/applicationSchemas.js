import { z } from "zod";

export const applicationSchema = z.object({
  monthlyIncome: z.string().min(1, "Annual Income Range is strictly required."),
  employmentStatus: z.string().min(1, "Employment Status is strictly required."),
  employerName: z.string().min(1, "Employer Name is strictly required."),
  occupation: z.string().min(1, "Occupation is strictly required."),
  maritalStatus: z.string().min(1, "Marital Status is strictly required."),
  dependants: z.string().min(1, "Number of Dependants is strictly required."),
  guarantorName: z.string().min(1, "Guarantor details (Full Name) is mandatory for submitting an application."),
  guarantorPhone: z.string().min(1, "Guarantor details (Phone Number) is mandatory for submitting an application."),
  guarantorEmail: z.string().min(1, "Guarantor details (Email) is mandatory for submitting an application.").email("Guarantor Email must be a valid email address."),
  guarantorRelationship: z.string().min(1, "Guarantor details (Relationship) is mandatory for submitting an application.")
});
