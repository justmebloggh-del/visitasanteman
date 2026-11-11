import type { Metadata } from "next";
import Link from "next/link";
import { CardGrid, ContentCard, EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { ceremonyWhen } from "@/components/listings/CeremonyBits";
import { buildMetadata } from "@/components/layout/seo";
import { Container } from "@/components/ui";
import { ceremonyKindLabels } from "@/config/site";
import { listAreas, listCeremonies, listCeremonyPreviews, toPage } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Ceremonies and festivals in Asanteman",
  description: "A directory of traditional ceremonies, festivals and cultural occasions, with public attendance, etiquette and confirmed dates where the organisers have provided them.",
  path: "/culture/ceremonies",
});

export default async function CeremoniesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; area?: string; page?: string }> }) {
  const sp = await searchParams;
  const [result, areas, previewsAll] = await Promise.all([listCeremonies({ q: sp.q, kind: sp.kind, area: sp.area, page: toPage(sp.page) }), listAreas(), listCeremonyPreviews()]);
  const q = (sp.q ?? "").trim().toLowerCase();
  const previews = previewsAll.filter((c) => (!sp.kind || c.kind === sp.kind) && (!q || c.name.toLowerCase().includes(q)) && !sp.area);
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
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "entry" : "entries"}{previews.length > 0 ? `, plus ${previews.length} awaiting approval below` : ""}</p>
        {result.items.length === 0 ? (previews.length > 0 && !filtered ? null : <EmptyState title={filtered ? "Nothing matches those filters" : "Ceremonies and festivals are being prepared"}
            text={filtered ? "Try removing a filter." : "We publish a ceremony only after the responsible traditional authority or organiser has approved what is shown."}
            action={filtered ? { href: "/culture/ceremonies", label: "Clear filters" } : undefined} />)
        : (
          <CardGrid>
            {result.items.map((c) => {
              const w = ceremonyWhen(c);
              return <ContentCard key={c.id} href={`/culture/ceremonies/${c.slug}`} title={c.name} summary={c.summary} media={c.cover}
                meta={[ceremonyKindLabels[c.kind], c.traditional_area?.name ?? c.community?.name ?? c.area?.name, w ? w.date : "Date to be confirmed"].filter(Boolean).join(" · ")} />;
            })}
          </CardGrid>
        )}
        {previews.length > 0 && (
          <section className="mt-12" aria-labelledby="awaiting">
            <h2 id="awaiting" className="text-2xl font-semibold text-forest">Awaiting approval</h2>
            <p className="mt-1 max-w-3xl text-muted">These ceremonies and festivals are described from public sources. The responsible traditional authority has not yet approved what is shown, and no dates are confirmed. Timings are usual patterns only, so check with the organisers before you plan around one.</p>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {previews.map((c) => (
                <li key={c.id} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                  <span className="mb-2 inline-flex w-fit rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-gold-dark">Awaiting approval</span>
                  <h3 className="font-serif text-lg font-semibold text-forest">{c.name}</h3>
                  <p className="text-xs text-muted">{ceremonyKindLabels[c.kind]} · Date to be confirmed</p>
                  {c.summary && <p className="mt-3 text-sm leading-snug text-ink/90">{c.summary}</p>}
                  {c.date_note && <p className="mt-3 text-sm text-muted"><strong className="text-ink">Usual timing:</strong> {c.date_note}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath="/culture/ceremonies" params={{ q: sp.q, kind: sp.kind, area: sp.area }} />
      </Container>
    </>
  );
}
