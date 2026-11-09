import type { Metadata } from "next";
import Link from "next/link";
import { CardGrid, ContentCard, EmptyState, PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { ButtonLink, Container } from "@/components/ui";
import { stageLabels, type ProjectStage } from "@/config/site";
import { listInvestments } from "@/lib/content/public";
import { cn } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: "Invest in Lake Bosomtwe", description: "Tourism investment and partnership opportunities around Lake Bosomtwe, each labelled by its real status: existing, approved, proposed or under consideration.", path: "/investment" });

export default async function InvestmentIndex({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const sp = await searchParams;
  const stage = sp.stage && sp.stage in stageLabels ? sp.stage : undefined;
  const items = await listInvestments({ stage });
  return (
    <>
      <PageHeader title="Invest in Lake Bosomtwe" intro="Opportunities and partnerships for sustainable tourism." crumbs={[{ label: "Investment" }]} />
      <Container className="py-10">
        <p className="mb-6 max-w-3xl rounded-2xl bg-mist p-4 text-sm text-muted">Every project below is labelled with its real status. <strong>Proposed concepts and opportunities under consideration are not approved or funded projects.</strong> Nothing here is an offer of securities or a guarantee of returns. Do your own due diligence.</p>
        <nav aria-label="Filter by stage" className="mb-8 flex flex-wrap gap-2">
          <Link href="/investment" className={cn("rounded-full border px-4 py-1.5 text-sm", !stage ? "border-forest bg-forest text-white" : "border-line")}>All</Link>
          {Object.entries(stageLabels).map(([k, l]) => <Link key={k} href={`/investment?stage=${k}`} className={cn("rounded-full border px-4 py-1.5 text-sm", stage === k ? "border-forest bg-forest text-white" : "border-line")}>{l}</Link>)}
        </nav>
        {items.length === 0 ? (
          <EmptyState title="No projects published yet" text="Investment profiles are published only after their status has been checked. Contact us to discuss a partnership." action={{ href: "/contact?kind=investment", label: "Talk to us" }} />
        ) : (
          <CardGrid>{items.map((p) => <ContentCard key={p.id} href={`/investment/${p.slug}`} title={p.title} summary={p.summary} media={p.cover} meta={p.proposed_location ?? p.community?.name} badge={stageLabels[p.stage as ProjectStage]} badgeTone={p.stage === "proposed" ? "gold" : "green"} />)}</CardGrid>
        )}
        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-3xl bg-forest p-8 text-white"><p className="flex-1 text-lg">Have a project in mind, or want to partner with us?</p><ButtonLink href="/contact?kind=partnership" variant="accent">Get in touch</ButtonLink></div>
      </Container>
    </>
  );
}
