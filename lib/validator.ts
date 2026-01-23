import {z} from "zod";

// define the login schema
export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 characters"),
  
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});


// Forgot password schema
export const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
});
// 1. Sign Up Schema
export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
});

// 2. Verification Schema (For the SMS code)
export const verifySchema = z.object({
  phoneNumber: z.string(),
  verificationCode: z.string().min(4, "Code must be at least 4 digits"),
});
// Reset Password Schema
export const resetPasswordSchema = z.object({
  phoneNumber: z.string(),
  passwordResetCode: z.string().min(1, "Verification code is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export type SignUpData = z.infer<typeof signUpSchema>;
export type VerifyData = z.infer<typeof verifySchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;