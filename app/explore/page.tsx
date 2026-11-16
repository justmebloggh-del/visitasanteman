import Link from "next/link";
import { CardGrid, ContentCard } from "@/components/layout/blocks";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { Map } from "@/components/maps/Map";
import { getAreaContentCounts, getMapPoints, getSettings, listAreas, listAttractions, listCommunities, listDestinations } from "@/lib/content/public";

export const revalidate = 60;
export async function generateMetadata() {
  const m = await cmsMetadata("explore", "Explore Asanteman");
  // The page always has its own introduction below, so it can be indexed even before an editor writes a body.
  return { ...m, title: m.title ?? "Explore Asanteman", description: m.description ?? "Find destinations, districts, attractions, culture, events, places to stay and ways to plan your visit across Asanteman, Ghana.", robots: undefined };
}

const ways = [
  { href: "/destinations", title: "Destinations", text: "Places worth travelling for." },
  { href: "/districts", title: "Districts", text: "Browse Asanteman one district at a time." },
  { href: "/attractions", title: "Attractions", text: "Sights, sites and landmarks." },
  { href: "/culture", title: "Culture & Heritage", text: "History, traditions, ceremonies and festivals." },
  { href: "/experiences", title: "Experiences", text: "Things to do and ways to take part." },
  { href: "/events", title: "Events", text: "What is happening and how to register." },
  { href: "/accommodation", title: "Where to Stay", text: "Hotels, lodges, guesthouses and more." },
  { href: "/restaurants", title: "Food & Dining", text: "Places to eat and drink." },
  { href: "/travel-planner", title: "Travel Planner", text: "Put your visit together." },
];

export default async function ExplorePage() {
  const [communities, attractions, points, settings, areas, counts, destinations] = await Promise.all([listCommunities(), listAttractions({ limit: 3 }), getMapPoints(), getSettings(), listAreas(), getAreaContentCounts(), listDestinations({ limit: 6 })]);
  const m = settings.map ?? {};
  return (
    <CmsPage slug="explore" fallbackTitle="Explore Asanteman" fallback={
      <div>
        <p className="max-w-2xl text-lg text-muted">Asanteman is the homeland of the Asante people in Ghana. Start here to find places to visit, the culture behind them, and the practical help you need to plan a trip.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ways.map((w) => (
            <li key={w.href}><Link href={w.href} className="block h-full rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="text-lg font-semibold text-forest">{w.title}</span><span className="mt-1 block text-sm text-muted">{w.text}</span>
            </Link></li>
          ))}
        </ul>
      </div>
    }>
      {destinations.length > 0 && <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Destinations</h2><CardGrid>{destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} meta={d.area?.name} />)}</CardGrid></section>}
      {areas.length > 0 && (
        <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Browse by district</h2>
          <ul className="flex flex-wrap gap-2">{areas.map((a) => <li key={a.id}><Link href={`/districts/${a.slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft">{a.name}{(counts[a.id] ?? 0) > 0 ? "" : " (being prepared)"}</Link></li>)}</ul></section>
      )}
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold text-forest">Location map</h2>
        <Map points={points} center={[Number(m.center_lng ?? -1.6), Number(m.center_lat ?? 6.7)]} zoom={Number(m.zoom ?? 8)} />
        <p className="mt-2 text-xs text-muted">Map of Asanteman. Markers appear only for places with verified coordinates. <Link href="/map" className="text-lake-dark underline">Open the full tourism map</Link>.</p>
      </section>
      {attractions.items.length > 0 && <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Featured attractions</h2><CardGrid>{attractions.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} />)}</CardGrid></section>}
      {communities.length > 0 && (
        <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Communities</h2>
          <ul className="flex flex-wrap gap-2">{communities.map((c) => <li key={c.id}><Link href={`/communities/${c.slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft">{c.name}</Link></li>)}</ul></section>
      )}
    </CmsPage>
  );
}
