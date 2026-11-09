import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Breadcrumbs, Facts, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { StageBadge, StageNotice } from "@/components/investment/StageBadge";
import { Map } from "@/components/maps/Map";
import { Container } from "@/components/ui";
import { getInvestment } from "@/lib/content/public";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getInvestment((await params).slug);
  if (!p) return { title: "Not found" };
  return buildMetadata({ title: p.title, description: p.summary, path: `/investment/${p.slug}`, image: p.cover, seoTitle: p.seo_title, seoDescription: p.seo_description, canonical: p.canonical_url, noindex: p.noindex });
}

export default async function InvestmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getInvestment((await params).slug);
  if (!p) notFound();
  const est = p.investment_min != null || p.investment_max != null
    ? [p.investment_min != null ? formatPrice(Number(p.investment_min), p.investment_currency) : null, p.investment_max != null ? formatPrice(Number(p.investment_max), p.investment_currency) : null].filter(Boolean).join(" to ") : null;
  const hasCoords = p.latitude != null && p.longitude != null;
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Investment", path: "/investment" }, { name: p.title, path: `/investment/${p.slug}` }])} />
      <div className="relative h-56 bg-forest sm:h-80">
        <Photo media={p.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Investment", href: "/investment" }, { label: p.title }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{p.title}</h1>
          <StageBadge stage={p.stage} className="mt-2" />
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <StageNotice stage={p.stage} source={p.stage_source} />
          {p.cover && p.images_are_conceptual && <p className="text-xs text-muted">Images are conceptual illustrations and do not show an approved design or an existing facility.</p>}
          {p.summary && <p className="text-lg text-ink/90">{p.summary}</p>}
          <TextBlock title="About the project" text={p.description} />
          <TextBlock title="Development objectives" text={p.objectives} />
          <TextBlock title="Potential commercial opportunities" text={p.commercial_opportunities} />
          <TextBlock title="Environmental considerations" text={p.environmental_considerations} />
          <TextBlock title="Partnership requirements" text={p.partnership_requirements} />
          {hasCoords && <section><h2 className="mb-3 text-2xl font-semibold text-forest">Proposed location</h2><Map points={[{ id: p.id, kind: "attraction", title: p.title, href: `/investment/${p.slug}`, lat: Number(p.latitude), lng: Number(p.longitude) }]} center={[Number(p.longitude), Number(p.latitude)]} zoom={13} /></section>}
        </div>
        <aside className="space-y-6">
          <Facts items={[{ label: "Stage", value: p.stage.replace(/_/g, " ") }, { label: "Location", value: p.proposed_location ?? p.community?.name }, { label: "Estimated investment", value: est }, { label: "Basis of estimate", value: est ? p.investment_note : null }]} />
          <div id="enquire" className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-forest">Investor enquiry</h2>
            <EnquiryForm kind="investment" lockKind investmentId={p.id} subject={p.title} showOrganisation />
          </div>
        </aside>
      </Container>
    </>
  );
}
