import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { toMinor, verifyTransaction } from "@/lib/payments/paystack";

export type SettleResult = "paid" | "already_paid" | "failed" | "mismatch" | "unknown" | "error";

/**
 * Confirms a payment with the gateway and records it. Safe to call repeatedly (callback page
 * and webhook both call it). Nothing from the browser or the webhook body is trusted: the
 * gateway is asked directly, and the result is compared with the amount WE stored.
 */
export async function settlePayment(reference: string): Promise<SettleResult> {
  const db = createAdminClient();
  const { data: payment } = await db.from("booking_payments").select("*").eq("reference", reference).maybeSingle();
  if (!payment) return "unknown";
  if (payment.status === "paid") return "already_paid";

  let tx;
  try { tx = await verifyTransaction(reference); }
  catch (e) { console.error("[payments] verify failed", e); return "error"; }

  if (tx.status !== "success") {
    if (["failed", "abandoned", "reversed"].includes(tx.status)) {
      await db.from("booking_payments").update({ status: "failed", provider_response: tx }).eq("id", payment.id).neq("status", "paid");
      return "failed";
    }
    return "error"; // still pending at the gateway
  }

  const { data: booking } = await db.from("bookings").select("*").eq("id", payment.booking_id).single();
  const expected = toMinor(Number(payment.amount));
  if (!booking || tx.reference !== reference || tx.amount !== expected || tx.currency !== payment.currency
      || Number(booking.total_amount) !== Number(payment.amount) || booking.status !== "awaiting_payment") {
    console.error("[payments] mismatch", { reference, got: tx.amount, expected, currency: tx.currency });
    await db.from("booking_payments").update({ status: "failed", provider_response: { ...tx, note: "mismatch" } }).eq("id", payment.id).neq("status", "paid");
    return "mismatch";
  }

  // Commission uses the plan of the provider's listing at the time of payment.
  let pct = 0;
  const listingId = booking.listing_id ?? (booking.experience_id ? (await db.from("experiences").select("provider_listing_id").eq("id", booking.experience_id).maybeSingle()).data?.provider_listing_id : null);
  if (listingId) {
    const { data: l } = await db.from("listings").select("plan_id").eq("id", listingId).maybeSingle();
    const plan = l?.plan_id
      ? (await db.from("subscription_plans").select("commission_percent").eq("id", l.plan_id).maybeSingle()).data
      : (await db.from("subscription_plans").select("commission_percent").eq("slug", "free").maybeSingle()).data;
    pct = Number(plan?.commission_percent ?? 0);
  }
  const commission = Math.round(Number(payment.amount) * pct) / 100;

  // Only the first call flips awaiting_payment -> paid (guarded by the status filter).
  const { data: updated } = await db.from("bookings")
    .update({ status: "paid", payment_status: "paid", commission_amount: commission })
    .eq("id", booking.id).eq("status", "awaiting_payment").select("id");
  if (!updated?.length) return "already_paid";

  await db.from("booking_payments").update({ status: "paid", method: tx.channel ?? null, provider_response: tx, paid_at: tx.paid_at ?? new Date().toISOString() }).eq("id", payment.id);
  await db.from("booking_status_history").insert({ booking_id: booking.id, from_status: "awaiting_payment", to_status: "paid", actor_kind: "system", note: `Paystack ${reference}` });
  return "paid";
}
