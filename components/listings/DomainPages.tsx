import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Breadcrumbs, CardGrid, ContentCard, EmptyState, Facts, PageHeader, Pagination, Photo, TextBlock } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { breadcrumbLd, JsonLd } from "@/components/layout/seo";
import { AccessNotice, SourceNote, accessLabels } from "@/components/listings/AccessNotice";
import { Map } from "@/components/maps/Map";
import { Container } from "@/components/ui";
import { facilityStatusLabels, type DomainCfg } from "@/config/domains";
import { getDomainRecord, listDomain, type DomainRecord } from "@/lib/content/domains";
import { listAreas, toPage } from "@/lib/content/public";
import { directionsLink, formatDate, safeUrl } from "@/lib/utils";

const cell = (r: DomainRecord, c: { column: string; format?: string }, kinds?: Record<string, string>): string | null => {
  const v = r[c.column];
  if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
  if (c.format === "kind") return kinds?.[String(v)] ?? String(v);
  if (c.format === "tags") return (v as string[]).join(", ");
  if (c.format === "date") return formatDate(String(v));
  return String(v);
};

export async function DomainIndex({ cfg, searchParams }: { cfg: DomainCfg; searchParams: { q?: string; kind?: string; area?: string; page?: string } }) {
  const [result, areas] = await Promise.all([listDomain(cfg, { q: searchParams.q, kind: searchParams.kind, area: searchParams.area, page: toPage(searchParams.page) }), listAreas()]);
  const filtered = !!(searchParams.q || searchParams.kind || searchParams.area);
  const filters = [
    ...(cfg.kinds ? [{ name: "kind", label: "Type", options: Object.entries(cfg.kinds).map(([value, label]) => ({ value, label })) }] : []),
    ...(areas.length ? [{ name: "area", label: "District", options: areas.map((a) => ({ value: a.slug, label: a.name })) }] : []),
  ];
  return (
    <>
      <PageHeader title={cfg.title} intro={cfg.intro} crumbs={[...(cfg.crumbs ?? []).slice(0, -1), { label: cfg.title }]} />
      <Container className="py-10">
        {cfg.key === "sports" && (
          <div className="mb-6 flex flex-wrap gap-3 text-sm">
            <Link href="/sports/clubs" className="rounded-full border border-line px-4 py-2 font-medium text-forest hover:bg-forest-soft">Clubs</Link>
            <Link href="/sports/events" className="rounded-full border border-line px-4 py-2 font-medium text-forest hover:bg-forest-soft">Sports events</Link>
          </div>
        )}
        <FilterBar action={cfg.base} q={searchParams.q} values={{ kind: searchParams.kind, area: searchParams.area }} filters={filters} />
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "result" : "results"}</p>
        {result.items.length === 0 ? (
          <EmptyState title={filtered ? "Nothing matches those filters" : `${cfg.title} are being prepared`} text={filtered ? "Try removing a filter." : cfg.emptyText} action={filtered ? { href: cfg.base, label: "Clear filters" } : undefined} />
        ) : (
          <CardGrid>
            {result.items.map((r) => (
              <ContentCard key={r.id} href={`${cfg.base}/${r.slug}`} title={r.name} summary={r.summary} media={r.cover}
                meta={[cfg.kindColumn ? cfg.kinds?.[String(r[cfg.kindColumn])] : null, r.area?.name].filter(Boolean).join(" · ")} />
            ))}
          </CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath={cfg.base} params={{ q: searchParams.q, kind: searchParams.kind, area: searchParams.area }} />
      </Container>
    </>
  );
}

export async function DomainDetail({ cfg, slug }: { cfg: DomainCfg; slug: string }) {
  const r = await getDomainRecord(cfg, slug);
  if (!r) notFound();
  const hasCoords = r.latitude != null && r.longitude != null;
  const dir = directionsLink(r.latitude, r.longitude);
  const site = safeUrl(r.website);
  const status = cfg.statusColumn ? String(r[cfg.statusColumn] ?? "unknown") : null;
  const showFacility = cfg.statusColumn === "facility_status" && status && status !== "operational";
  const home = r.home as { name: string; slug: string } | null | undefined;

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: cfg.title, path: cfg.base }, { name: r.name, path: `${cfg.base}/${r.slug}` }])} />
      <div className="relative h-56 bg-forest sm:h-72">
        <Photo media={r.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: cfg.title, href: cfg.base }, { label: r.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{r.name}</h1>
          {cfg.kindColumn && <p className="mt-1 text-sm text-white/80">{cfg.kinds?.[String(r[cfg.kindColumn])]}</p>}
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {showFacility && (
            <section aria-label="Operating status" className="rounded-xl border border-gold bg-gold-soft p-4 text-sm">
              <p className="flex items-start gap-2 font-medium text-ink"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{facilityStatusLabels[status!] ?? facilityStatusLabels.unknown}</p>
            </section>
          )}
          {cfg.statusColumn === "visitor_access" && status && status !== "open_to_visitors" && <AccessNotice status={status} />}
          {r.summary && <p className="text-lg text-ink/90">{r.summary}</p>}
          <TextBlock title="About" text={r.description} />
          {cfg.sections.map((s) => <TextBlock key={s.column} title={s.title} text={r[s.column] as string | null} />)}
          {home && <p className="text-sm">Home ground: <Link className="text-lake-dark underline" href={`/sports/${home.slug}`}>{home.name}</Link></p>}
          {hasCoords && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-forest">Location</h2>
              <Map points={[{ id: r.id, kind: "business", title: r.name, href: `${cfg.base}/${r.slug}`, lat: r.latitude!, lng: r.longitude! }]} center={[r.longitude!, r.latitude!]} zoom={14} />
              {dir && <a href={dir} className="mt-3 inline-block text-sm text-lake-dark underline" target="_blank" rel="noopener noreferrer">Get directions</a>}
            </section>
          )}
          <SourceNote organisation={r.source_organisation} url={r.source_url} publishedAt={r.source_published_at} checkedAt={r.researched_at} />
        </div>
        <aside className="space-y-6">
          <Facts items={[
            ...cfg.facts.filter((f) => f.format !== "url").map((f) => ({ label: f.label, value: cell(r, f, cfg.kinds) })),
            { label: "Address", value: r.address }, { label: "Phone", value: r.contact_phone }, { label: "Email", value: r.contact_email },
          ]} />
          <ul className="space-y-1 text-sm">
            {site && <li><a href={site} className="text-lake-dark underline" target="_blank" rel="noopener noreferrer">Official website</a></li>}
            {cfg.facts.filter((f) => f.format === "url").map((f) => { const u = safeUrl(r[f.column] as string | null); return u ? <li key={f.column}><a href={u} className="text-lake-dark underline" target="_blank" rel="noopener noreferrer">{f.label}</a></li> : null; })}
            {r.area && <li>District: <Link href={`/districts/${r.area.slug}`} className="text-lake-dark underline">{r.area.name}</Link></li>}
          </ul>
        </aside>
      </Container>
    </>
  );
}

export const accessLabelsRef = accessLabels;
