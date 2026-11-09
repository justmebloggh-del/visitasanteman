import { PAGE_SIZE } from "@/config/site";
import type { DomainCfg } from "@/config/domains";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type { MediaRef } from "@/types/content";

export interface DomainRecord {
  id: string; slug: string; name: string; summary: string | null; description: string | null; address: string | null;
  latitude: number | null; longitude: number | null; website: string | null; contact_phone: string | null; contact_email: string | null;
  source_organisation: string | null; source_url: string | null; source_published_at: string | null; researched_at: string | null;
  seo_title: string | null; seo_description: string | null; canonical_url: string | null; noindex: boolean;
  cover: MediaRef | null; area: { name: string; slug: string } | null;
  [k: string]: unknown;
}

const SEL = "*, cover:media!cover_media_id(path,alt_text), area:administrative_areas(name,slug)";
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

/** Public list for one directory. Anonymous client: RLS returns published records only. */
export async function listDomain(cfg: DomainCfg, o: { q?: string; kind?: string; area?: string; page?: number; limit?: number } = {}) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : [(page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1];
  const empty = { items: [] as DomainRecord[], total: 0, page, pageCount: 1 };
  if (!supabaseConfigured) return empty;
  try {
    const sb = createPublicClient();
    let q = sb.from(cfg.table).select(SEL, { count: "exact" }).order("name");
    if (o.q) q = q.ilike("name", `%${clean(o.q)}%`);
    if (o.kind && cfg.kindColumn && cfg.kinds?.[o.kind]) q = q.eq(cfg.kindColumn, o.kind);
    if (o.area) {
      const { data } = await sb.from("administrative_areas").select("id").eq("slug", o.area).maybeSingle();
      q = q.eq("administrative_area_id", data?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return { items: (data ?? []) as unknown as DomainRecord[], total: count ?? 0, page, pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
  } catch (e) {
    console.error(`[content:${cfg.table}]`, e);
    return empty;
  }
}

export async function getDomainRecord(cfg: DomainCfg, slug: string): Promise<DomainRecord | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await createPublicClient().from(cfg.table).select(cfg.key === "clubs" ? `${SEL}, home:sports_venues!home_venue_id(name,slug)` : SEL).eq("slug", slug).limit(1);
  if (error) { console.error(`[content:${cfg.table}]`, error.message); return null; }
  return ((data ?? [])[0] as unknown as DomainRecord) ?? null;
}
