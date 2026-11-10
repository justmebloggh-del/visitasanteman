import type { MetadataRoute } from "next";
import { listingSection } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getSitemapEntries } from "@/lib/content/public";
import { listVacancies } from "@/lib/jobs";

export const revalidate = 3600;

/** Public path of each CMS page (pages.slug cannot contain a slash). */
const PAGE_PATHS: Record<string, string> = {
  about: "/about", explore: "/explore", "travel-guide": "/travel-guide", privacy: "/privacy", terms: "/terms",
  "why-ashanti": "/why-ashanti", "getting-around": "/getting-around", "travel-information": "/travel-information", "visa-and-entry": "/visa-and-entry", "cookie-policy": "/cookie-policy",
  "about-our-mission": "/about/our-mission", "about-partners": "/about/partners",
  culture: "/culture", "culture-history": "/culture/history", "culture-traditions": "/culture/traditions",
  "culture-festivals": "/culture/festivals", "culture-crafts": "/culture/crafts", "culture-food": "/culture/food",
};

/**
 * Only pages that are worth indexing: directory pages appear once they hold published records, and CMS pages once they are
 * published. Empty and "being prepared" pages are marked noindex, so listing them here would send search engines mixed signals.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSitemapEntries();
  const jobs = (await listVacancies({ limit: 500 })).items;
  const base = (p: string) => `${SITE_URL}${p}`;
  const count = (t: string) => s.listings.filter((l) => listingSection(l.type) === t).length;
  const always = ["", "/map", "/contact", "/partner", "/partner-with-us", "/advertise", "/travel-planner"];
  const sections: [string, number][] = [
    ["/attractions", s.attractions.length], ["/districts", s.districts.length], ["/destinations", s.destinations.length], ["/communities", s.communities.length],
    ["/accommodation", count("accommodation")], ["/restaurants", count("restaurants")], ["/venues", count("venues")], ["/markets", count("markets")],
    ["/business-directory", count("business")], ["/experiences", s.experiences.length], ["/events", s.events.length], ["/articles", s.articles.length],
    ["/education", s.institutions.length], ["/sports", s.sportsVenues.length], ["/sports/clubs", s.sportsClubs.length], ["/transport", s.transport.length],
    ["/culture/ceremonies", s.ceremonies.length], ["/jobs", jobs.length], ["/gallery", s.gallery.length], ["/investment", s.investments.length],
  ];
  const fixed = [...always, ...sections.filter(([, n]) => n > 0).map(([p]) => p), ...s.pages.map((r) => PAGE_PATHS[r.slug]).filter(Boolean)];
  const list = (rows: { slug: string; updated_at: string }[], prefix: string) =>
    rows.map((r) => ({ url: base(`${prefix}/${r.slug}`), lastModified: r.updated_at }));
  return [
    ...fixed.map((p) => ({ url: base(p), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...list(s.attractions, "/attractions"), ...list(s.districts, "/districts"), ...list(s.destinations, "/destinations"), ...list(s.communities, "/communities"),
    ...list(s.ceremonies, "/culture/ceremonies"), ...list(s.institutions, "/education"), ...list(s.sportsVenues, "/sports"), ...list(s.sportsClubs, "/sports/clubs"), ...list(s.transport, "/transport"),
    ...list(s.experiences, "/experiences"), ...list(s.events, "/events"), ...list(s.articles, "/articles"), ...list(s.investments, "/investment"),
    ...jobs.map((j) => ({ url: base(`/jobs/${j.slug}`), lastModified: j.published_at ?? undefined })),
    ...s.listings.map((l) => ({ url: base(`/${listingSection(l.type)}/${l.slug}`), lastModified: l.updated_at })),
  ];
}
