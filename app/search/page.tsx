import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { AdSlot } from "@/components/ads/AdSlot";
import { SearchBox } from "@/components/layout/SearchBox";
import { Badge, Container } from "@/components/ui";
import { listAreas, toPage } from "@/lib/content/public";
import { searchKindLabels, searchSite } from "@/lib/search";

export const metadata: Metadata = { title: "Search", robots: { index: false } };
const PER = 20;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; area?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const kinds = sp.kind && sp.kind in searchKindLabels ? [sp.kind] : undefined;
  const page = toPage(sp.page);
  const [{ hits, total }, areas] = await Promise.all([searchSite(q, { kinds, area: sp.area, page, limit: PER }), listAreas()]);

  return (
    <>
      <PageHeader title="Search" intro="Places, ceremonies, hotels, restaurants, schools, sports, transport, businesses and stories." crumbs={[{ label: "Search" }]} />
      {q && <AdSlot placement="search_top" />}
      <Container className="space-y-8 py-10">
        <SearchBox defaultValue={q} className="max-w-2xl border border-line shadow-none" />
        {q && (
          <form action="/search" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="q" value={q} />
            <div><label htmlFor="s-kind" className="mb-1.5 block text-xs font-medium text-muted">Type</label>
              <select id="s-kind" name="kind" defaultValue={sp.kind ?? ""} className="h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">Everything</option>{Object.entries(searchKindLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            {areas.length > 0 && <div><label htmlFor="s-area" className="mb-1.5 block text-xs font-medium text-muted">District</label>
              <select id="s-area" name="area" defaultValue={sp.area ?? ""} className="h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">All districts</option>{areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}</select></div>}
            <button type="submit" className="h-11 rounded-lg bg-forest px-4 text-sm font-medium text-white">Filter</button>
          </form>
        )}
        {!q ? <p className="text-muted">Type a name or a word, for example a place, a festival, a school or a type of food.</p>
          : hits.length === 0 ? <EmptyState title={`No results for “${q}”`} text="Check the spelling, try a shorter word, or remove a filter. New places are added as they are verified." action={sp.kind || sp.area ? { href: `/search?q=${encodeURIComponent(q)}`, label: "Clear filters" } : undefined} />
          : (
            <>
              <p className="text-sm text-muted" aria-live="polite">{total} {total === 1 ? "result" : "results"} for “{q}”</p>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
                {hits.map((h) => (
                  <li key={`${h.kind}-${h.id}`}>
                    <Link href={h.href} className="block p-5 hover:bg-forest-soft/50">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-serif text-lg font-semibold text-forest">{h.title}</span><Badge tone="blue">{searchKindLabels[h.kind] ?? h.kind}</Badge>{h.area_name && <span className="text-sm text-muted">{h.area_name}</span>}</div>
                      {h.summary && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{h.summary}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PER))} basePath="/search" params={{ q, kind: sp.kind, area: sp.area }} />
            </>
          )}
      </Container>
    </>
  );
}
