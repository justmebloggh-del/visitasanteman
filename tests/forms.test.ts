import { describe, expect, it } from "vitest";
import { enquirySchema, newsletterSchema, registerSchema } from "@/lib/validations/forms";
import { safeUrl, slugify, whatsappLink, formatDuration } from "@/lib/utils";

describe("form schemas", () => {
  it("accepts a valid enquiry and normalises the email", () => {
    const r = enquirySchema.safeParse({ kind: "general", name: "Ama", email: " AMA@Example.com ", message: "Is the lake open on Sundays?" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ama@example.com");
  });
  it("rejects short messages, bad emails and unknown kinds", () => {
    expect(enquirySchema.safeParse({ kind: "general", name: "A", email: "x", message: "hi" }).success).toBe(false);
    expect(enquirySchema.safeParse({ kind: "hack", name: "A", email: "a@b.co", message: "long enough message" }).success).toBe(false);
  });
  it("validates newsletter emails and registration passwords", () => {
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(registerSchema.safeParse({ full_name: "Ama K", email: "a@b.co", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ full_name: "Ama K", email: "a@b.co", password: "longenough1" }).success).toBe(true);
  });
  it("registration schema carries no role field", () => {
    const r = registerSchema.safeParse({ full_name: "Ama K", email: "a@b.co", password: "longenough1", role: "super_admin" });
    expect(r.success && "role" in r.data).toBe(false);
  });
});

describe("utils", () => {
  it("slugifies", () => expect(slugify("  Old Brodekwano! ")).toBe("old-brodekwano"));
  it("only allows http(s) urls", () => {
    expect(safeUrl("https://example.com")).toBeTruthy();
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,x")).toBeNull();
  });
  it("builds whatsapp links from digits only", () => {
    expect(whatsappLink("+233 24 000 0000")).toBe("https://wa.me/233240000000");
    expect(whatsappLink("12")).toBeNull();
  });
  it("formats durations", () => { expect(formatDuration(90)).toBe("1 h 30 min"); expect(formatDuration(null)).toBeNull(); });
});
