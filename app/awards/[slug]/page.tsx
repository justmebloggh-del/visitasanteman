import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NominationForm } from "@/components/awards/NominationForm";
import { Breadcrumbs, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Badge, Container } from "@/components/ui";
import { getAwardProgramme, listAwardShortlist } from "@/lib/content/public";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getAwardProgramme((await params).slug);
  if (!p) return { title: "Not found" };
  return buildMetadata({ title: p.title, description: p.summary, path: `/awards/${p.slug}`, image: p.cover, seoTitle: p.seo_title, seoDescription: p.seo_description, canonical: p.canonical_url, noindex: p.noindex });
}

export default async function AwardPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getAwardProgramme((await params).slug);
  if (!p) notFound();
  const shortlist = await listAwardShortlist(p.id);
  const open = p.nominations_open && (!p.nominations_close_at || new Date(p.nominations_close_at) > new Date());
  const byCategory = p.categories.map((c) => ({ c, items: shortlist.filter((s) => s.category === c) })).filter((g) => g.items.length > 0);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Awards", path: "/awards" }, { name: p.title, path: `/awards/${p.slug}` }])} />
      <header className="relative bg-forest-dark text-white">
        {p.cover && <div className="absolute inset-0 opacity-30"><Photo media={p.cover} sizes="100vw" priority /></div>}
        <Container className="relative py-12 sm:py-16">
          <div className="mb-4 [&_*]:!text-white/70 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Awards", href: "/awards" }, { label: p.title }]} /></div>
          <h1 className="text-3xl font-semibold sm:text-5xl">{p.title}</h1>
          {p.year && <p className="mt-2 text-white/80">{p.year}</p>}
          {open && <Badge tone="green" className="mt-3">Nominations open{p.nominations_close_at ? ` until ${formatDate(p.nominations_close_at, true)}` : ""}</Badge>}
        </Container>
      </header>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {p.summary && <p className="text-lg text-ink/90">{p.summary}</p>}
          <TextBlock title="About this programme" text={p.description} />
          {p.categories.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-semibold text-forest">Categories</h2>
              <ul className="list-disc space-y-1 pl-5">{p.categories.map((c) => <li key={c}>{c}</li>)}</ul></section>
          )}
          <TextBlock title="Who can be nominated" text={p.eligibility} />
          <TextBlock title="Evaluation criteria" text={p.judging_criteria} />
          <TextBlock title="How judging works" text={p.judging_process} />
          {byCategory.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-semibold text-forest">Shortlist and winners</h2>
              {byCategory.map((g) => (
                <div key={g.c} className="mb-5"><h3 className="font-semibold">{g.c}</h3>
                  <ul className="mt-1 space-y-1">{g.items.map((i) => (
                    <li key={i.id}>{i.nominee_name}{i.nominee_organisation ? `, ${i.nominee_organisation}` : ""}{i.nominee_location ? ` (${i.nominee_location})` : ""} {i.is_winner && <Badge tone="gold">Winner</Badge>}</li>
                  ))}</ul></div>
              ))}</section>
          )}
          <section className="rounded-2xl bg-mist p-5 text-sm">
            <h2 className="mb-2 text-lg font-semibold text-forest">Fair and transparent</h2>
            <p>Nominations are reviewed against the published criteria. Sponsorship or payment never guarantees a nomination, a shortlist place or an award. Only shortlisted nominees are named here, and nominators&rsquo; details are never published.</p>
          </section>
        </div>
        <aside>
          <section aria-labelledby="nominate" className="rounded-2xl border border-line bg-white p-5">
            <h2 id="nominate" className="mb-3 text-xl font-semibold text-forest">Nominate</h2>
            {open && p.categories.length > 0 ? <NominationForm programmeId={p.id} categories={p.categories} /> : <p className="text-sm text-muted">Nominations are not open for this programme.</p>}
          </section>
        </aside>
      </Container>
    </>
  );
}
