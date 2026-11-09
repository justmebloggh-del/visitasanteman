import Link from "next/link";
import { CardGrid, ContentCard } from "@/components/layout/blocks";
import { CmsPage, cmsMetadata } from "@/components/layout/CmsPage";
import { Map } from "@/components/maps/Map";
import { getAreaContentCounts, getMapPoints, getSettings, listAreas, listAttractions, listCommunities, listDestinations } from "@/lib/content/public";

export const revalidate = 60;
export const generateMetadata = () => cmsMetadata("explore", "Explore the Ashanti Region");

export default async function ExplorePage() {
  const [communities, attractions, points, settings, areas, counts, destinations] = await Promise.all([listCommunities(), listAttractions({ limit: 3 }), getMapPoints(), getSettings(), listAreas(), getAreaContentCounts(), listDestinations({ limit: 6 })]);
  const m = settings.map ?? {};
  return (
    <CmsPage slug="explore" fallbackTitle="Explore the Ashanti Region">
      {destinations.length > 0 && <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Destinations</h2><CardGrid>{destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} meta={d.area?.name} />)}</CardGrid></section>}
      {areas.length > 0 && (
        <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Browse by district</h2>
          <ul className="flex flex-wrap gap-2">{areas.map((a) => <li key={a.id}><Link href={`/districts/${a.slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft">{a.name}{(counts[a.id] ?? 0) > 0 ? "" : " (being prepared)"}</Link></li>)}</ul></section>
      )}
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold text-forest">Location map</h2>
        <Map points={points} center={[Number(m.center_lng ?? -1.6), Number(m.center_lat ?? 6.7)]} zoom={Number(m.zoom ?? 8)} />
        <p className="mt-2 text-xs text-muted">Map of the Ashanti Region. Markers appear only for places with verified coordinates. <Link href="/map" className="text-lake-dark underline">Open the full tourism map</Link>.</p>
      </section>
      {attractions.items.length > 0 && <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Featured attractions</h2><CardGrid>{attractions.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} />)}</CardGrid></section>}
      {communities.length > 0 && (
        <section className="mt-12"><h2 className="mb-4 text-2xl font-semibold text-forest">Communities</h2>
          <ul className="flex flex-wrap gap-2">{communities.map((c) => <li key={c.id}><Link href={`/communities/${c.slug}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft">{c.name}</Link></li>)}</ul></section>
      )}
    </CmsPage>
  );
}
