import { createHmac, timingSafeEqual } from "node:crypto";

/** Paystack works in the smallest currency unit (pesewas for GHS). */
export const toMinor = (amount: number) => Math.round(amount * 100);

const base = () => (process.env.PAYSTACK_BASE_URL || "https://api.paystack.co").replace(/\/$/, "");
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

/** Payments stay off until explicitly enabled AND a key exists. See docs/PAYMENTS.md. */
export const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === "true" && !!secret();

export function verifySignature(rawBody: string, signature: string | null, key = secret()): boolean {
  if (!signature || !key) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init, cache: "no-store",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status || !json.data) throw new Error(`Paystack ${res.status}: ${json?.message ?? "request failed"}`);
  return json.data;
}

export async function initializeTransaction(o: { email: string; amountMinor: number; currency: string; reference: string; callbackUrl: string; metadata?: Record<string, unknown> }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: o.email, amount: o.amountMinor, currency: o.currency, reference: o.reference, callback_url: o.callbackUrl, metadata: o.metadata }),
  });
}

export interface VerifiedTransaction { status: string; amount: number; currency: string; reference: string; channel?: string; paid_at?: string }

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}
