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


// This is the enforcer for the "New Idea" form
export const ideaBankSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  source: z.string().min(1, "Source is required"),
  tags: z.string().min(1, "At least one tag is required"), // I will handle turning this into an array later
  isPublic: z.boolean().default(false),
  image: z.object({
    url: z.string().min(1, "Image URL is required"),
    id: z.string().min(1, "Image ID is required"),
  }, { message: "Please select an image" }),
});
export const opportunitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  organizationName: z.string().min(1, "Organization is required"),
  description: z.string().min(1, "Description is required"),
  externalLink: z.string().url("Invalid URL").or(z.string().length(0)), // URL or empty
  isPublic: z.boolean(),
  tags: z.string().min(1, "Tags are required"),
  deadlineDate: z.string().optional(),
  image: z.object({
    url: z.string(),
    id: z.string(),
  }),
});

export const reinvestSchema = z.object({
  projectId: z.string(),
  investments: z.array(
    z.object({
      investorId: z.string(),
      amount: z.number().min(0, "Amount must be positive"),
    })
  ),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type IdeaBankFormData = z.infer<typeof ideaBankSchema>;
export type OpportunityFormData = z.infer<typeof opportunitySchema>;
export type ReinvestData = z.infer<typeof reinvestSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type VerifyData = z.infer<typeof verifySchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;