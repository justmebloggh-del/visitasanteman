import type { Metadata } from "next";
import { CardGrid, ContentCard, EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { buildMetadata } from "@/components/layout/seo";
import { AdSlot } from "@/components/ads/AdSlot";
import { Container } from "@/components/ui";
import { experienceCategoryLabels } from "@/config/site";
import { listAreas, listExperiences, toPage } from "@/lib/content/public";
import { formatDuration, formatPrice } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Tours and experiences in Asanteman",
  description: "Guided tours, outdoor activities and cultural experiences offered by local providers across Asanteman.",
  path: "/experiences",
});

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; area?: string; page?: string }> }) {
  const sp = await searchParams;
  const [result, areas] = await Promise.all([listExperiences({ q: sp.q, category: sp.category, area: sp.area, page: toPage(sp.page) }), listAreas()]);
  const filtered = !!(sp.q || sp.category || sp.area);
  return (
    <>
      <PageHeader title="Tours and experiences" intro="Activities run by local providers. Send a booking request and the provider will confirm availability." crumbs={[{ label: "Experiences" }]} />
      <AdSlot placement="directory_top" />
      <Container className="py-10">
        <FilterBar action="/experiences" q={sp.q} values={{ area: sp.area, category: sp.category }}
          filters={[...(areas.length ? [{ name: "area", label: "District", options: areas.map((a) => ({ value: a.slug, label: a.name })) }] : []), { name: "category", label: "Type", options: Object.entries(experienceCategoryLabels).map(([value, label]) => ({ value, label })) }]} />
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "experience" : "experiences"}</p>
        {result.items.length === 0 ? (
          <EmptyState title={filtered ? "No experiences match those filters" : "Experiences are being added"}
            text={filtered ? "Try removing a filter." : "We list an experience only after a provider has confirmed the details."}
            action={filtered ? { href: "/experiences", label: "Clear filters" } : { href: "/contact?kind=business_listing", label: "Offer an experience" }} />
        ) : (
          <CardGrid>
            {result.items.map((e) => (
              <ContentCard key={e.id} href={`/experiences/${e.slug}`} title={e.title} summary={e.summary} media={e.cover}
                meta={[experienceCategoryLabels[e.category], formatDuration(e.duration_minutes), e.price_from != null ? `From ${formatPrice(e.price_from, e.price_currency)}` : null].filter(Boolean).join(" · ")}
                badge={e.provider_verified ? "Provider confirmed" : null} />
            ))}
          </CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath="/experiences" params={{ q: sp.q, category: sp.category, area: sp.area }} />
      </Container>
    </>
  );
}
