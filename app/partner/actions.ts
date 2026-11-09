"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { accountTypeLabels, type BusinessAccountType } from "@/config/site";
import { parseIdList, parseResourceForm } from "@/lib/admin/parse";
import { requirePartner } from "@/lib/auth/session";
import { SITE_URL, supabaseConfigured } from "@/lib/env";
import { partnerListingDef } from "@/lib/partner/def";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/utils/rate-limit";
import { zodErrors, type FormState } from "@/lib/validations/forms";

const ACCOUNT_TYPES = Object.keys(accountTypeLabels) as [BusinessAccountType, ...BusinessAccountType[]];
const GENERIC: FormState = { ok: false, message: "Could not save. Please try again." };
const RANGE: FormState = { ok: false, message: "A value is outside the allowed range (check price and coordinates)." };

const registerBusinessSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  business_name: z.string().trim().min(2, "Enter your business name").max(150),
  account_type: z.enum(ACCOUNT_TYPES, { message: "Choose your business type" }),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export async function registerBusiness(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerBusinessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return { ok: false, message: "Registration is not available yet." };
  if (!(await rateLimit("register-business", 5, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: d.email, password: d.password,
    // Metadata is only a hint used to pre-fill the activation step. The role is granted by a
    // database function after the email is verified, never from here.
    options: { data: { full_name: d.full_name, business_name: d.business_name, account_type: d.account_type }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/partner/activate` },
  });
  if (error) { console.error("[register business]", error.message); return { ok: false, message: "We could not create that account. If you already have one, log in and activate your business account." }; }
  redirect("/verify-email");
}

export async function activatePartner(_prev: FormState, fd: FormData): Promise<FormState> {
  const type = String(fd.get("account_type") ?? "");
  if (!ACCOUNT_TYPES.includes(type as BusinessAccountType)) return { ok: false, errors: { account_type: "Choose your business type" } };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/partner/activate");
  const { error } = await supabase.rpc("become_partner", { account_type: type });
  if (error) {
    return { ok: false, message: /verify your email/i.test(error.message) ? "Please verify your email address first (check your inbox), then try again." : "We could not activate your business account." };
  }
  redirect("/partner/dashboard");
}

/* ───────────── Listings ───────────── */
export async function savePartnerListing(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePartner();
  if (!user.accountType) return { ok: false, message: "Your business type is not set. Contact us." };
  const def = partnerListingDef(user.accountType);
  const { values, errors } = parseResourceForm(def, fd, { isAdmin: false });
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const supabase = await createClient();
  const submit = fd.get("intent") === "submit";
  let existing: { status: string; plan_id: string | null } | null = null;
  if (id) {
    const { data } = await supabase.from("listings").select("status,plan_id").eq("id", id).eq("owner_id", user.id).maybeSingle();
    if (!data) return { ok: false, message: "That listing was not found." };
    existing = data;
  }
  // Editing something already live sends it back for review; partners can never publish.
  const status = existing?.status === "published" || submit ? "pending_review" : "draft";

  // Photo allowance comes from the plan (editable by admins).
  const planQuery = existing?.plan_id
    ? supabase.from("subscription_plans").select("max_photos").eq("id", existing.plan_id)
    : supabase.from("subscription_plans").select("max_photos").eq("slug", "free");
  const { data: plan } = await planQuery.maybeSingle();
  const maxPhotos = plan?.max_photos ?? 3;
  const galleryIds = parseIdList(fd.get("gallery_media_ids"));
  if (galleryIds.length > maxPhotos) return { ok: false, message: `Your plan allows up to ${maxPhotos} gallery photos.` };

  let savedId = id;
  if (id) {
    const { error } = await supabase.from("listings").update({ ...values, status }).eq("id", id).eq("owner_id", user.id);
    if (error) { console.error("[partner save]", error.message); return error.code === "23514" ? RANGE : GENERIC; }
  } else {
    const base = slugify(String(values.name ?? "")) || "business";
    for (let attempt = 0; attempt < 4; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase.from("listings").insert({ ...values, slug, status, owner_id: user.id, created_by: user.id }).select("id").single();
      if (!error) { savedId = data.id; break; }
      if (error.code !== "23505") { console.error("[partner insert]", error.message); return error.code === "23514" ? RANGE : GENERIC; }
      if (attempt === 3) return GENERIC;
    }
  }

  if (savedId) {
    await supabase.from("media_links").delete().eq("entity_type", "listing").eq("entity_id", savedId);
    if (galleryIds.length) {
      const { error } = await supabase.from("media_links").insert(galleryIds.map((media_id, i) => ({ media_id, entity_type: "listing", entity_id: savedId, sort_order: i })));
      if (error) { console.error("[partner gallery]", error.message); return { ok: false, message: "Saved, but some photos could not be attached. Re-add them and save again." }; }
    }
  }
  revalidatePath("/", "layout");
  redirect(`/partner/listings?${status === "pending_review" ? "submitted" : "saved"}=1`);
}

export async function partnerAddChild(kind: "rooms" | "menu", listingId: string, fd: FormData) {
  await requirePartner();
  const supabase = await createClient();
  const back = `/partner/listings/${listingId}`;
  const name = String(fd.get("name") ?? "").trim().slice(0, 200);
  const price = String(fd.get("price") ?? "").trim();
  const n = price === "" ? null : Number(price);
  if (!name || (n !== null && (!Number.isFinite(n) || n < 0))) redirect(`${back}?child=invalid`);
  const description = String(fd.get("description") ?? "").trim().slice(0, 1000) || null;
  const { error } = kind === "rooms"
    ? await supabase.from("room_types").insert({ listing_id: listingId, name, description, price_per_night: n, max_guests: Number(fd.get("max_guests")) || null })
    : await supabase.from("menu_items").insert({ listing_id: listingId, name, description, price: n, section: String(fd.get("section") ?? "").trim().slice(0, 80) || "Menu" });
  if (error) console.error("[partner child]", error.message);
  redirect(`${back}?child=${error ? "error" : "added"}`);
}

export async function partnerDeleteChild(kind: "rooms" | "menu", id: string, listingId: string) {
  await requirePartner();
  const supabase = await createClient();
  await supabase.from(kind === "rooms" ? "room_types" : "menu_items").delete().eq("id", id);   // RLS limits to own listings
  redirect(`/partner/listings/${listingId}?child=deleted`);
}

export async function archivePartnerListing(id: string) {
  const user = await requirePartner();
  const supabase = await createClient();
  await supabase.from("listings").update({ status: "archived" }).eq("id", id).eq("owner_id", user.id);
  revalidatePath("/", "layout");
  redirect("/partner/listings?saved=1");
}

/* ───────────── Enquiries, settings, plans ───────────── */
export async function setPartnerEnquiryStatus(id: string, status: string) {
  await requirePartner();
  if (!["read", "replied", "closed"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("enquiries").update({ status }).eq("id", id);   // RLS limits to enquiries on own listings
  redirect("/partner/enquiries?saved=1");
}

export async function savePartnerSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePartner();
  const parsed = z.object({ full_name: z.string().trim().min(2, "Enter your name").max(120), phone: z.string().trim().max(40).optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null }).eq("id", user.id);
  return error ? GENERIC : { ok: true, message: "Saved." };
}

export async function requestPlanUpgrade(planId: string): Promise<void> {
  const user = await requirePartner();
  if (!(await rateLimit("plan-request", 3, 60 * 60_000))) redirect("/partner/subscription?error=rate");
  const supabase = await createClient();
  const [{ data: plan }, { data: profile }] = await Promise.all([
    supabase.from("subscription_plans").select("name").eq("id", planId).eq("is_active", true).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  if (!plan) redirect("/partner/subscription?error=1");
  const { error } = await supabase.from("enquiries").insert({
    kind: "partnership", name: profile?.full_name || "Partner", email: user.email ?? "unknown@invalid.example",
    message: `Plan request: I would like to discuss the "${plan.name}" plan for my listing(s).`, details: { plan_id: planId, owner_id: user.id },
  });
  redirect(`/partner/subscription?${error ? "error=1" : "requested=1"}`);
}

/* ───────────── Availability ───────────── */
export async function blockDates(listingId: string, fd: FormData) {
  await requirePartner();
  const back = `/partner/listings/${listingId}`;
  const room = String(fd.get("room_type_id") ?? "");
  const from = String(fd.get("from") ?? ""), to = String(fd.get("to") || fd.get("from") || "");
  const ok = /^\d{4}-\d{2}-\d{2}$/;
  if (!/^[0-9a-f-]{36}$/i.test(room) || !ok.test(from) || !ok.test(to)) redirect(`${back}?avail=invalid`);
  const start = new Date(`${from}T00:00:00Z`), end = new Date(`${to}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 864e5) + 1;
  if (!(days >= 1 && days <= 366)) redirect(`${back}?avail=invalid`);
  const rows = Array.from({ length: days }, (_, i) => ({ room_type_id: room, day: new Date(start.getTime() + i * 864e5).toISOString().slice(0, 10) }));
  const { error } = await (await createClient()).from("room_blocked_dates").upsert(rows, { onConflict: "room_type_id,day", ignoreDuplicates: true });   // RLS: own rooms only
  if (error) console.error("[block dates]", error.message);
  redirect(`${back}?avail=${error ? "error" : "saved"}`);
}

export async function unblockDate(listingId: string, roomId: string, day: string) {
  await requirePartner();
  await (await createClient()).from("room_blocked_dates").delete().eq("room_type_id", roomId).eq("day", day);
  redirect(`/partner/listings/${listingId}?avail=saved`);
}
