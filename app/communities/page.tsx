import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { listCommunities } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Communities around Lake Bosomtwe",
  description: "The towns and villages around Lake Bosomtwe: their heritage, festivals, food and visitor attractions.",
  path: "/communities",
});

export default async function CommunitiesPage() {
  const communities = await listCommunities();
  return (
    <>
      <PageHeader title="Our communities" intro="The towns and villages that surround the lake." crumbs={[{ label: "Communities" }]} />
      <Container className="py-10">
        {communities.length === 0 ? (
          <EmptyState title="Community pages are being prepared" text="We publish community profiles only after their history and heritage have been checked with local sources." />
        ) : (
          <CardGrid>{communities.map((c) => <ContentCard key={c.id} href={`/communities/${c.slug}`} title={c.name} summary={c.summary} media={c.cover} />)}</CardGrid>
        )}
      </Container>
    </>
  );
}
