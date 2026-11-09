import type { MetadataRoute } from "next";
import { listingSection } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getSitemapEntries } from "@/lib/content/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSitemapEntries();
  const fixed = ["", "/about", "/explore", "/attractions", "/districts", "/destinations", "/culture", "/culture/history", "/culture/traditions", "/culture/festivals", "/culture/crafts", "/culture/food", "/culture/ceremonies", "/culture/calendar", "/communities", "/accommodation", "/restaurants", "/experiences", "/events", "/travel-guide", "/business-directory", "/markets", "/venues", "/education", "/education/events", "/sports", "/sports/clubs", "/sports/events", "/transport", "/articles", "/gallery", "/map", "/contact", "/partner", "/partner-with-us", "/advertise", "/about/our-mission", "/about/partners", "/travel-planner", "/investment"];
  const base = (p: string) => `${SITE_URL}${p}`;
  const list = (rows: { slug: string; updated_at: string }[], prefix: string) =>
    rows.map((r) => ({ url: base(`${prefix}/${r.slug}`), lastModified: r.updated_at }));
  return [
    ...fixed.map((p) => ({ url: base(p), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...list(s.attractions, "/attractions"), ...list(s.districts, "/districts"), ...list(s.ceremonies, "/culture/ceremonies"), ...list(s.institutions, "/education"), ...list(s.sportsVenues, "/sports"), ...list(s.sportsClubs, "/sports/clubs"), ...list(s.transport, "/transport"), ...list(s.destinations, "/destinations"), ...list(s.communities, "/communities"), ...list(s.experiences, "/experiences"),
    ...list(s.events, "/events"), ...list(s.articles, "/articles"), ...list(s.investments, "/investment"),
    ...s.listings.map((l) => ({ url: base(`/${listingSection(l.type)}/${l.slug}`), lastModified: l.updated_at })),
  ];
}
