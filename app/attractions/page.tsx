import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { buildMetadata } from "@/components/layout/seo";
import { AdSlot } from "@/components/ads/AdSlot";
import { Container } from "@/components/ui";
import { getAttractionCategories, listAttractions, listCommunities, toPage } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Attractions around Lake Bosomtwe",
  description: "Natural, cultural and adventure attractions in and around Lake Bosomtwe, Ashanti Region, Ghana.",
  path: "/attractions",
});

export default async function AttractionsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; community?: string; page?: string }> }) {
  const sp = await searchParams;
  const [result, categories, communities] = await Promise.all([
    listAttractions({ q: sp.q, category: sp.category, community: sp.community, page: toPage(sp.page) }),
    getAttractionCategories(), listCommunities(),
  ]);
  const filtered = !!(sp.q || sp.category || sp.community);
  return (
    <>
      <PageHeader title="Attractions" intro="Places to see and things to do around Lake Bosomtwe." crumbs={[{ label: "Attractions" }]} />
      <AdSlot placement="directory_top" />
      <Container className="py-10">
        <FilterBar action="/attractions" q={sp.q} values={{ category: sp.category, community: sp.community }}
          filters={[
            { name: "category", label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
            { name: "community", label: "Community", options: communities.map((c) => ({ value: c.slug, label: c.name })) },
          ]} />
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "attraction" : "attractions"}</p>
        {result.items.length === 0 ? (
          <EmptyState title={filtered ? "No attractions match those filters" : "Attractions are being added"}
            text={filtered ? "Try removing a filter." : "We only publish attractions once their details have been checked. Please check back soon."}
            action={filtered ? { href: "/attractions", label: "Clear filters" } : undefined} />
        ) : (
          <CardGrid>
            {result.items.map((a) => <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} meta={a.community?.name} badge={a.category?.name} />)}
          </CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath="/attractions" params={{ q: sp.q, category: sp.category, community: sp.community }} />
      </Container>
    </>
  );
}
