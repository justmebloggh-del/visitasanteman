import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { listDestinations } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Destinations in Asanteman",
  description: "Featured destinations across Asanteman, each with its attractions, places to stay and practical information.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const destinations = await listDestinations();
  return (
    <>
      <PageHeader title="Destinations" intro="Places worth planning a trip around." crumbs={[{ label: "Destinations" }]} />
      <Container className="py-10">
        {destinations.length === 0 ? (
          <EmptyState title="Destinations are being added" text="We publish a destination only after its details have been checked." action={{ href: "/districts", label: "Browse by district" }} />
        ) : (
          <CardGrid>{destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} meta={d.area?.name} />)}</CardGrid>
        )}
      </Container>
    </>
  );
}
