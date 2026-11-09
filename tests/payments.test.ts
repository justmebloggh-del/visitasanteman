import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { toMinor, verifySignature } from "@/lib/payments/paystack";

describe("payments helpers", () => {
  it("converts to pesewas without float drift", () => {
    expect(toMinor(450)).toBe(45000);
    expect(toMinor(19.99)).toBe(1999);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
  it("accepts only a correct HMAC-SHA512 signature", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "VLBP-1" } });
    const good = createHmac("sha512", "sk_test").update(body).digest("hex");
    expect(verifySignature(body, good, "sk_test")).toBe(true);
    expect(verifySignature(body + " ", good, "sk_test")).toBe(false);   // tampered body
    expect(verifySignature(body, good, "other")).toBe(false);           // wrong key
    expect(verifySignature(body, null, "sk_test")).toBe(false);
    expect(verifySignature(body, "abc", "sk_test")).toBe(false);
  });
});
