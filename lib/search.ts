import "server-only";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";

export interface SearchHit { kind: string; id: string; slug: string; title: string; summary: string | null; href: string; area_name: string | null; area_slug: string | null; rank: number; total: number }

/** Record types shown to the visitor, in display order. */
export const searchKindLabels: Record<string, string> = {
  district: "District", destination: "Destination", attraction: "Attraction", community: "Community", ceremony: "Ceremony or festival",
  accommodation: "Accommodation", restaurant: "Food and dining", venue: "Event venue", market: "Market", business: "Business",
  experience: "Experience", event: "Event", institution: "Education", sports: "Sports venue", club: "Sports club", transport: "Transport", article: "Article",
};

/** Site-wide search. The database function runs with the visitor's rights, so only published records come back. */
export async function searchSite(q: string, o: { kinds?: string[]; area?: string; page?: number; limit?: number } = {}): Promise<{ hits: SearchHit[]; total: number }> {
  const term = q.trim().slice(0, 80);
  if (!term || !supabaseConfigured) return { hits: [], total: 0 };
  const limit = Math.min(o.limit ?? 20, 50);
  const kinds = o.kinds?.filter((k) => k in searchKindLabels);
  const { data, error } = await createPublicClient().rpc("search_site", {
    p_q: term, p_kinds: kinds?.length ? kinds : null, p_area: o.area && /^[a-z0-9-]{1,80}$/.test(o.area) ? o.area : null,
    p_limit: limit, p_offset: ((o.page ?? 1) - 1) * limit,
  });
  if (error) { console.error("[search]", error.message); return { hits: [], total: 0 }; }
  const hits = (data ?? []) as SearchHit[];
  return { hits, total: hits.length ? Number(hits[0].total) : 0 };
}
