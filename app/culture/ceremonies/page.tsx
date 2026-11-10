import type { Metadata } from "next";
import Link from "next/link";
import { CardGrid, ContentCard, EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { ceremonyWhen } from "@/components/listings/CeremonyBits";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { ceremonyKindLabels } from "@/config/site";
import { listAreas, listCeremonies, toPage } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Ceremonies and festivals in Asanteman",
  description: "A directory of traditional ceremonies, festivals and cultural occasions, with public attendance, etiquette and confirmed dates where the organisers have provided them.",
  path: "/culture/ceremonies",
});

export default async function CeremoniesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; area?: string; page?: string }> }) {
  const sp = await searchParams;
  const [result, areas] = await Promise.all([listCeremonies({ q: sp.q, kind: sp.kind, area: sp.area, page: toPage(sp.page) }), listAreas()]);
  const filtered = !!(sp.q || sp.kind || sp.area);
  return (
    <>
      <PageHeader title="Ceremonies and festivals" intro="Traditional ceremonies are not all public events. Each entry says whether visitors may attend and what the organisers ask of them." crumbs={[{ label: "Culture & Heritage", href: "/culture" }, { label: "Ceremonies" }]} />
      <Container className="py-10">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/culture/calendar" className="rounded-full border border-line px-4 py-2 font-medium text-forest hover:bg-forest-soft">Calendar of confirmed dates</Link>
        </div>
        <FilterBar action="/culture/ceremonies" q={sp.q} values={{ kind: sp.kind, area: sp.area }}
          filters={[
            { name: "kind", label: "Type", options: Object.entries(ceremonyKindLabels).map(([value, label]) => ({ value, label })) },
            ...(areas.length ? [{ name: "area", label: "District", options: areas.map((a) => ({ value: a.slug, label: a.name })) }] : []),
          ]} />
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "entry" : "entries"}</p>
        {result.items.length === 0 ? (
          <EmptyState title={filtered ? "Nothing matches those filters" : "Ceremonies and festivals are being prepared"}
            text={filtered ? "Try removing a filter." : "We publish a ceremony only after the responsible traditional authority or organiser has approved what is shown."}
            action={filtered ? { href: "/culture/ceremonies", label: "Clear filters" } : undefined} />
        ) : (
          <CardGrid>
            {result.items.map((c) => {
              const w = ceremonyWhen(c);
              return <ContentCard key={c.id} href={`/culture/ceremonies/${c.slug}`} title={c.name} summary={c.summary} media={c.cover}
                meta={[ceremonyKindLabels[c.kind], c.traditional_area?.name ?? c.community?.name ?? c.area?.name, w ? w.date : "Date to be confirmed"].filter(Boolean).join(" · ")} />;
            })}
          </CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath="/culture/ceremonies" params={{ q: sp.q, kind: sp.kind, area: sp.area }} />
      </Container>
    </>
  );
}
