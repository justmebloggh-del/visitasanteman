"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isUserFacing, type BookingRow } from "@/lib/bookings";
import { SITE_URL, supabaseConfigured } from "@/lib/env";
import { sendEmail } from "@/lib/notifications/email";
import { initializeTransaction, paymentsEnabled, toMinor } from "@/lib/payments/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { zodErrors } from "@/lib/validations/forms";

export interface BookingFormState { ok?: boolean; message?: string; errors?: Record<string, string>; reference?: string }
export interface LookupState { message?: string; errors?: Record<string, string>; booking?: BookingRow; email?: string; notice?: string }

const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").optional().or(z.literal(""));
const createSchema = z.object({
  kind: z.enum(["accommodation", "experience", "table"]),
  listing_id: z.string().uuid().optional().or(z.literal("")),
  experience_id: z.string().uuid().optional().or(z.literal("")),
  room_type_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: z.string().trim().max(40).optional(),
  check_in: optionalDate, check_out: optionalDate, date: optionalDate,
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, "Choose a valid time").optional().or(z.literal("")),
  guests: z.coerce.number({ message: "Enter the number of guests" }).int().min(1, "At least 1 guest").max(500),
  notes: z.string().trim().max(2000).optional(),
  website: z.string().max(200).optional(),   // honeypot
});

export async function createBookingRequest(_prev: BookingFormState, fd: FormData): Promise<BookingFormState> {
  const parsed = createSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true, message: "Request received.", reference: "VLB-00000000" };
  if (!supabaseConfigured) return { ok: false, message: "Booking requests are not available yet." };
  if (!(await rateLimit("booking", 6, 10 * 60_000))) return { ok: false, message: "Too many requests. Please wait a few minutes." };

  const supabase = await createClient();   // user session if signed in, so the booking is linked to their account
  const { data, error } = await supabase.rpc("create_booking", {
    p_kind: d.kind, p_listing: d.listing_id || null, p_experience: d.experience_id || null, p_room: d.room_type_id || null,
    p_name: d.name, p_email: d.email, p_phone: d.phone || null, p_check_in: d.check_in || null, p_check_out: d.check_out || null,
    p_date: d.date || null, p_time: d.time || null, p_guests: d.guests, p_notes: d.notes || null,
  });
  if (error) {
    if (isUserFacing(error)) return { ok: false, message: error.message };
    console.error("[booking]", error.message);
    return { ok: false, message: "Sorry, we could not send your request. Please try again or contact the provider directly." };
  }
  const reference = data as string;

  // Best-effort emails. The saved request is the source of truth.
  await sendEmail({ to: d.email, subject: `Booking request ${reference}`,
    text: `Hello ${d.name},\n\nWe received your booking request ${reference}. This is a request, not a confirmed booking. The provider will confirm availability and price by email.\n\nCheck its status any time: ${SITE_URL}/booking` });
  const pub = createPublicClient();
  const { data: provider } = d.kind === "experience"
    ? await pub.from("experiences").select("provider:listings!provider_listing_id(email)").eq("id", d.experience_id!).maybeSingle()
    : await pub.from("listings").select("email").eq("id", d.listing_id!).maybeSingle();
  const providerEmail = (provider as { email?: string; provider?: { email?: string } } | null)?.email ?? (provider as { provider?: { email?: string } } | null)?.provider?.email;
  if (providerEmail) await sendEmail({ to: providerEmail, replyTo: d.email, subject: `New booking request ${reference}`, text: `${d.name} (${d.email}) requested a booking, ref ${reference}, ${d.guests} guest(s). Confirm it in your partner portal or by replying.` });

  return { ok: true, reference, message: "Request sent." };
}

/* ───────────── Guest self-service (reference + email) ───────────── */
const lookupSchema = z.object({ reference: z.string().trim().min(6).max(20), email: z.string().trim().toLowerCase().email() });

async function findBooking(reference: string, email: string): Promise<BookingRow | null> {
  const { data } = await (await createClient()).rpc("lookup_booking", { p_ref: reference, p_email: email });
  return ((data as BookingRow[] | null) ?? [])[0] ?? null;
}

export async function lookupBooking(_prev: LookupState, fd: FormData): Promise<LookupState> {
  const parsed = lookupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { message: "Enter your booking reference and the email you used." };
  if (!supabaseConfigured) return { message: "Booking lookup is not available yet." };
  if (!(await rateLimit("booking-lookup", 10, 10 * 60_000))) return { message: "Too many attempts. Please wait a few minutes." };
  const booking = await findBooking(parsed.data.reference, parsed.data.email);
  // Same message whether the reference or the email was wrong.
  if (!booking) return { message: "We could not find a booking with those details." };
  return { booking, email: parsed.data.email };
}

export async function cancelMyBooking(reference: string, email: string, _prev: LookupState, fd: FormData): Promise<LookupState> {
  if (!(await rateLimit("booking-cancel", 10, 10 * 60_000))) return { message: "Too many attempts. Please wait a few minutes." };
  const { error } = await (await createClient()).rpc("guest_cancel_booking", { p_ref: reference, p_email: email, p_reason: String(fd.get("reason") ?? "").slice(0, 500) || null });
  if (error) return { message: isUserFacing(error) ? error.message : "Could not cancel. Please contact the provider.", email };
  const booking = await findBooking(reference, email);
  return { booking: booking ?? undefined, email, notice: "Your booking has been cancelled." };
}

export async function reviewMyBooking(reference: string, email: string, _prev: LookupState, fd: FormData): Promise<LookupState> {
  const rating = Number(fd.get("rating"));
  const { error } = await (await createClient()).rpc("submit_review", { p_ref: reference, p_email: email, p_rating: rating, p_comment: String(fd.get("comment") ?? "").slice(0, 2000) });
  const booking = await findBooking(reference, email);
  if (error) return { booking: booking ?? undefined, email, message: isUserFacing(error) ? error.message : "Could not save your review." };
  return { booking: booking ?? undefined, email, notice: "Thank you. Your review will appear after it has been checked." };
}

/** Starts an online payment. The amount is read from the database, never from the browser. */
export async function payForBooking(reference: string, email: string): Promise<void> {
  if (!paymentsEnabled()) redirect("/booking?error=payments-off");
  if (!(await rateLimit("booking-pay", 8, 10 * 60_000))) redirect("/booking?error=rate");
  const booking = await findBooking(reference, email);
  if (!booking || booking.status !== "awaiting_payment" || !booking.total_amount) redirect("/booking?error=not-payable");

  const db = createAdminClient();
  const payRef = `VLBP-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const { error: insErr } = await db.from("booking_payments").insert({ booking_id: booking.id, reference: payRef, amount: booking.total_amount, currency: booking.currency, status: "pending" });
  if (insErr) { console.error("[pay] insert", insErr.message); redirect("/booking?error=payment"); }

  let url: string | null = null;
  try {
    const init = await initializeTransaction({
      email, amountMinor: toMinor(Number(booking.total_amount)), currency: booking.currency, reference: payRef,
      callbackUrl: `${SITE_URL}/booking/payment-return`, metadata: { booking_reference: booking.reference },
    });
    url = init.authorization_url;
  } catch (e) {
    console.error("[pay] init", e);
    await db.from("booking_payments").update({ status: "failed" }).eq("reference", payRef);
  }
  if (!url) redirect("/booking?error=payment");
  redirect(url);
}
