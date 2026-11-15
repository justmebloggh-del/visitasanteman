"use server";

import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { eventRegistrationSchema, nominationSchema, zodErrors, type FormState } from "@/lib/validations/forms";

const UNAVAILABLE: FormState = { ok: false, message: "This service is not available yet. Please try again later." };
const TOO_MANY: FormState = { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };

export async function submitNomination(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = nominationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you. Your nomination has been received." }; // honeypot
  if (!supabaseConfigured) return UNAVAILABLE;
  if (!(await rateLimit("nomination", 5, 60 * 60_000))) return TOO_MANY;

  // Row Level Security checks that the programme is published, open, and the category belongs to it.
  const { error } = await createPublicClient().from("award_nominations").insert({
    programme_id: d.programme_id, category: d.category, nominee_name: d.nominee_name,
    nominee_organisation: d.nominee_organisation || null, nominee_location: d.nominee_location || null,
    reason: d.reason, supporting_url: d.supporting_url || null,
    nominator_name: d.nominator_name, nominator_email: d.nominator_email, nominator_phone: d.nominator_phone || null,
  });
  if (error) {
    console.error("[nomination]", error.message);
    return { ok: false, message: "Nominations for this programme are closed or the category is not valid. Please check the page and try again." };
  }
  return { ok: true, message: "Thank you. Your nomination has been received and will be reviewed against the published criteria. Being nominated does not guarantee a place on the shortlist." };
}

export async function registerForEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = eventRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you. You are registered." }; // honeypot
  if (!supabaseConfigured) return UNAVAILABLE;
  if (!(await rateLimit("event-registration", 8, 60 * 60_000))) return TOO_MANY;

  const { data, error } = await createPublicClient().rpc("register_for_event", {
    p_event: d.event_id, p_name: d.name, p_email: d.email, p_phone: d.phone || null, p_guests: d.guests, p_notes: d.notes || null,
  });
  if (error) {
    console.error("[event-registration]", error.message);
    return { ok: false, message: "Sorry, we could not register you. Please try again, or contact the organiser." };
  }
  switch (data) {
    case "ok": return { ok: true, message: "You are registered. The organiser will contact you at the email you gave if there is anything to confirm. This is a free registration, not a ticket." };
    case "full": return { ok: false, message: "Sorry, there are not enough places left for this event." };
    case "duplicate": return { ok: false, message: "That email address is already registered for this event." };
    default: return { ok: false, message: "Registration for this event is closed." };
  }
}
