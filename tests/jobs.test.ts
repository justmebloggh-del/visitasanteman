import { describe, expect, it } from "vitest";
import { applicationSchema, checkCv, employerSchema, reportSchema, vacancySchema } from "@/lib/validations/jobs";

const pdf = new TextEncoder().encode("%PDF-1.7 rest");
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const base = { title: "Front desk officer", employment_type: "full_time", description: "Greet guests and manage bookings." };

describe("CV checks", () => {
  it("accepts a real PDF and a real docx", () => {
    expect(checkCv("cv.pdf", 1000, pdf)).toEqual({ ok: true, ext: "pdf" });
    expect(checkCv("CV.DOCX", 1000, zip)).toEqual({ ok: true, ext: "docx" });
  });
  it("refuses renamed or disguised files", () => {
    expect(checkCv("cv.pdf", 1000, zip).ok).toBe(false);
    expect(checkCv("cv.docx", 1000, pdf).ok).toBe(false);
    expect(checkCv("run.exe", 1000, new Uint8Array([0x4d, 0x5a])).ok).toBe(false);
    expect(checkCv("cv.pdf.exe", 1000, pdf).ok).toBe(false);
  });
  it("refuses empty and oversized files", () => {
    expect(checkCv("cv.pdf", 0, pdf).ok).toBe(false);
    expect(checkCv("cv.pdf", 5 * 1024 * 1024 + 1, pdf).ok).toBe(false);
  });
});

describe("vacancy validation", () => {
  it("accepts a minimal vacancy", () => expect(vacancySchema.safeParse(base).success).toBe(true));
  it("rejects an unknown employment type and a short description", () => {
    expect(vacancySchema.safeParse({ ...base, employment_type: "volunteer" }).success).toBe(false);
    expect(vacancySchema.safeParse({ ...base, description: "Too short" }).success).toBe(false);
  });
  it("requires a pay period when pay is given and a sensible range", () => {
    expect(vacancySchema.safeParse({ ...base, salary_min: "1000" }).success).toBe(false);
    expect(vacancySchema.safeParse({ ...base, salary_min: "1000", salary_period: "month" }).success).toBe(true);
    expect(vacancySchema.safeParse({ ...base, salary_min: "2000", salary_max: "1000", salary_period: "month" }).success).toBe(false);
    expect(vacancySchema.safeParse({ ...base, salary_min: "-5", salary_period: "month" }).success).toBe(false);
  });
  it("treats blank optional fields as absent", () => {
    const r = vacancySchema.safeParse({ ...base, salary_min: "", salary_max: "", category_id: "", administrative_area_id: "", application_deadline: "" });
    expect(r.success).toBe(true);
  });
});

describe("other job forms", () => {
  it("employer needs a name and a proper web address", () => {
    expect(employerSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(employerSchema.safeParse({ name: "Ashanti Lodge", website: "javascript:alert(1)" }).success).toBe(false);
    expect(employerSchema.safeParse({ name: "Ashanti Lodge", website: "https://example.org" }).success).toBe(true);
    expect(employerSchema.safeParse({ name: "Ashanti Lodge", website: "" }).success).toBe(true);
  });
  it("applications need a vacancy id and a name; reports need a known reason", () => {
    expect(applicationSchema.safeParse({ vacancy_id: "nope", applicant_name: "Ama Mensah" }).success).toBe(false);
    expect(applicationSchema.safeParse({ vacancy_id: "00000000-0000-4000-8000-000000000001", applicant_name: "Ama Mensah" }).success).toBe(true);
    expect(reportSchema.safeParse({ vacancy_id: "00000000-0000-4000-8000-000000000001", reason: "bribery" }).success).toBe(false);
    expect(reportSchema.safeParse({ vacancy_id: "00000000-0000-4000-8000-000000000001", reason: "asks_for_payment" }).success).toBe(true);
  });
});
