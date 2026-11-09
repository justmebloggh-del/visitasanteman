"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { statusLabels, isUserFacing } from "@/lib/bookings";
import { SITE_URL } from "@/lib/env";
import { sendEmail } from "@/lib/notifications/email";
import { createClient } from "@/lib/supabase/server";

/**
 * Used by providers (partner portal) and staff (admin). Authorisation is enforced by the database
 * function set_booking_status, which checks the caller is staff or the listing's owner.
 */
export async function manageBooking(bookingId: string, status: string, back: string, fd: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const amountRaw = String(fd.get("amount") ?? "").trim();
  const { error } = await supabase.rpc("set_booking_status", {
    p_booking: bookingId, p_status: status,
    p_amount: amountRaw ? Number(amountRaw) : null,
    p_reason: String(fd.get("reason") ?? "").trim().slice(0, 500) || null,
  });
  if (error) {
    if (!isUserFacing(error)) console.error("[manage booking]", error.message);
    redirect(`${back}?error=${encodeURIComponent(isUserFacing(error) ? error.message : "Could not update the booking")}`);
  }

  const { data: b } = await supabase.from("bookings").select("reference,customer_email,customer_name,total_amount,currency,payment_status").eq("id", bookingId).maybeSingle();
  if (b) {
    const price = b.total_amount ? `\nPrice: ${b.currency} ${b.total_amount}` : "";
    await sendEmail({ to: b.customer_email, subject: `Booking ${b.reference}: ${statusLabels[status] ?? status}`,
      text: `Hello ${b.customer_name},\n\nYour booking ${b.reference} is now: ${statusLabels[status] ?? status}.${price}\n\nView it any time: ${SITE_URL}/booking` });
  }
  revalidatePath(back);
  redirect(`${back}?saved=1`);
}

export async function moderateReview(id: string, status: "published" | "rejected", back: string) {
  const supabase = await createClient();
  await supabase.from("reviews").update({ status }).eq("id", id);   // RLS: staff only
  revalidatePath("/", "layout");
  redirect(`${back}?saved=1`);
}

export async function replyToReview(id: string, back: string, fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("reply_to_review", { p_review: id, p_reply: String(fd.get("reply") ?? "").slice(0, 1000) });
  revalidatePath("/", "layout");
  redirect(`${back}?saved=1`);
}
