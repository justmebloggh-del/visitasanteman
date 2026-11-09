import { PAGE_SIZE, type ListingType } from "@/config/site";
import { supabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  Article, Attraction, Community, EventItem, Experience, HomepageSection, Listing, MapPoint,
  MediaRef, MenuItem, Page, PageContent, RoomType, Testimonial,
} from "@/types/content";

/**
 * Public read layer. Uses the anonymous client, so Row Level Security guarantees only
 * published content comes back. If Supabase is not configured or a query fails, pages
 * receive an empty result and show their empty state (the error is logged, not hidden).
 */
type Result<T> = { data: T | null; error: { message: string } | null };

async function run<T>(label: string, fn: () => PromiseLike<Result<T>>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    const { data, error } = await fn();
    if (error) {
      console.error(`[content:${label}]`, error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (e) {
    console.error(`[content:${label}]`, e);
    return fallback;
  }
}

const COVER = "cover:media!cover_media_id(path,alt_text)";
const sb = () => createPublicClient();

/** Strip characters that would alter a PostgREST filter expression. */
const cleanTerm = (s: string) => s.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

function paged<T>(items: T[], total: number, page: number): Page<T> {
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
const range = (page: number) => [(page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1] as const;
export const toPage = (v: string | undefined) => Math.max(1, Math.min(500, Number.parseInt(v ?? "1", 10) || 1));

// ── Homepage & settings ──
export async function getHomepageSections(): Promise<Record<string, HomepageSection>> {
  const rows = await run<HomepageSection[]>(
    "homepage", () => sb().from("homepage_sections").select("*").order("sort_order"), [],
  );
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

export async function getSettings(): Promise<Record<string, Record<string, string | number>>> {
  const rows = await run<{ key: string; value: Record<string, string | number> }[]>(
    "settings", () => sb().from("site_settings").select("key,value"), [],
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getPage(slug: string): Promise<PageContent | null> {
  const rows = await run<(PageContent & { cover: MediaRef | null })[]>(
    "page", () => sb().from("pages").select(`*, ${COVER}`).eq("slug", slug).limit(1), [],
  );
  return rows[0] ?? null;
}

// ── Attractions ──
const ATTRACTION = `*, ${COVER}, category:attraction_categories(name,slug), community:communities(name,slug)`;

export async function listAttractions(o: { q?: string; category?: string; community?: string; page?: number; limit?: number }) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : range(page);
  if (!supabaseConfigured) return paged<Attraction>([], 0, page);
  try {
    let q = sb().from("attractions").select(ATTRACTION, { count: "exact" }).order("is_featured", { ascending: false }).order("name");
    if (o.q) q = q.ilike("name", `%${cleanTerm(o.q)}%`);
    if (o.category) {
      const { data: c } = await sb().from("attraction_categories").select("id").eq("slug", o.category).maybeSingle();
      q = q.eq("category_id", c?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    if (o.community) {
      const { data: c } = await sb().from("communities").select("id").eq("slug", o.community).maybeSingle();
      q = q.eq("community_id", c?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return paged((data ?? []) as unknown as Attraction[], count ?? 0, page);
  } catch (e) {
    console.error("[content:attractions]", e);
    return paged<Attraction>([], 0, page);
  }
}

export async function getAttraction(slug: string) {
  const rows = await run<Attraction[]>("attraction", () => sb().from("attractions").select(ATTRACTION).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

export const getAttractionCategories = () =>
  run<{ slug: string; name: string }[]>("attraction-cats", () => sb().from("attraction_categories").select("slug,name").order("sort_order"), []);

// ── Communities ──
export const listCommunities = () =>
  run<Community[]>("communities", () => sb().from("communities").select(`*, ${COVER}`).order("sort_order").order("name") as never, []);

export async function getCommunity(slug: string) {
  const rows = await run<Community[]>("community", () => sb().from("communities").select(`*, ${COVER}`).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

// ── Listings (accommodation, restaurants, businesses) ──
const LISTING = `*, ${COVER}, community:communities(name,slug)`;

export async function listListings(
  types: ListingType[],
  o: { q?: string; type?: string; community?: string; maxPrice?: number; page?: number; limit?: number; featured?: boolean },
) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : range(page);
  if (!supabaseConfigured) return paged<Listing>([], 0, page);
  try {
    const typeFilter = o.type && types.includes(o.type as ListingType) ? [o.type] : types;
    let q = sb().from("listings").select(LISTING, { count: "exact" }).in("type", typeFilter)
      .order("is_featured", { ascending: false }).order("is_verified", { ascending: false }).order("name");
    if (o.featured) q = q.eq("is_featured", true);
    if (o.q) q = q.ilike("name", `%${cleanTerm(o.q)}%`);
    if (o.maxPrice) q = q.lte("price_from", o.maxPrice);
    if (o.community) {
      const { data: c } = await sb().from("communities").select("id").eq("slug", o.community).maybeSingle();
      q = q.eq("community_id", c?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return paged((data ?? []) as unknown as Listing[], count ?? 0, page);
  } catch (e) {
    console.error("[content:listings]", e);
    return paged<Listing>([], 0, page);
  }
}

export async function getListing(slug: string) {
  const rows = await run<Listing[]>("listing", () => sb().from("listings").select(LISTING).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

export const getRoomTypes = (listingId: string) =>
  run<RoomType[]>("rooms", () => sb().from("room_types").select("id,name,description,max_guests,price_per_night").eq("listing_id", listingId).order("sort_order") as never, []);

export const getMenuItems = (listingId: string) =>
  run<MenuItem[]>("menu", () => sb().from("menu_items").select("id,section,name,description,price").eq("listing_id", listingId).order("sort_order") as never, []);

// ── Experiences ──
const EXPERIENCE = `*, ${COVER}, provider:listings!provider_listing_id(name,slug,phone,whatsapp,email)`;

export async function listExperiences(o: { q?: string; category?: string; page?: number; limit?: number }) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : range(page);
  if (!supabaseConfigured) return paged<Experience>([], 0, page);
  try {
    let q = sb().from("experiences").select(EXPERIENCE, { count: "exact" }).order("is_featured", { ascending: false }).order("title");
    if (o.q) q = q.ilike("title", `%${cleanTerm(o.q)}%`);
    if (o.category) q = q.eq("category", o.category);
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return paged((data ?? []) as unknown as Experience[], count ?? 0, page);
  } catch (e) {
    console.error("[content:experiences]", e);
    return paged<Experience>([], 0, page);
  }
}

export async function getExperience(slug: string) {
  const rows = await run<Experience[]>("experience", () => sb().from("experiences").select(EXPERIENCE).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

// ── Events ──
export async function listEvents(o: { when?: "upcoming" | "past"; page?: number; limit?: number; month?: string }) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : range(page);
  if (!supabaseConfigured) return paged<EventItem>([], 0, page);
  try {
    const now = new Date().toISOString();
    let q = sb().from("events").select(`*, ${COVER}`, { count: "exact" });
    if (o.month && /^\d{4}-\d{2}$/.test(o.month)) {
      const start = new Date(`${o.month}-01T00:00:00Z`);
      const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
      q = q.gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at");
    } else if (o.when === "past") {
      q = q.lt("starts_at", now).order("starts_at", { ascending: false });
    } else {
      q = q.gte("starts_at", now).order("starts_at");
    }
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return paged((data ?? []) as unknown as EventItem[], count ?? 0, page);
  } catch (e) {
    console.error("[content:events]", e);
    return paged<EventItem>([], 0, page);
  }
}

export async function getEvent(slug: string) {
  const rows = await run<EventItem[]>("event", () => sb().from("events").select(`*, ${COVER}`).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

// ── Articles ──
const ARTICLE = `*, ${COVER}, category:article_categories(name,slug)`;

export async function listArticles(o: { category?: string; page?: number; limit?: number; excludeId?: string }) {
  const page = o.page ?? 1;
  const [from, to] = o.limit ? [0, o.limit - 1] : range(page);
  if (!supabaseConfigured) return paged<Article>([], 0, page);
  try {
    let q = sb().from("articles").select(ARTICLE, { count: "exact" }).order("published_at", { ascending: false });
    if (o.excludeId) q = q.neq("id", o.excludeId);
    if (o.category) {
      const { data: c } = await sb().from("article_categories").select("id").eq("slug", o.category).maybeSingle();
      q = q.eq("category_id", c?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const { data, count, error } = await q.range(from, to);
    if (error) throw error;
    return paged((data ?? []) as unknown as Article[], count ?? 0, page);
  } catch (e) {
    console.error("[content:articles]", e);
    return paged<Article>([], 0, page);
  }
}

export async function getArticle(slug: string) {
  const rows = await run<Article[]>("article", () => sb().from("articles").select(ARTICLE).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

export const getArticleCategories = () =>
  run<{ slug: string; name: string }[]>("article-cats", () => sb().from("article_categories").select("slug,name").order("sort_order"), []);

// ── Misc ──
export const getTestimonials = (limit = 3) =>
  run<Testimonial[]>("testimonials", () => sb().from("testimonials").select("id,author_name,author_origin,quote,rating").order("created_at", { ascending: false }).limit(limit) as never, []);

export async function getGallery(entityType: string, entityId: string): Promise<MediaRef[]> {
  const rows = await run<{ sort_order: number; media: MediaRef | null }[]>(
    "gallery",
    () => sb().from("media_links").select("sort_order, media:media_id(path,alt_text)").eq("entity_type", entityType).eq("entity_id", entityId).order("sort_order") as never,
    [],
  );
  return rows.map((r) => r.media).filter((m): m is MediaRef => !!m);
}

export async function getAllGalleryImages(limit = 60): Promise<(MediaRef & { caption: string | null; credit: string | null })[]> {
  return run("gallery-all", () => sb().from("media").select("path,alt_text,caption,credit").eq("folder", "gallery").order("created_at", { ascending: false }).limit(limit) as never, []);
}

export async function getMapPoints(): Promise<MapPoint[]> {
  const pt = <T extends { latitude: number | null; longitude: number | null }>(rows: T[]) =>
    rows.filter((r) => r.latitude != null && r.longitude != null);
  const [attr, comm, lst, exp, ev] = await Promise.all([
    run<Attraction[]>("map-attr", () => sb().from("attractions").select("id,slug,name,latitude,longitude").not("latitude", "is", null) as never, []),
    run<Community[]>("map-comm", () => sb().from("communities").select("id,slug,name,latitude,longitude").not("latitude", "is", null) as never, []),
    run<Listing[]>("map-list", () => sb().from("listings").select("id,slug,name,type,latitude,longitude").not("latitude", "is", null) as never, []),
    run<Experience[]>("map-exp", () => sb().from("experiences").select("id,slug,title,latitude,longitude").not("latitude", "is", null) as never, []),
    run<EventItem[]>("map-ev", () => sb().from("events").select("id,slug,title,latitude,longitude").not("latitude", "is", null).gte("starts_at", new Date().toISOString()) as never, []),
  ]);
  const accommodation = new Set(["hotel", "resort", "guesthouse", "lodge", "eco_lodge", "holiday_home", "apartment"]);
  return [
    ...pt(attr).map((r): MapPoint => ({ id: r.id, kind: "attraction", title: r.name, href: `/attractions/${r.slug}`, lat: r.latitude!, lng: r.longitude! })),
    ...pt(comm).map((r): MapPoint => ({ id: r.id, kind: "community", title: r.name, href: `/communities/${r.slug}`, lat: r.latitude!, lng: r.longitude! })),
    ...pt(lst).map((r): MapPoint => {
      const kind = accommodation.has(r.type) ? "accommodation" : r.type === "restaurant" ? "restaurant" : "business";
      const base = kind === "accommodation" ? "accommodation" : kind === "restaurant" ? "restaurants" : "business";
      return { id: r.id, kind, title: r.name, href: `/${base}/${r.slug}`, lat: r.latitude!, lng: r.longitude! };
    }),
    ...pt(exp).map((r): MapPoint => ({ id: r.id, kind: "experience", title: r.title, href: `/experiences/${r.slug}`, lat: r.latitude!, lng: r.longitude! })),
    ...pt(ev).map((r): MapPoint => ({ id: r.id, kind: "event", title: r.title, href: `/events/${r.slug}`, lat: r.latitude!, lng: r.longitude! })),
  ];
}

export async function getSitemapEntries() {
  const slugs = (table: string, col = "slug") =>
    run<{ slug: string; updated_at: string }[]>(`sitemap-${table}`, () => sb().from(table).select(`${col}, updated_at`).eq("noindex", false) as never, []);
  const [attractions, communities, listings, experiences, events, articles, investments] = await Promise.all([
    slugs("attractions"), slugs("communities"),
    run<{ slug: string; type: string; updated_at: string }[]>("sitemap-listings", () => sb().from("listings").select("slug,type,updated_at").eq("noindex", false) as never, []),
    slugs("experiences"), slugs("events"), slugs("articles"), slugs("investment_opportunities"),
  ]);
  return { attractions, communities, listings, experiences, events, articles, investments };
}

// ── Reviews (only published, booking-verified ones are public) ──
export interface ReviewItem { id: string; author_name: string; rating: number; comment: string | null; owner_reply: string | null; created_at: string }

export async function getReviews(target: { listingId?: string; experienceId?: string }): Promise<{ items: ReviewItem[]; average: number | null; count: number }> {
  const col = target.listingId ? "listing_id" : "experience_id";
  const id = target.listingId ?? target.experienceId;
  const rows = id ? await run<ReviewItem[]>("reviews", () => sb().from("reviews").select("id,author_name,rating,comment,owner_reply,created_at").eq(col, id).order("created_at", { ascending: false }).limit(50) as never, []) : [];
  const count = rows.length;
  return { items: rows, count, average: count ? Math.round((rows.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : null };
}

// ── Nearby places (distance-based, published content with verified coordinates only) ──
export interface NearbyPlace { kind: string; id: string; title: string; href: string; distance_km: number }

export async function getNearby(lat: number, lng: number, excludeId?: string, radiusKm = 15, limit = 6): Promise<NearbyPlace[]> {
  return run<NearbyPlace[]>("nearby", () => sb().rpc("nearby_places", { p_lat: lat, p_lng: lng, p_radius_km: radiusKm, p_limit: limit, p_exclude: excludeId ?? null }) as never, []);
}

// ── Investment opportunities ──
export interface InvestmentItem extends Seo, Cover {
  id: string; slug: string; title: string; stage: "operational" | "approved" | "proposed" | "under_consideration"; stage_source: string | null;
  summary: string | null; description: string | null; proposed_location: string | null; latitude: number | null; longitude: number | null;
  objectives: string | null; commercial_opportunities: string | null; investment_min: number | null; investment_max: number | null;
  investment_currency: string; investment_note: string | null; environmental_considerations: string | null;
  partnership_requirements: string | null; images_are_conceptual: boolean; is_featured: boolean;
  community: { name: string; slug: string } | null;
}
interface Seo { seo_title: string | null; seo_description: string | null; canonical_url: string | null; noindex: boolean }
interface Cover { cover: MediaRef | null }

const INVESTMENT = `*, ${COVER}, community:communities(name,slug)`;

export async function listInvestments(o: { stage?: string; limit?: number } = {}): Promise<InvestmentItem[]> {
  return run<InvestmentItem[]>("investments", () => {
    let q = sb().from("investment_opportunities").select(INVESTMENT).order("is_featured", { ascending: false }).order("title");
    if (o.stage) q = q.eq("stage", o.stage);
    if (o.limit) q = q.limit(o.limit);
    return q as never;
  }, []);
}

export async function getInvestment(slug: string) {
  const rows = await run<InvestmentItem[]>("investment", () => sb().from("investment_opportunities").select(INVESTMENT).eq("slug", slug).limit(1) as never, []);
  return rows[0] ?? null;
}

// ── Advertising: only published ads inside their dates are visible (enforced by RLS) ──
export interface AdItem { id: string; title: string; advertiser_name: string; placement: string; headline: string | null; body: string | null; link_url: string; cover: MediaRef | null }

export async function getActiveAd(placement: "homepage_banner" | "directory_top"): Promise<AdItem | null> {
  const rows = await run<AdItem[]>("ads", () => sb().from("advertisements").select(`id,title,advertiser_name,placement,headline,body,link_url,${COVER}`).eq("placement", placement).order("starts_at", { ascending: false }).limit(5) as never, []);
  if (!rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)];   // simple rotation between concurrent ads
}
