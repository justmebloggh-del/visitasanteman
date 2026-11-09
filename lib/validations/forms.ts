import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

export const enquirySchema = z.object({
  kind: z.enum([
    "general", "accommodation", "experience", "table_reservation", "investment", "partnership", "business_listing",
  ]),
  name: text(120).min(1, "Please enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: text(40).optional().or(z.literal("")),
  message: text(4000).min(10, "Please write a short message (at least 10 characters)"),
  listing_id: z.string().uuid().optional().or(z.literal("")),
  experience_id: z.string().uuid().optional().or(z.literal("")),
  investment_id: z.string().uuid().optional().or(z.literal("")),
  organisation: text(150).optional().or(z.literal("")),
  // Optional request details (dates, guests). Kept in a JSON column.
  date_from: text(10).optional().or(z.literal("")),
  date_to: text(10).optional().or(z.literal("")),
  guests: z.coerce.number().int().min(1).max(500).optional().or(z.literal("")),
  website: text(200).optional(), // honeypot: real users leave this empty
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  website: text(200).optional(), // honeypot
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  full_name: text(120).min(2, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
