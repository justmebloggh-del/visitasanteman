"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { aiEnabled, askModel, buildPrompt, parseSuggestion } from "@/lib/ai/assistant";
import { interestIds } from "@/lib/planner/recommend";
import { buildCatalog } from "@/lib/planner/catalog";
import type { PlanView } from "@/lib/planner/types";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { zodErrors, type FormState } from "@/lib/validations/forms";

// Ownership is enforced by Row Level Security on every query below; the session check is only for friendly redirects.
async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/travel-planner");
  return { supabase, user: data.user };
}
const here = (id: string) => `/travel-planner/${id}`;
const flash = (id: string, msg: string) => redirect(`${here(id)}?notice=${encodeURIComponent(msg)}`);

const planSchema = z.object({
  title: z.string().trim().min(1, "Give your plan a name").max(120),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").optional().or(z.literal("")),
  days: z.coerce.number({ message: "Enter the number of days" }).int().min(1, "At least 1 day").max(30, "Up to 30 days"),
  travellers: z.coerce.number({ message: "Enter the number of travellers" }).int().min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
});

function interestsFrom(fd: FormData) {
  return fd.getAll("interests").map(String).filter((i) => interestIds.includes(i));
}

export async function createPlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = planSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const { supabase, user } = await session();
  const d = parsed.data;
  const { data, error } = await supabase.from("travel_itineraries").insert({
    user_id: user.id, title: d.title, start_date: d.start_date || null, days: d.days, travellers: d.travellers, interests: interestsFrom(fd), notes: d.notes || null,
  }).select("id").single();
  if (error) return { ok: false, message: /up to 20 plans/.test(error.message) ? "You can keep up to 20 plans. Delete one first." : "Could not create the plan. Please try again." };
  redirect(here(data.id));
}

export async function updatePlan(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = planSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const { supabase } = await session();
  const d = parsed.data;
  const { error } = await supabase.from("travel_itineraries").update({
    title: d.title, start_date: d.start_date || null, days: d.days, travellers: d.travellers, interests: interestsFrom(fd), notes: d.notes || null,
  }).eq("id", id);
  if (error) return { ok: false, message: "Could not save the plan." };
  // Items on days that no longer exist are moved to the last day rather than lost.
  await supabase.from("itinerary_items").update({ day: d.days }).eq("itinerary_id", id).gt("day", d.days);
  return { ok: true, message: "Saved." };
}

export async function deletePlan(id: string) {
  const { supabase } = await session();
  await supabase.from("travel_itineraries").delete().eq("id", id);
  redirect("/travel-planner");
}

const TYPES = ["attraction", "listing", "experience", "event", "community"] as const;

async function nextOrder(supabase: Awaited<ReturnType<typeof session>>["supabase"], planId: string, day: number) {
  const { data } = await supabase.from("itinerary_items").select("sort_order").eq("itinerary_id", planId).eq("day", day).order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function addPlace(planId: string, fd: FormData) {
  const { supabase } = await session();
  const type = String(fd.get("item_type")), itemId = String(fd.get("item_id")), day = Number(fd.get("day"));
  if (!TYPES.includes(type as never) || !/^[0-9a-f-]{36}$/i.test(itemId)) flash(planId, "That place could not be added.");
  const { data: plan } = await supabase.from("travel_itineraries").select("days").eq("id", planId).maybeSingle();
  if (!plan || !(day >= 1 && day <= plan.days)) flash(planId, "Choose a valid day.");
  const { error } = await supabase.from("itinerary_items").insert({ itinerary_id: planId, day, sort_order: await nextOrder(supabase, planId, day), item_type: type, item_id: itemId });
  flash(planId, error ? (/up to 100/.test(error.message) ? "A plan can hold up to 100 items." : "Could not add that place.") : "Added to your plan.");
}

export async function addCustom(planId: string, fd: FormData) {
  const { supabase } = await session();
  const title = String(fd.get("title") ?? "").trim().slice(0, 150), day = Number(fd.get("day"));
  if (!title) flash(planId, "Enter a title.");
  const { data: plan } = await supabase.from("travel_itineraries").select("days").eq("id", planId).maybeSingle();
  if (!plan || !(day >= 1 && day <= plan.days)) flash(planId, "Choose a valid day.");
  const { error } = await supabase.from("itinerary_items").insert({ itinerary_id: planId, day, sort_order: await nextOrder(supabase, planId, day), item_type: "custom", custom_title: title });
  flash(planId, error ? "Could not add that." : "Added to your plan.");
}

export async function moveItem(planId: string, itemId: string, direction: "up" | "down") {
  const { supabase } = await session();
  const { data: item } = await supabase.from("itinerary_items").select("id,day").eq("id", itemId).eq("itinerary_id", planId).maybeSingle();
  if (!item) redirect(here(planId));
  const { data: rows } = await supabase.from("itinerary_items").select("id").eq("itinerary_id", planId).eq("day", item.day).order("sort_order").order("created_at");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(itemId), j = direction === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((id, n) => supabase.from("itinerary_items").update({ sort_order: n }).eq("id", id)));
  }
  redirect(here(planId));
}

export async function moveToDay(planId: string, itemId: string, fd: FormData) {
  const { supabase } = await session();
  const day = Number(fd.get("day"));
  const { data: plan } = await supabase.from("travel_itineraries").select("days").eq("id", planId).maybeSingle();
  if (plan && day >= 1 && day <= plan.days) await supabase.from("itinerary_items").update({ day, sort_order: await nextOrder(supabase, planId, day) }).eq("id", itemId).eq("itinerary_id", planId);
  redirect(here(planId));
}

export async function saveNote(planId: string, itemId: string, fd: FormData) {
  const { supabase } = await session();
  await supabase.from("itinerary_items").update({ note: String(fd.get("note") ?? "").trim().slice(0, 500) || null }).eq("id", itemId).eq("itinerary_id", planId);
  redirect(here(planId));
}

export async function removeItem(planId: string, itemId: string) {
  const { supabase } = await session();
  await supabase.from("itinerary_items").delete().eq("id", itemId).eq("itinerary_id", planId);
  redirect(here(planId));
}

export async function toggleShare(planId: string) {
  const { supabase } = await session();
  const { data } = await supabase.from("travel_itineraries").select("share_token").eq("id", planId).maybeSingle();
  if (!data) redirect("/travel-planner");
  // 24 random bytes: unguessable. Turning sharing off invalidates the old link.
  await supabase.from("travel_itineraries").update({ share_token: data.share_token ? null : randomBytes(24).toString("base64url") }).eq("id", planId);
  redirect(here(planId));
}

/** AI suggestion. Output is validated against our own catalogue; unknown items are dropped. */
export async function suggestItinerary(planId: string) {
  const { supabase } = await session();
  if (!aiEnabled()) flash(planId, "The AI assistant is not available yet.");
  if (!(await rateLimit("ai-plan", 5, 60 * 60_000))) flash(planId, "You have reached the hourly limit for suggestions. Please try again later.");
  const { data } = await supabase.rpc("itinerary_view", { p_id: planId });
  const plan = data as PlanView | null;
  if (!plan) redirect("/travel-planner");

  const catalog = await buildCatalog();
  if (catalog.length === 0) flash(planId, "There is nothing published to plan with yet.");
  let text: string;
  try {
    const { system, user } = buildPrompt({ days: plan.days, travellers: plan.travellers, interests: plan.interests, notes: plan.notes ?? undefined }, catalog);
    text = await askModel(system, user);
  } catch (e) {
    console.error("[ai]", e);
    return flash(planId, "The assistant could not be reached. Nothing was changed.");
  }
  const result = parseSuggestion(text, catalog, plan.days);
  if (!result || result.items.length === 0) return flash(planId, "The assistant did not return a usable plan. Nothing was changed.");

  const taken = new Set(plan.items.map((i) => i.item_id));
  const fresh = result.items.filter((s) => !taken.has(s.id));
  const orders = new Map<number, number>();
  for (const it of plan.items) orders.set(it.day, Math.max(orders.get(it.day) ?? -1, it.sort_order));
  const rows = fresh.map((s) => {
    const n = (orders.get(s.day) ?? -1) + 1; orders.set(s.day, n);
    return { itinerary_id: planId, day: s.day, sort_order: n, item_type: s.type, item_id: s.id, note: s.note };
  });
  if (rows.length) await supabase.from("itinerary_items").insert(rows);
  flash(planId, `Added ${rows.length} suggested place${rows.length === 1 ? "" : "s"} from our listings${result.dropped ? ` (${result.dropped} suggestion${result.dropped === 1 ? "" : "s"} ignored because they are not in our listings)` : ""}. Review and adjust them.`);
}

/** Staff only: publish one of your own plans as a curated itinerary (created as a draft). */
export async function makeCurated(planId: string, fd: FormData) {
  const { supabase } = await session();
  const attach = String(fd.get("attach") ?? "");
  const { data, error } = await supabase.rpc("make_curated_itinerary", {
    p_itinerary: planId, p_title: String(fd.get("title") ?? ""), p_summary: String(fd.get("summary") ?? ""), p_theme: String(fd.get("theme") ?? ""),
    p_attach: /^[0-9a-f-]{36}$/i.test(attach) ? attach : null,
  });
  if (error || !data) { console.error("[curated]", error?.message); flash(planId, "Could not create the curated itinerary. Staff only; give it a title."); }
  redirect(`/admin/curated-itineraries/${data}?saved=1`);
}

/** Copy a published curated itinerary into the signed-in visitor's own plans. */
export async function copyCurated(slug: string) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect(`/login?next=/travel-planner/itineraries/${slug}`);
  const { data, error } = await supabase.rpc("copy_curated_itinerary", { p_slug: slug });
  if (error || !data) { console.error("[curated copy]", error?.message); redirect(`/travel-planner/itineraries/${slug}?error=1`); }
  redirect(`/travel-planner/${data}`);
}
