import { z } from "zod";

/**
 * Password must be at least 8 characters, contain:
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(
    /[^A-Za-z0-9]/,
    "Must contain a special character"
  );

/**
 * Email: normalized to lowercase, validated for format.
 * For registration, we require a Gmail address.
 */
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .transform((v) => v.toLowerCase().trim());

const registerEmailSchema = z
  .string()
  .email("Please enter a valid email address")
  .refine((v) => v.toLowerCase().endsWith("@gmail.com"), {
    message: "Email must end with @gmail.com",
  })
  .transform((v) => v.toLowerCase().trim());

/* ── Public schemas ─────────────────────────────────────────────── */

export const registerSchema = z
  .object({
    email: registerEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ── Per-field schemas (for client-side validation) ────────────── */

export const passwordFieldSchema = passwordSchema;
export const registerEmailFieldSchema = registerEmailSchema;

/* ── Type exports ───────────────────────────────────────────────── */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
