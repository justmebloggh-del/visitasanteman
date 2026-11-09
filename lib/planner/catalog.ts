import "server-only";
import type { CatalogItem } from "@/lib/ai/assistant";
import { accommodationTypes, businessTypes, restaurantTypes } from "@/config/site";
import { listAttractions, listCommunities, listEvents, listExperiences, listListings } from "@/lib/content/public";

/** Everything a plan can contain, from published data only. Used by the AI grounding step. */
export async function buildCatalog(): Promise<CatalogItem[]> {
  const [attr, exp, stays, food, biz, events, comms] = await Promise.all([
    listAttractions({ limit: 20 }), listExperiences({ limit: 20 }), listListings(accommodationTypes, { limit: 12 }),
    listListings(restaurantTypes, { limit: 12 }), listListings(businessTypes, { limit: 8 }), listEvents({ limit: 8 }), listCommunities(),
  ]);
  const cut = (s: string | null | undefined) => (s ?? "").slice(0, 100);
  return [
    ...attr.items.map((a) => ({ id: a.id, type: "attraction" as const, name: a.name, detail: [a.category?.name, cut(a.summary)].filter(Boolean).join(": ") })),
    ...exp.items.map((e) => ({ id: e.id, type: "experience" as const, name: e.title, detail: [e.category, e.duration_minutes ? `${e.duration_minutes} min` : null, cut(e.summary)].filter(Boolean).join(", ") })),
    ...[...stays.items, ...food.items, ...biz.items].map((l) => ({ id: l.id, type: "listing" as const, name: l.name, detail: [l.type, cut(l.summary)].filter(Boolean).join(": ") })),
    ...events.items.map((e) => ({ id: e.id, type: "event" as const, name: e.title, detail: `event on ${e.starts_at.slice(0, 10)}` })),
    ...comms.slice(0, 12).map((c) => ({ id: c.id, type: "community" as const, name: c.name, detail: cut(c.summary) })),
  ];
}
