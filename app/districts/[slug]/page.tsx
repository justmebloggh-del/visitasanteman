import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs, CardGrid, ContentCard, Photo } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Container } from "@/components/ui";
import { accommodationTypes, experienceCategoryLabels, eventStatusLabels, listingTypeLabels, restaurantTypes, type ListingType } from "@/config/site";
import {
  areaKindLabels, getArea, listAttractions, listCommunities, listDestinations, listEvents, listExperiences, listListings,
} from "@/lib/content/public";
import { formatDate, formatPrice } from "@/lib/utils";
import type { MapPoint } from "@/types/content";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArea((await params).slug);
  if (!a) return { title: "Not found" };
  return buildMetadata({
    title: a.seo_title || a.name, description: a.seo_description || a.summary || `Places to visit in ${a.name}, Ashanti Region.`, path: `/districts/${a.slug}`, image: a.cover,
  });
}

export default async function DistrictPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = await getArea(slug);
  if (!area) notFound();
  const [attractions, communities, stays, food, experiences, events, destinations] = await Promise.all([
    listAttractions({ area: slug, limit: 6 }),
    listCommunities({ area: slug }),
    listListings(accommodationTypes, { area: slug, limit: 6 }),
    listListings(restaurantTypes, { area: slug, limit: 6 }),
    listExperiences({ area: slug, limit: 6 }),
    listEvents({ area: slug, limit: 6 }),
    listDestinations({ area: slug }),
  ]);
  const total = attractions.total + communities.length + stays.total + food.total + experiences.total + events.total + destinations.length;

  // Only places with real, entered coordinates appear on the map.
  const points: MapPoint[] = [
    ...attractions.items.filter((x) => x.latitude != null && x.longitude != null).map((x): MapPoint => ({ id: x.id, kind: "attraction", title: x.name, href: `/attractions/${x.slug}`, lat: x.latitude!, lng: x.longitude! })),
    ...communities.filter((x) => x.latitude != null && x.longitude != null).map((x): MapPoint => ({ id: x.id, kind: "community", title: x.name, href: `/communities/${x.slug}`, lat: x.latitude!, lng: x.longitude! })),
    ...stays.items.filter((x) => x.latitude != null && x.longitude != null).map((x): MapPoint => ({ id: x.id, kind: "accommodation", title: x.name, href: `/accommodation/${x.slug}`, lat: x.latitude!, lng: x.longitude! })),
    ...food.items.filter((x) => x.latitude != null && x.longitude != null).map((x): MapPoint => ({ id: x.id, kind: "restaurant", title: x.name, href: `/restaurants/${x.slug}`, lat: x.latitude!, lng: x.longitude! })),
  ];
  const centre: [number, number] | null = area.latitude != null && area.longitude != null ? [area.longitude, area.latitude] : points.length ? [points[0].lng, points[0].lat] : null;

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Districts", path: "/districts" }, { name: area.name, path: `/districts/${area.slug}` }])} />
      <div className="relative h-56 bg-forest sm:h-72">
        <Photo media={area.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Districts", href: "/districts" }, { label: area.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{area.name}</h1>
          <p className="mt-1 text-sm text-white/80">{areaKindLabels[area.kind]}{area.capital_name ? ` · Capital: ${area.capital_name}` : ""}{area.region ? ` · ${area.region.name}` : ""}</p>
        </Container>
      </div>

      <AdSlot placement="district_top" />
      <Container className="space-y-12 py-10">
        {area.summary && <p className="max-w-3xl text-lg text-ink/90">{area.summary}</p>}
        {total === 0 && (
          <p className="max-w-3xl rounded-xl bg-mist p-4 text-sm text-muted">
            We are still gathering and checking information about {area.name}. Places, communities and events appear here as soon as they have been verified and published.
            You can <Link href="/contact?kind=business_listing" className="text-lake-dark underline">list a business</Link> or <Link href="/contact" className="text-lake-dark underline">tell us about something we should include</Link>.
          </p>
        )}

        {destinations.length > 0 && <Rail title="Destinations" more={{ href: "/destinations", label: "All destinations" }}>{destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} />)}</Rail>}
        {attractions.items.length > 0 && <Rail title={`Attractions in ${area.name}`} more={{ href: `/attractions?area=${area.slug}`, label: "All attractions" }}>{attractions.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} meta={a.community?.name} badge={a.category?.name} />)}</Rail>}
        {communities.length > 0 && <Rail title="Communities" more={{ href: `/communities?area=${area.slug}`, label: "All communities" }}>{communities.map((c) => <ContentCard key={c.id} href={`/communities/${c.slug}`} title={c.name} summary={c.summary} media={c.cover} />)}</Rail>}
        {experiences.items.length > 0 && <Rail title="Tours and experiences" more={{ href: `/experiences?area=${area.slug}`, label: "All experiences" }}>{experiences.items.map((e) => <ContentCard key={e.id} href={`/experiences/${e.slug}`} title={e.title} summary={e.summary} media={e.cover} meta={[experienceCategoryLabels[e.category], e.price_from != null ? `From ${formatPrice(e.price_from, e.price_currency)}` : null].filter(Boolean).join(" · ")} />)}</Rail>}
        {stays.items.length > 0 && <Rail title="Where to stay" more={{ href: `/accommodation?area=${area.slug}`, label: "All accommodation" }}>{stays.items.map((l) => <ContentCard key={l.id} href={`/accommodation/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} meta={listingTypeLabels[l.type as ListingType]} badge={l.is_verified ? "Verified" : null} />)}</Rail>}
        {food.items.length > 0 && <Rail title="Food and dining" more={{ href: `/restaurants?area=${area.slug}`, label: "All restaurants" }}>{food.items.map((l) => <ContentCard key={l.id} href={`/restaurants/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} badge={l.is_verified ? "Verified" : null} />)}</Rail>}
        {events.items.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-semibold text-forest">Upcoming events</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {events.items.map((ev) => (
                <li key={ev.id}><Link href={`/events/${ev.slug}`} className="block rounded-2xl border border-line bg-white p-4 hover:shadow-md">
                  <span className="font-serif text-lg font-semibold text-forest">{ev.title}</span>
                  <span className="mt-1 block text-sm text-muted">{[ev.venue, ev.event_status !== "scheduled" ? eventStatusLabels[ev.event_status] : formatDate(ev.starts_at)].filter(Boolean).join(" · ")}</span>
                </Link></li>
              ))}
            </ul>
          </section>
        )}

        {points.length > 0 && centre && (
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-forest">Map</h2>
            <p className="mb-3 text-sm text-muted">Only places with verified coordinates are shown.</p>
            <Map points={points} center={centre} zoom={10} />
          </section>
        )}

        <p className="text-sm text-muted">More from Ashanti: <Link href="/articles" className="text-lake-dark underline underline-offset-2 hover:no-underline">stories and news</Link> · <Link href="/gallery" className="text-lake-dark underline underline-offset-2 hover:no-underline">photo gallery</Link></p>

        {(area.source || area.source_url) && (
          <p className="max-w-3xl rounded-xl bg-mist p-4 text-xs text-muted">
            <strong className="text-ink">District information source:</strong> {area.source}
            {area.source_url && <> (<a href={area.source_url} className="underline" rel="noopener noreferrer" target="_blank">link</a>)</>}
            {area.verified_at && <>. Checked {formatDate(area.verified_at)}.</>}
          </p>
        )}
      </Container>
    </>
  );
}

function Rail({ title, more, children }: { title: string; more?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-semibold text-forest">{title}</h2>
        {more && <Link href={more.href} className="text-sm font-medium text-forest hover:underline">{more.label}</Link>}
      </div>
      <CardGrid>{children}</CardGrid>
    </section>
  );
}
