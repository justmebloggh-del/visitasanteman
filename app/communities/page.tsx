import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { FilterBar } from "@/components/layout/FilterBar";
import { listAreas, listCommunities } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Communities of the Ashanti Region",
  description: "The towns and villages of the Ashanti Region: their heritage, festivals, food and visitor attractions.",
  path: "/communities",
});

export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const sp = await searchParams;
  const [communities, areas] = await Promise.all([listCommunities({ area: sp.area }), listAreas()]);
  return (
    <>
      <PageHeader title="Our communities" intro="Towns and villages of the Ashanti Region." crumbs={[{ label: "Communities" }]} />
      <Container className="py-10">
        {areas.length > 0 && (
          <div className="mb-8"><FilterBar action="/communities" values={{ area: sp.area }} qLabel="" hideSearch
            filters={[{ name: "area", label: "District", options: areas.map((a) => ({ value: a.slug, label: a.name })) }]} /></div>
        )}
        {communities.length === 0 ? (
          <EmptyState title="Community pages are being prepared" text="We publish community profiles only after their history and heritage have been checked with local sources." />
        ) : (
          <CardGrid>{communities.map((c) => <ContentCard key={c.id} href={`/communities/${c.slug}`} title={c.name} summary={c.summary} media={c.cover} />)}</CardGrid>
        )}
      </Container>
    </>
  );
}
