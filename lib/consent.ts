/**
 * Cookie consent: pure logic shared by the banner and the tests.
 * The choice is kept in a first-party cookie (never localStorage), so the server and the browser agree and nothing needs a script to read it.
 * Necessary cookies (sign-in session, this consent record) are always on and are not part of the choice.
 */
export const CONSENT_COOKIE = "vasa_consent";
/** Bump this when the categories change: everyone is asked again. */
export const CONSENT_VERSION = 1;

export interface ConsentChoice { v: number; ts: number; functional: boolean; analytics: boolean; advertising: boolean }
export type OptionalCategory = "functional" | "analytics" | "advertising";

export const REJECT_ALL = (now: number): ConsentChoice => ({ v: CONSENT_VERSION, ts: now, functional: false, analytics: false, advertising: false });
export const ACCEPT_ALL = (now: number): ConsentChoice => ({ v: CONSENT_VERSION, ts: now, functional: true, analytics: true, advertising: true });

export function serialise(c: ConsentChoice): string { return encodeURIComponent(JSON.stringify(c)); }

/** Reads the choice out of a `document.cookie` string. Anything malformed counts as "no choice yet". */
export function parseConsent(cookieHeader: string | undefined | null): ConsentChoice | null {
  if (!cookieHeader) return null;
  const part = cookieHeader.split(/;\s*/).find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  if (!part) return null;
  try {
    const o = JSON.parse(decodeURIComponent(part.slice(CONSENT_COOKIE.length + 1)));
    if (typeof o?.v !== "number" || typeof o?.ts !== "number") return null;
    return { v: o.v, ts: o.ts, functional: o.functional === true, analytics: o.analytics === true, advertising: o.advertising === true };
  } catch { return null; }
}

/** True when the visitor must be asked: no choice, an older version of the categories, or the choice is too old. */
export function needsAsking(c: ConsentChoice | null, now: number, reaskMonths = 12): boolean {
  if (!c || c.v !== CONSENT_VERSION) return true;
  const maxAge = Math.max(1, reaskMonths) * 30 * 864e5;
  return now - c.ts > maxAge || c.ts > now + 864e5;       // expired, or a clock/date that is not plausible
}

/** Optional categories only count as allowed while a valid choice exists. */
export const allowed = (c: ConsentChoice | null, k: OptionalCategory, now: number, reaskMonths = 12): boolean => !needsAsking(c, now, reaskMonths) && c![k] === true;

export function cookieString(c: ConsentChoice, secure: boolean): string {
  return `${CONSENT_COOKIE}=${serialise(c)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Names of cookies set by Google Analytics, removed when analytics consent is withdrawn. */
export const isAnalyticsCookie = (name: string) => name === "_ga" || name.startsWith("_ga_") || name === "_gid" || name.startsWith("_gat");
