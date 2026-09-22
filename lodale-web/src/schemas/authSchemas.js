import { z } from "zod";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const signUpSchema = z.object({
  email: z.string().min(1, "Missing Information: Please enter your email address to complete registration.").email("Invalid Email Address: Please enter a valid email address (e.g. name@example.com)."),
  password: z.string().min(1, "Missing Information: Please enter your password to complete registration.").regex(passwordRegex, "Password Not Secure Enough: It needs to include at least 8 characters, an uppercase letter, a number, and a special symbol."),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "Please accept the Terms of Service & Privacy Policy to create your account." }),
  }),
});
