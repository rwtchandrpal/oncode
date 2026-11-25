import { z } from 'zod';

// Mirrors backend/src/validation/auth.js (BUG-17). bcrypt only uses 72 bytes, so the backend rejects longer passwords.
export const PASSWORD_MAX_BYTES = 72;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .refine((p) => new TextEncoder().encode(p).length <= PASSWORD_MAX_BYTES, "Password cannot be longer than 72 bytes")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const firstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required")
  .max(50, "First name cannot exceed 50 characters");

// Optional, as on the backend
export const lastNameSchema = z
  .string()
  .trim()
  .max(50, "Last name cannot exceed 50 characters")
  .optional();

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Please enter a valid email address");

// Signup Form Schema (with confirmation)
export const signupSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Admin User Creation Schema (with role selection)
export const adminUserRegistrationSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['user', 'admin'], {
    required_error: 'Please select a role',
  })
});
