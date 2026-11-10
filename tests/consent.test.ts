import { describe, expect, it } from "vitest";
import { ACCEPT_ALL, CONSENT_COOKIE, CONSENT_VERSION, REJECT_ALL, allowed, cookieString, isAnalyticsCookie, needsAsking, parseConsent, serialise } from "@/lib/consent";

const NOW = Date.UTC(2026, 10, 9);
const header = (c: ReturnType<typeof ACCEPT_ALL>) => `a=1; ${CONSENT_COOKIE}=${serialise(c)}; b=2`;

describe("cookie consent logic", () => {
  it("asks when there is no choice, and treats garbage as no choice", () => {
    expect(needsAsking(null, NOW)).toBe(true);
    expect(parseConsent("")).toBeNull();
    expect(parseConsent(`${CONSENT_COOKIE}=not-json`)).toBeNull();
    expect(parseConsent(`${CONSENT_COOKIE}=${encodeURIComponent('{"v":1}')}`)).toBeNull();
  });
  it("round-trips a choice through the cookie", () => {
    const c = { ...REJECT_ALL(NOW), analytics: true };
    expect(parseConsent(header(c))).toEqual(c);
    expect(cookieString(c, true)).toContain("SameSite=Lax; Secure");
    expect(cookieString(c, false)).not.toContain("Secure");
  });
  it("nothing optional is allowed before a choice, after rejecting, or after the choice expires", () => {
    expect(allowed(null, "analytics", NOW)).toBe(false);
    expect(allowed(REJECT_ALL(NOW), "analytics", NOW)).toBe(false);
    expect(allowed(ACCEPT_ALL(NOW), "analytics", NOW)).toBe(true);
    expect(allowed(ACCEPT_ALL(NOW), "analytics", NOW + 400 * 864e5)).toBe(false);          // expired after the default 12 months
    expect(allowed(ACCEPT_ALL(NOW), "analytics", NOW + 100 * 864e5, 3)).toBe(false);        // configurable period
  });
  it("categories are independent", () => {
    const c = { ...REJECT_ALL(NOW), functional: true };
    expect(allowed(c, "functional", NOW)).toBe(true);
    expect(allowed(c, "analytics", NOW)).toBe(false);
    expect(allowed(c, "advertising", NOW)).toBe(false);
  });
  it("asks again when the categories change or the date is implausible", () => {
    expect(needsAsking({ ...ACCEPT_ALL(NOW), v: CONSENT_VERSION - 1 }, NOW)).toBe(true);
    expect(needsAsking(ACCEPT_ALL(NOW + 30 * 864e5), NOW)).toBe(true);
    expect(needsAsking(ACCEPT_ALL(NOW), NOW + 864e5)).toBe(false);
  });
  it("recognises analytics cookies for removal", () => {
    for (const n of ["_ga", "_ga_ABC123", "_gid", "_gat_gtag_G_X"]) expect(isAnalyticsCookie(n)).toBe(true);
    for (const n of ["vasa_consent", "sb-access-token", "gallery"]) expect(isAnalyticsCookie(n)).toBe(false);
  });
});
