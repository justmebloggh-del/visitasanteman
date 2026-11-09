import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, CardGrid, ContentCard, Gallery, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { ButtonLink, Container } from "@/components/ui";
import { accommodationTypes, listingTypeLabels, restaurantTypes, type ListingType } from "@/config/site";
import { getCommunity, getGallery, listAttractions, listEvents, listListings } from "@/lib/content/public";
import { directionsLink, formatDate } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCommunity((await params).slug);
  if (!c) return { title: "Not found" };
  return buildMetadata({ title: c.name, description: c.summary, path: `/communities/${c.slug}`, image: c.cover, seoTitle: c.seo_title, seoDescription: c.seo_description, canonical: c.canonical_url, noindex: c.noindex });
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCommunity((await params).slug);
  if (!c) notFound();
  const [gallery, attractions, stays, food, events] = await Promise.all([
    getGallery("community", c.id),
    listAttractions({ community: c.slug, limit: 6 }),
    listListings(accommodationTypes, { community: c.slug, limit: 6 }),
    listListings(restaurantTypes, { community: c.slug, limit: 6 }),
    listEvents({ limit: 20 }),
  ]);
  const hasCoords = c.latitude != null && c.longitude != null;
  const dir = directionsLink(c.latitude, c.longitude);
  const hasContent = [c.summary, c.history, c.cultural_heritage, c.traditional_leadership, c.festivals, c.traditional_food].some(Boolean);

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Communities", path: "/communities" }, { name: c.name, path: `/communities/${c.slug}` }])} />
      <div className="relative h-60 bg-forest sm:h-80">
        <Photo media={c.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Communities", href: "/communities" }, { label: c.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{c.name}</h1>
        </Container>
      </div>
      <Container className="space-y-12 py-10">
        <div className="max-w-3xl space-y-10">
          {c.summary && <p className="text-lg text-ink/90">{c.summary}</p>}
          {!hasContent && <p className="rounded-xl bg-mist p-4 text-sm text-muted">We are still gathering and verifying information about {c.name}.</p>}
          <TextBlock title="History" text={c.history} />
          <TextBlock title="Cultural heritage" text={c.cultural_heritage} />
          <TextBlock title="Traditional leadership" text={c.traditional_leadership} />
          <TextBlock title="Festivals" text={c.festivals} />
          <TextBlock title="Traditional food" text={c.traditional_food} />
          {c.sources && <p className="rounded-xl bg-mist p-4 text-xs text-muted"><strong className="text-ink">Sources:</strong> {c.sources}</p>}
        </div>
        <Gallery images={gallery} />
        {attractions.items.length > 0 && <Rail title={`Attractions in ${c.name}`}>{attractions.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} />)}</Rail>}
        {stays.items.length > 0 && <Rail title="Where to stay">{stays.items.map((l) => <ContentCard key={l.id} href={`/accommodation/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} meta={listingTypeLabels[l.type as ListingType]} />)}</Rail>}
        {food.items.length > 0 && <Rail title="Where to eat">{food.items.map((l) => <ContentCard key={l.id} href={`/restaurants/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} />)}</Rail>}
        {hasCoords && (
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-forest">Map and directions</h2>
            <Map points={[{ id: c.id, kind: "community", title: c.name, href: `/communities/${c.slug}`, lat: c.latitude!, lng: c.longitude! }]} center={[c.longitude!, c.latitude!]} zoom={13} />
            {c.directions && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm">{c.directions}</p>}
            {dir && <ButtonLink href={dir} target="_blank" rel="noopener noreferrer" variant="outline" className="mt-3">Get directions</ButtonLink>}
          </section>
        )}
        {events.items.length > 0 && (
          <p className="text-sm text-muted">Looking for things happening around the lake? See <Link href="/events" className="text-lake-dark underline">upcoming events</Link> (next: {events.items[0].title}, {formatDate(events.items[0].starts_at)}).</p>
        )}
      </Container>
    </>
  );
}

function Rail({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-5 text-2xl font-semibold text-forest">{title}</h2><CardGrid>{children}</CardGrid></section>;
}
