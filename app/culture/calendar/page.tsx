import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { ceremonyWhen } from "@/components/listings/CeremonyBits";
import { Container } from "@/components/ui";
import { ceremonyKindLabels } from "@/config/site";
import { listAreas, listCeremonies } from "@/lib/content/public";
import { cn } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Cultural calendar",
  description: "Ceremonies and festivals in Asanteman with dates confirmed by the organisers. Dates are announced each year.",
  path: "/culture/calendar",
});

const monthLabel = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));
const shift = (m: string, by: number) => { const d = new Date(`${m}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + by); return d.toISOString().slice(0, 7); };

export default async function CulturalCalendar({ searchParams }: { searchParams: Promise<{ month?: string; area?: string; kind?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : now.toISOString().slice(0, 7);
  const [result, areas] = await Promise.all([listCeremonies({ month, area: sp.area, kind: sp.kind, limit: 100 }), listAreas()]);
  const q = (m: string) => `/culture/calendar?month=${m}${sp.area ? `&area=${sp.area}` : ""}${sp.kind ? `&kind=${sp.kind}` : ""}`;

  return (
    <>
      <PageHeader title="Cultural calendar" intro="Only dates the organisers have confirmed appear here. Traditional dates are announced each year, so always check the official announcement before you travel." crumbs={[{ label: "Culture & Heritage", href: "/culture" }, { label: "Calendar" }]} />
      <Container className="py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2" role="group" aria-label="Month">
            <Link href={q(shift(month, -1))} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft" rel="nofollow">Previous</Link>
            <h2 className="min-w-40 text-center font-serif text-xl font-semibold text-forest">{monthLabel(month)}</h2>
            <Link href={q(shift(month, 1))} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-forest-soft" rel="nofollow">Next</Link>
          </div>
          <form action="/culture/calendar" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="month" value={month} />
            <div><label htmlFor="cal-kind" className="mb-1.5 block text-xs font-medium text-muted">Type</label>
              <select id="cal-kind" name="kind" defaultValue={sp.kind ?? ""} className="h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">All types</option>{Object.entries(ceremonyKindLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            {areas.length > 0 && <div><label htmlFor="cal-area" className="mb-1.5 block text-xs font-medium text-muted">District</label>
              <select id="cal-area" name="area" defaultValue={sp.area ?? ""} className="h-11 rounded-lg border border-line bg-white px-3 text-sm"><option value="">All districts</option>{areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}</select></div>}
            <button type="submit" className="h-11 rounded-lg bg-forest px-4 text-sm font-medium text-white">Apply</button>
          </form>
        </div>
        {result.items.length === 0 ? (
          <EmptyState title={`No confirmed dates in ${monthLabel(month)}`} text="That does not mean nothing is happening: many dates are only announced shortly before. See the directory for ceremonies and festivals without a confirmed date." action={{ href: "/culture/ceremonies", label: "Browse ceremonies and festivals" }} />
        ) : (
          <ul className="space-y-4">
            {result.items.map((c) => {
              const w = ceremonyWhen(c)!;
              return (
                <li key={c.id}>
                  <Link href={`/culture/ceremonies/${c.slug}`} className={cn("flex gap-5 rounded-2xl border border-line bg-white p-5 transition hover:shadow-md")}>
                    <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-forest text-center text-white">
                      <div><div className="text-xl font-semibold leading-none">{new Date(c.starts_at!).getUTCDate()}</div><div className="text-xs uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(c.starts_at!))}</div></div>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-forest">{c.name}</h3>
                      <p className="mt-1 text-sm text-muted">{[ceremonyKindLabels[c.kind], c.traditional_area?.name ?? c.community?.name ?? c.area?.name, w.time].filter(Boolean).join(" · ")}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
