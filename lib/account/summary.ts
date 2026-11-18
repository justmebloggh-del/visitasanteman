import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Counts and the newest items for the signed-in person's account. Everything is read with their own rights (Row Level Security). */
export const getAccountSummary = cache(async (userId: string) => {
  const supabase = await createClient();
  const head = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });
  const [profile, bookings, applications, saved, plans, regs, rBookings, rApps, rRegs, rPlans] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,created_at").eq("id", userId).maybeSingle(),
    head("bookings"),
    head("job_applications").eq("applicant_id", userId),
    head("saved_jobs").eq("user_id", userId),
    head("travel_itineraries"),
    head("event_registrations").eq("status", "registered"),
    supabase.from("bookings").select("reference,status,created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("job_applications").select("id,status,created_at,vacancy:job_vacancies(title,slug)").eq("applicant_id", userId).order("created_at", { ascending: false }).limit(3),
    supabase.from("event_registrations").select("id,status,created_at,event:event_id(title,slug,starts_at)").eq("status", "registered").order("created_at", { ascending: false }).limit(3),
    supabase.from("travel_itineraries").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(3),
  ]);
  return {
    profile: profile.data,
    counts: { bookings: bookings.count ?? 0, applications: applications.count ?? 0, saved: saved.count ?? 0, plans: plans.count ?? 0, events: regs.count ?? 0 },
    recent: { bookings: rBookings.data ?? [], applications: (rApps.data ?? []) as unknown as { id: string; status: string; created_at: string; vacancy: { title: string; slug: string } | { title: string; slug: string }[] | null }[], events: (rRegs.data ?? []) as unknown as { id: string; created_at: string; event: { title: string; slug: string; starts_at: string } | { title: string; slug: string; starts_at: string }[] | null }[], plans: rPlans.data ?? [] },
  };
});

export const firstName = (name?: string | null, email?: string | null) => (name?.trim().split(/\s+/)[0] || email?.split("@")[0] || "there");
export const initials = (name?: string | null, email?: string | null) => {
  const parts = (name?.trim() || email || "?").split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
};
