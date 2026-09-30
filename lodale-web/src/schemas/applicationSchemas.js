import { z } from "zod";

export const getApplicationSchema = (options = {}) => {
  const { requiresGuarantor = true, isEmployed = true, hasMultipleUnits = false, isFirstTimeRenting = false } = options;

  return z.object({
    unitName: hasMultipleUnits
      ? z.string().min(1, "Please select the specific unit you are applying to.")
      : z.string().optional(),
    maritalStatus: z.string().optional(),
    occupants: z.array(z.object({
      name: z.string().min(1, "Occupant name is required."),
      relationship: z.string().min(1, "Occupant relationship is required."),
      isAdult: z.boolean().default(true),
      age: z.string().optional()
    })).optional(),
    employerName: isEmployed
      ? z.string().min(1, "Employer/Business name is required when employed.")
      : z.string().optional(),
    employerContact: isEmployed
      ? z.string().min(1, "Employer contact phone or email is required when employed.")
      : z.string().optional(),
    previousAddress: isFirstTimeRenting ? z.string().optional() : z.string().min(1, "Previous address is required."),
    previousLandlordName: isFirstTimeRenting ? z.string().optional() : z.string().min(1, "Previous landlord name is required."),
    previousLandlordPhone: isFirstTimeRenting ? z.string().optional() : z.string().min(1, "Previous landlord phone is required."),
    durationOfStay: isFirstTimeRenting ? z.string().optional() : z.string().min(1, "Duration of stay is required."),
    reasonForMoving: isFirstTimeRenting ? z.string().optional() : z.string().min(1, "Reason for moving is required."),
    guarantorName: requiresGuarantor
      ? z.string().min(1, "Guarantor Full Name is required.")
      : z.string().optional(),
    guarantorPhone: requiresGuarantor
      ? z.string().min(1, "Guarantor Phone Number is required.")
      : z.string().optional(),
    guarantorRelationship: requiresGuarantor
      ? z.string().min(1, "Guarantor Relationship is required.")
      : z.string().optional(),
    guarantorEmail: z.string().optional().refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Guarantor Email must be a valid email address if provided."
    })
  });
};




