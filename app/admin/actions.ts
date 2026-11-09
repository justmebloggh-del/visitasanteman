"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resourceMap } from "@/config/admin-resources";
import { canApprove, isAdmin, requireAdmin, requireApprover, requireMediaAccess, requireStaff, requireSuperAdmin, type AppRole } from "@/lib/auth/session";
import { parseIdList, parseResourceForm } from "@/lib/admin/parse";
import { createClient } from "@/lib/supabase/server";
import { safeUrl } from "@/lib/utils";
import type { FormState } from "@/lib/validations/forms";

// Every action re-checks the caller's role on the server. The UI hiding a button is never the control.
const flush = () => revalidatePath("/", "layout");
const GENERIC: FormState = { ok: false, message: "Could not save. Please try again." };

function friendly(error: { code?: string; message: string }): FormState {
  if (error.code === "23505") return { ok: false, message: "That URL slug is already used. Change the slug and try again.", errors: { slug: "Already in use" } };
  if (error.code === "42501" || /row-level security/i.test(error.message)) return { ok: false, message: "You do not have permission to do that." };
  if (error.code === "23514") return { ok: false, message: "One of the values is outside the allowed range. Check prices, dates and coordinates." };
  console.error("[admin]", error.message);
  return GENERIC;
}

/* ───────────── Content resources ───────────── */
export async function saveResource(resourceKey: string, id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireStaff();
  const def = resourceMap[resourceKey];
  if (!def) return { ok: false, message: "Unknown section." };
  if (def.approverOnly) await requireApprover();

  const { values, errors } = parseResourceForm(def, fd, { isAdmin: isAdmin(user.role), canApprove: canApprove(user.role) });
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  // Record who verified a researched record.
  if ((def.key === "attractions" || def.key === "ceremonies") && (values.verification_status === "verified_secondary" || values.verification_status === "officially_confirmed")) values.reviewed_by = user.id;

  const supabase = await createClient();
  const pk = def.slugField ?? "id";
  let savedId = id;

  if (id) {
    let q = supabase.from(def.table).update(values).eq(pk, id);
    if (def.typeFilter) q = q.in(def.typeFilter.column, def.typeFilter.values);
    const { data, error } = await q.select(pk);
    if (error) return friendly(error);
    if (!data?.length) return { ok: false, message: "That item no longer exists or you cannot edit it." };
  } else {
    if (def.key === "pages") return { ok: false, message: "Pages cannot be created here." };
    const { data, error } = await supabase.from(def.table).insert(def.noCreatedBy ? values : { ...values, created_by: user.id }).select("id").single();
    if (error) return friendly(error);
    savedId = data.id;
  }

  if (def.galleryEntity && savedId) {
    const ids = parseIdList(fd.get("gallery_media_ids"));
    await supabase.from("media_links").delete().eq("entity_type", def.galleryEntity).eq("entity_id", savedId);
    if (ids.length) {
      const { error } = await supabase.from("media_links").insert(ids.map((media_id, i) => ({ media_id, entity_type: def.galleryEntity, entity_id: savedId, sort_order: i })));
      if (error) return friendly(error);
    }
  }

  flush();
  redirect(`/admin/${def.key}?saved=1`);
}

export async function setStatus(resourceKey: string, id: string, status: string) {
  const user = await requireStaff();
  const def = resourceMap[resourceKey];
  if (!def?.hasStatus || !["draft", "pending_review", "approved", "published", "archived"].includes(status)) return;
  // Friendly pre-check; the database trigger enforces the same rule.
  if ((status === "approved" || status === "published") && !canApprove(user.role)) redirect(`/admin/${def.key}?error=1`);
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (def.key === "articles" && status === "published") patch.published_at = new Date().toISOString();
  const { error } = await supabase.from(def.table).update(patch).eq(def.slugField ?? "id", id);
  if (error) console.error("[admin status]", error.message);
  flush();
  redirect(`/admin/${def.key}?${error ? "error=1" : "saved=1"}`);
}

export async function deleteResource(resourceKey: string, id: string) {
  await requireAdmin();
  const def = resourceMap[resourceKey];
  if (!def || def.key === "pages") return;
  const supabase = await createClient();
  // Soft delete keeps the row recoverable and keeps references (bookings, enquiries) intact.
  const { error } = def.softDelete
    ? await supabase.from(def.table).update({ deleted_at: new Date().toISOString(), status: "archived" }).eq("id", id)
    : await supabase.from(def.table).delete().eq("id", id);
  if (error) console.error("[admin delete]", error.message);
  flush();
  redirect(`/admin/${def.key}?${error ? "error=1" : "deleted=1"}`);
}

/* ───────────── Rooms & menu items ───────────── */
export async function addChild(kind: "rooms" | "menu", listingId: string, redirectTo: string, fd: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const name = String(fd.get("name") ?? "").trim().slice(0, 200);
  const description = String(fd.get("description") ?? "").trim().slice(0, 1000) || null;
  const price = String(fd.get("price") ?? "").trim();
  const priceNum = price === "" ? null : Number(price);
  if (!name || (priceNum !== null && (!Number.isFinite(priceNum) || priceNum < 0))) redirect(`${redirectTo}?child=invalid`);

  const { error } = kind === "rooms"
    ? await supabase.from("room_types").insert({ listing_id: listingId, name, description, price_per_night: priceNum, max_guests: Number(fd.get("max_guests")) || null })
    : await supabase.from("menu_items").insert({ listing_id: listingId, name, description, price: priceNum, section: String(fd.get("section") ?? "").trim().slice(0, 80) || "Menu" });
  if (error) console.error("[admin child]", error.message);
  flush();
  redirect(`${redirectTo}?child=${error ? "error" : "added"}`);
}

export async function deleteChild(kind: "rooms" | "menu", id: string, redirectTo: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from(kind === "rooms" ? "room_types" : "menu_items").delete().eq("id", id);
  flush();
  redirect(`${redirectTo}?child=deleted`);
}

/* ───────────── Media ───────────── */
export async function updateMedia(id: string, fd: FormData) {
  await requireMediaAccess();
  const supabase = await createClient();
  await supabase.from("media").update({
    alt_text: String(fd.get("alt_text") ?? "").trim().slice(0, 300),
    caption: String(fd.get("caption") ?? "").trim().slice(0, 300) || null,
    credit: String(fd.get("credit") ?? "").trim().slice(0, 200) || null,
    folder: String(fd.get("folder") ?? "general").trim().slice(0, 40) || "general",
  }).eq("id", id);
  flush();
  redirect("/admin/media?saved=1");
}

export async function deleteMedia(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: used } = await supabase.rpc("media_in_use", { m: id });
  if (used) redirect("/admin/media?error=in-use");
  const { data: row } = await supabase.from("media").select("path").eq("id", id).single();
  if (row) await supabase.storage.from("media").remove([row.path]);
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) console.error("[admin media]", error.message);
  flush();
  redirect(`/admin/media?${error ? "error=1" : "deleted=1"}`);
}

/* ───────────── Users, enquiries ───────────── */
const ROLES: AppRole[] = ["super_admin", "admin", "regional_editor", "editor", "media_manager", "partner", "visitor"];

export async function setUserRole(userId: string, fd: FormData) {
  const me = await requireSuperAdmin();
  const role = String(fd.get("role"));
  if (!ROLES.includes(role as AppRole) || userId === me.id) redirect("/admin/users?error=1");
  const supabase = await createClient();
  const { error } = await supabase.from("user_roles").update({ role, assigned_by: me.id }).eq("user_id", userId);
  if (error) console.error("[admin role]", error.message);
  redirect(`/admin/users?${error ? "error=1" : "saved=1"}`);
}

export async function setEnquiryStatus(id: string, status: string) {
  const me = await requireStaff();
  if (!["new", "read", "replied", "closed"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("enquiries").update({ status, handled_by: me.id }).eq("id", id);
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?saved=1");
}

export async function deleteEnquiry(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("enquiries").delete().eq("id", id);
  redirect("/admin/enquiries?deleted=1");
}

/* ───────────── Homepage & settings ───────────── */
export async function saveHomepageSection(key: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const text = (n: string, max: number) => String(fd.get(n) ?? "").trim().slice(0, max) || null;
  const supabase = await createClient();
  const { data: existing } = await supabase.from("homepage_sections").select("config").eq("key", key).single();
  const config = { ...(existing?.config as Record<string, unknown> ?? {}) };
  if (key === "hero") {
    const mediaId = String(fd.get("hero_media_id") ?? "");
    // Path and alt text come from the media table, never from the browser.
    const { data: m } = mediaId ? await supabase.from("media").select("id,path,alt_text").eq("id", mediaId).maybeSingle() : { data: null };
    if (m) { config.media_id = m.id; config.image_path = m.path; config.image_alt = m.alt_text; }
    else { delete config.media_id; delete config.image_path; delete config.image_alt; }
  }
  const { error } = await supabase.from("homepage_sections").update({
    title: text("title", 200), subtitle: text("subtitle", 400), body: text("body", 5000),
    is_enabled: fd.get("is_enabled") === "on", config,
  }).eq("key", key);
  if (error) return friendly(error);
  flush();
  return { ok: true, message: "Saved." };
}

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const s = (n: string, max = 300) => String(fd.get(n) ?? "").trim().slice(0, max);
  const errors: Record<string, string> = {};
  const social: Record<string, string> = {};
  for (const k of ["facebook", "instagram", "x", "youtube"]) {
    const v = s(k);
    if (v && !safeUrl(v)) errors[k] = "Must start with http:// or https://";
    social[k] = v;
  }
  const email = s("email");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Not a valid email address";
  const lat = Number(s("center_lat")), lng = Number(s("center_lng")), zoom = Number(s("zoom"));
  if (!(Math.abs(lat) <= 90)) errors.center_lat = "Between -90 and 90";
  if (!(Math.abs(lng) <= 180)) errors.center_lng = "Between -180 and 180";
  if (!(zoom >= 1 && zoom <= 18)) errors.zoom = "Between 1 and 18";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const supabase = await createClient();
  const rows = [
    { key: "general", value: { site_name: s("site_name", 100), tagline: s("tagline", 200) } },
    { key: "contact", value: { email, phone: s("phone", 40), whatsapp: s("whatsapp", 40), address: s("address", 300) } },
    { key: "social", value: social },
    { key: "map", value: { center_lat: lat, center_lng: lng, zoom, note: "Approximate map centre only; not an attraction coordinate." } },
  ].map((r) => ({ ...r, updated_by: me.id }));
  const { error } = await supabase.from("site_settings").upsert(rows);
  if (error) return friendly(error);
  flush();
  return { ok: true, message: "Settings saved." };
}
