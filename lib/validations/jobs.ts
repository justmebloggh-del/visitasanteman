import { z } from "zod";
import { CV_MAX_BYTES, EMPLOYMENT_TYPES, salaryPeriods } from "@/config/jobs";

const text = (max: number) => z.string().trim().max(max);
const optionalNumber = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).max(10_000_000).optional());
const optionalUuid = z.preprocess((v) => (v === "" ? undefined : v), z.string().uuid().optional());

export const employerSchema = z.object({
  name: text(150).min(2, "Enter your organisation's name"),
  description: text(3000).optional().or(z.literal("")),
  website: text(300).refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full web address starting with https://").optional().or(z.literal("")),
  administrative_area_id: optionalUuid,
});

export const vacancySchema = z.object({
  title: text(150).min(3, "Enter a job title"),
  employment_type: z.enum(EMPLOYMENT_TYPES, { message: "Choose an employment type" }),
  category_id: optionalUuid,
  administrative_area_id: optionalUuid,
  location_note: text(200).optional().or(z.literal("")),
  description: text(8000).min(20, "Describe the role (at least 20 characters)"),
  requirements: text(4000).optional().or(z.literal("")),
  qualifications: text(1000).optional().or(z.literal("")),
  experience_required: text(300).optional().or(z.literal("")),
  salary_min: optionalNumber,
  salary_max: optionalNumber,
  salary_period: z.enum(Object.keys(salaryPeriods) as [string, ...string[]]).optional().or(z.literal("")),
  application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").optional().or(z.literal("")),
}).superRefine((v, ctx) => {
  if (v.salary_min != null && v.salary_max != null && v.salary_max < v.salary_min) ctx.addIssue({ code: "custom", path: ["salary_max"], message: "The maximum cannot be below the minimum" });
  if ((v.salary_min != null || v.salary_max != null) && !v.salary_period) ctx.addIssue({ code: "custom", path: ["salary_period"], message: "Say whether the pay is per hour, day, week, month or year" });
});

export const applicationSchema = z.object({
  vacancy_id: z.string().uuid(),
  applicant_name: text(120).min(2, "Enter your full name"),
  applicant_phone: text(40).optional().or(z.literal("")),
  cover_note: text(3000).optional().or(z.literal("")),
  website: text(200).optional(),   // honeypot
});

export const reportSchema = z.object({
  vacancy_id: z.string().uuid(),
  reason: z.enum(["asks_for_payment", "looks_fake", "discriminatory", "misleading", "other"], { message: "Choose a reason" }),
  details: text(1000).optional().or(z.literal("")),
});

/** Checks a CV by its actual leading bytes as well as its name, so a renamed file is refused. Returns an error message or the stored extension. */
export function checkCv(name: string, size: number, head: Uint8Array): { ok: true; ext: "pdf" | "docx" } | { ok: false; message: string } {
  if (size <= 0) return { ok: false, message: "The CV file is empty." };
  if (size > CV_MAX_BYTES) return { ok: false, message: "The CV must be 5 MB or smaller." };
  const ext = name.toLowerCase().split(".").pop();
  const isPdf = head.length >= 5 && String.fromCharCode(...head.slice(0, 5)) === "%PDF-";
  const isZip = head.length >= 4 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (ext === "pdf" && isPdf) return { ok: true, ext: "pdf" };
  if (ext === "docx" && isZip) return { ok: true, ext: "docx" };
  return { ok: false, message: "Upload your CV as a PDF or Word (.docx) file." };
}
