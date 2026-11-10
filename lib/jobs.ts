import { PAGE_SIZE } from "@/config/site";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { EMPLOYMENT_TYPES } from "@/config/jobs";

export interface Vacancy {
  id: string; slug: string; title: string; employment_type: string; description: string; requirements: string | null; qualifications: string | null;
  experience_required: string | null; salary_min: number | null; salary_max: number | null; salary_currency: string; salary_period: string | null;
  location_note: string | null; application_deadline: string | null; published_at: string | null; expires_at: string | null;
  employer: { id: string; slug: string; name: string; verification_status: string; website: string | null } | null;
  area: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}
export interface JobCategory { id: string; slug: string; name: string }

const SELECT = "*, employer:employer_profiles!employer_id(id,slug,name,verification_status,website), area:administrative_areas(name,slug), category:job_categories(name,slug)";
const sb = () => createPublicClient();
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

/** Public vacancies. Row Level Security already hides drafts, expired, filled and suspended-employer vacancies. */
export async function listVacancies(o: { q?: string; category?: string; type?: string; area?: string; page?: number; limit?: number } = {}) {
  const page = o.page ?? 1;
  const empty = { items: [] as Vacancy[], total: 0, page, pageCount: 1 };
  if (!supabaseConfigured) return empty;
  try {
    let q = sb().from("job_vacancies").select(SELECT, { count: "exact" }).order("published_at", { ascending: false });
    if (o.q && clean(o.q)) { const t = clean(o.q); q = q.or(`title.ilike.%${t}%,description.ilike.%${t}%`); }
    if (o.type && (EMPLOYMENT_TYPES as string[]).includes(o.type)) q = q.eq("employment_type", o.type);
    if (o.category) {
      const { data } = await sb().from("job_categories").select("id").eq("slug", o.category).maybeSingle();
      q = q.eq("category_id", data?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    if (o.area) {
      const { data } = await sb().from("administrative_areas").select("id").eq("slug", o.area).maybeSingle();
      q = q.eq("administrative_area_id", data?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const from = o.limit ? 0 : (page - 1) * PAGE_SIZE;
    const to = o.limit ? o.limit - 1 : page * PAGE_SIZE - 1;
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return { items: (data ?? []) as unknown as Vacancy[], total: count ?? 0, page, pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
  } catch (e) {
    console.error("[jobs:list]", e);
    return empty;
  }
}

export async function getVacancy(slug: string): Promise<Vacancy | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await sb().from("job_vacancies").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) console.error("[jobs:get]", error.message);
  return (data as unknown as Vacancy) ?? null;
}

export async function listJobCategories(): Promise<JobCategory[]> {
  if (!supabaseConfigured) return [];
  const { data } = await sb().from("job_categories").select("id,slug,name").eq("is_active", true).order("sort_order");
  return (data ?? []) as JobCategory[];
}

export async function listJobAreas(): Promise<{ id: string; slug: string; name: string }[]> {
  if (!supabaseConfigured) return [];
  const { data } = await sb().from("administrative_areas").select("id,slug,name").eq("is_active", true).order("name");
  return (data ?? []) as { id: string; slug: string; name: string }[];
}

export function salaryText(v: Pick<Vacancy, "salary_min" | "salary_max" | "salary_currency" | "salary_period">): string | null {
  const { salary_min: a, salary_max: b } = v;
  if (a == null && b == null) return null;
  const f = (n: number) => `${v.salary_currency} ${n.toLocaleString("en-GB")}`;
  const per = v.salary_period ? ` per ${v.salary_period}` : "";
  return (a != null && b != null ? (a === b ? f(a) : `${f(a)} to ${f(b)}`) : a != null ? `From ${f(a)}` : `Up to ${f(b!)}`) + per;
}
