import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation, Phone } from "lucide-react";
import { Breadcrumbs, CardGrid, ContentCard, Facts, Gallery, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { accommodationTypes, restaurantTypes, listingTypeLabels, type ListingType } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getAttraction, getGallery, getNearby, listAttractions, listListings } from "@/lib/content/public";
import { directionsLink, mediaUrl, safeUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getAttraction((await params).slug);
  if (!a) return { title: "Not found" };
  return buildMetadata({ title: a.name, description: a.summary, path: `/attractions/${a.slug}`, image: a.cover, seoTitle: a.seo_title, seoDescription: a.seo_description, canonical: a.canonical_url, noindex: a.noindex });
}

export default async function AttractionPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getAttraction((await params).slug);
  if (!a) notFound();
  const communitySlug = a.community?.slug;
  const [gallery, stays, food, related, nearby] = await Promise.all([
    getGallery("attraction", a.id),
    listListings(accommodationTypes, { community: communitySlug, limit: 3 }),
    listListings(restaurantTypes, { community: communitySlug, limit: 3 }),
    listAttractions({ category: a.category?.slug, limit: 4 }),
    a.latitude != null && a.longitude != null ? getNearby(Number(a.latitude), Number(a.longitude), a.id) : Promise.resolve([]),
  ]);
  const hasCoords = a.latitude != null && a.longitude != null;
  const dir = directionsLink(a.latitude, a.longitude);
  const video = safeUrl(a.video_url);
  const relatedItems = related.items.filter((x) => x.id !== a.id).slice(0, 3);
  // Nearby = same community. Only shown when the attraction is linked to a community.
  const nearbyStays = communitySlug ? stays.items : [];
  const nearbyFood = communitySlug ? food.items : [];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "TouristAttraction", name: a.name, description: a.summary ?? undefined,
        url: `${SITE_URL}/attractions/${a.slug}`, image: mediaUrl(a.cover?.path) ?? undefined,
        geo: hasCoords ? { "@type": "GeoCoordinates", latitude: a.latitude, longitude: a.longitude } : undefined,
      }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Attractions", path: "/attractions" }, { name: a.name, path: `/attractions/${a.slug}` }])} />
      <div className="relative h-64 bg-forest sm:h-[26rem]">
        <Photo media={a.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Attractions", href: "/attractions" }, { label: a.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{a.name}</h1>
          <p className="mt-2 flex flex-wrap gap-2">{a.category && <Badge tone="blue">{a.category.name}</Badge>}{a.community && <Badge tone="gold">{a.community.name}</Badge>}</p>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {a.summary && <p className="text-lg text-ink/90">{a.summary}</p>}
          <TextBlock title="About" text={a.description} />
          <TextBlock title="History" text={a.history} />
          {a.activities.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-semibold text-forest">Things to do</h2>
              <ul className="flex flex-wrap gap-2">{a.activities.map((x) => <li key={x}><Badge tone="green" className="px-3 py-1 text-sm">{x}</Badge></li>)}</ul></section>
          )}
          <TextBlock title="Visitor guidelines" text={a.visitor_guidelines} />
          <TextBlock title="Accessibility" text={a.accessibility} />
          <Gallery images={gallery} />
          {video && <section><h2 className="mb-2 text-2xl font-semibold text-forest">Video</h2><a href={video} target="_blank" rel="noopener noreferrer" className="text-lake-dark underline">Watch the video</a></section>}
          {hasCoords && (
            <section><h2 className="mb-3 text-2xl font-semibold text-forest">Location and directions</h2>
              <Map points={[{ id: a.id, kind: "attraction", title: a.name, href: `/attractions/${a.slug}`, lat: a.latitude!, lng: a.longitude! }]} center={[a.longitude!, a.latitude!]} zoom={14} />
              {a.directions && <p className="mt-3 whitespace-pre-line text-sm text-ink/90">{a.directions}</p>}</section>
          )}
          {!hasCoords && a.directions && <TextBlock title="Directions" text={a.directions} />}
          {a.sources && <p className="rounded-xl bg-mist p-4 text-xs text-muted"><strong className="text-ink">Sources:</strong> {a.sources}</p>}
        </div>
        <aside className="space-y-6">
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5">
            {dir && <ButtonLink href={dir} target="_blank" rel="noopener noreferrer"><Navigation className="size-4" aria-hidden />Get directions</ButtonLink>}
            {a.contact_phone && <ButtonLink href={`tel:${a.contact_phone.replace(/\s/g, "")}`} variant="outline"><Phone className="size-4" aria-hidden />{a.contact_phone}</ButtonLink>}
            {a.contact_email && <ButtonLink href={`mailto:${a.contact_email}`} variant="outline">Email</ButtonLink>}
            {!dir && !a.contact_phone && !a.contact_email && <p className="text-sm text-muted">Contact details have not been published yet.</p>}
          </div>
          <Facts items={[{ label: "Opening hours", value: a.opening_hours }, { label: "Entrance fee", value: a.entrance_fee }]} />
        </aside>
      </Container>

      {nearby.length > 0 && (
        <Container className="pb-10">
          <h2 className="mb-4 text-2xl font-semibold text-forest">Nearby</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((n) => <li key={n.id}><Link href={n.href} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 hover:shadow-md"><span><strong className="text-forest">{n.title}</strong><span className="block text-xs capitalize text-muted">{n.kind}</span></span><span className="text-sm text-muted">{n.distance_km < 1 ? `${Math.round(n.distance_km * 1000)} m` : `${n.distance_km.toFixed(1)} km`}</span></Link></li>)}
          </ul>
        </Container>
      )}

      {(nearbyStays.length > 0 || nearbyFood.length > 0 || relatedItems.length > 0) && (
        <Container className="space-y-12 pb-4">
          {nearbyStays.length > 0 && <Rail title={`Places to stay in ${a.community?.name}`}>{nearbyStays.map((l) => <ContentCard key={l.id} href={`/accommodation/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} meta={listingTypeLabels[l.type as ListingType]} />)}</Rail>}
          {nearbyFood.length > 0 && <Rail title={`Where to eat in ${a.community?.name}`}>{nearbyFood.map((l) => <ContentCard key={l.id} href={`/restaurants/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} />)}</Rail>}
          {relatedItems.length > 0 && <Rail title="Related attractions">{relatedItems.map((r) => <ContentCard key={r.id} href={`/attractions/${r.slug}`} title={r.name} summary={r.summary} media={r.cover} />)}</Rail>}
        </Container>
      )}
    </>
  );
}

function Rail({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-5 text-2xl font-semibold text-forest">{title}</h2><CardGrid>{children}</CardGrid></section>;
}
