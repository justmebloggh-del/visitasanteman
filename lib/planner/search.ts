import "server-only";
import { accommodationTypes, restaurantTypes } from "@/config/site";
import { listAttractions, listCommunities, listEvents, listExperiences, listListings } from "@/lib/content/public";

export interface PlaceResult { id: string; type: "attraction" | "listing" | "experience" | "event" | "community"; title: string; sub: string | null }
export interface PlaceGroup { label: string; items: PlaceResult[] }

/** Search published places to add to a plan. Empty query returns a few of each. */
export async function searchPlaces(q: string): Promise<PlaceGroup[]> {
  const term = q.trim().toLowerCase(), n = term ? 6 : 4;
  const [attr, exp, stays, food, events, comms] = await Promise.all([
    listAttractions({ q: term || undefined, limit: n }), listExperiences({ q: term || undefined, limit: n }),
    listListings(accommodationTypes, { q: term || undefined, limit: n }), listListings(restaurantTypes, { q: term || undefined, limit: n }),
    listEvents({ limit: 20 }), listCommunities(),
  ]);
  const groups: PlaceGroup[] = [
    { label: "Attractions", items: attr.items.map((a) => ({ id: a.id, type: "attraction", title: a.name, sub: a.category?.name ?? null })) },
    { label: "Experiences", items: exp.items.map((e) => ({ id: e.id, type: "experience", title: e.title, sub: e.category.replace(/_/g, " ") })) },
    { label: "Places to stay", items: stays.items.map((l) => ({ id: l.id, type: "listing", title: l.name, sub: l.type.replace(/_/g, " ") })) },
    { label: "Food", items: food.items.map((l) => ({ id: l.id, type: "listing", title: l.name, sub: "restaurant" })) },
    { label: "Events", items: events.items.filter((e) => !term || e.title.toLowerCase().includes(term)).slice(0, n).map((e) => ({ id: e.id, type: "event", title: e.title, sub: e.starts_at.slice(0, 10) })) },
    { label: "Communities", items: comms.filter((c) => !term || c.name.toLowerCase().includes(term)).slice(0, n).map((c) => ({ id: c.id, type: "community", title: c.name, sub: null })) },
  ];
  return groups.filter((g) => g.items.length);
}
