"use server";

import { supabaseConfigured } from "@/lib/env";
import { sendEmail } from "@/lib/notifications/email";
import { createPublicClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { enquirySchema, newsletterSchema, zodErrors, type FormState } from "@/lib/validations/forms";

const UNAVAILABLE: FormState = { ok: false, message: "This service is not available yet. Please try again later." };
const TOO_MANY: FormState = { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
const FAILED: FormState = { ok: false, message: "Sorry, we could not send that. Please try again, or contact us by phone or WhatsApp." };

export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const d = parsed.data;

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (d.website) return { ok: true, message: "Thank you. Your message has been sent." };

  if (!supabaseConfigured) return UNAVAILABLE;
  if (!(await rateLimit("enquiry", 5, 10 * 60_000))) return TOO_MANY;

  const details: Record<string, unknown> = {};
  if (d.date_from) details.date_from = d.date_from;
  if (d.date_to) details.date_to = d.date_to;
  if (d.guests) details.guests = d.guests;
  if (d.organisation) details.organisation = d.organisation;

  const { error } = await createPublicClient().from("enquiries").insert({
    kind: d.kind,
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    message: d.message,
    listing_id: d.listing_id || null,
    experience_id: d.experience_id || null,
    investment_id: d.investment_id || null,
    details,
  });
  if (error) {
    console.error("[enquiry]", error.message);
    return FAILED;
  }

  // Optional staff notification. Saved enquiry is the source of truth; email is a bonus.
  const notify = process.env.ENQUIRY_NOTIFY_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify, replyTo: d.email,
      subject: `New ${d.kind.replace("_", " ")} enquiry from ${d.name}`,
      text: `${d.message}\n\nFrom: ${d.name} <${d.email}> ${d.phone ?? ""}\nDetails: ${JSON.stringify(details)}`,
    });
  }
  return { ok: true, message: "Thank you. Your message has been sent and we will reply by email." };
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (parsed.data.website) return { ok: true, message: "You are subscribed." };

  if (!supabaseConfigured) return UNAVAILABLE;
  if (!(await rateLimit("newsletter", 5, 10 * 60_000))) return TOO_MANY;

  const { error } = await createPublicClient().from("newsletter_subscribers").insert({ email: parsed.data.email });
  if (error) {
    if (error.code === "23505") return { ok: true, message: "You are already subscribed." };
    console.error("[newsletter]", error.message);
    return FAILED;
  }
  return { ok: true, message: "You are subscribed. Thank you!" };
}
