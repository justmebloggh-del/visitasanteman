import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CardGrid, ContentCard, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { ButtonLink, Container } from "@/components/ui";
import { getDestination, listAttractions } from "@/lib/content/public";
import { directionsLink } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return { title: "Not found" };
  return buildMetadata({ title: d.name, description: d.summary, path: `/destinations/${d.slug}`, image: d.cover, seoTitle: d.seo_title, seoDescription: d.seo_description, canonical: d.canonical_url, noindex: d.noindex });
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const attractions = await listAttractions({ destination: d.slug, limit: 12 });
  const hasCoords = d.latitude != null && d.longitude != null;
  const dir = directionsLink(d.latitude, d.longitude);

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: d.name, path: `/destinations/${d.slug}` }])} />
      <div className="relative h-60 bg-forest sm:h-80">
        <Photo media={d.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Destinations", href: "/destinations" }, { label: d.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{d.name}</h1>
          {d.area && <p className="mt-1 text-sm text-white/80"><Link href={`/districts/${d.area.slug}`} className="underline">{d.area.name}</Link></p>}
        </Container>
      </div>
      <Container className="space-y-12 py-10">
        <div className="max-w-3xl space-y-8">
          {d.summary && <p className="text-lg text-ink/90">{d.summary}</p>}
          <TextBlock title="About this destination" text={d.description} />
          {d.sources && <p className="rounded-xl bg-mist p-4 text-xs text-muted"><strong className="text-ink">Sources:</strong> {d.sources}</p>}
        </div>
        {attractions.items.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-semibold text-forest">Things to see here</h2>
            <CardGrid>{attractions.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} badge={a.category?.name} />)}</CardGrid>
          </section>
        )}
        {hasCoords && (
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-forest">Map and directions</h2>
            <Map points={[{ id: d.id, kind: "attraction", title: d.name, href: `/destinations/${d.slug}`, lat: d.latitude!, lng: d.longitude! }]} center={[d.longitude!, d.latitude!]} zoom={12} />
            {d.directions && <p className="mt-3 max-w-3xl whitespace-pre-line text-sm">{d.directions}</p>}
            {dir && <ButtonLink href={dir} target="_blank" rel="noopener noreferrer" variant="outline" className="mt-3">Get directions</ButtonLink>}
          </section>
        )}
      </Container>
    </>
  );
}
