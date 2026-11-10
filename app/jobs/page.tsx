import type { Metadata } from "next";
import { FilterBar } from "@/components/layout/FilterBar";
import { EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { VacancyCard } from "@/components/jobs/VacancyCard";
import { ButtonLink, Container, Notice } from "@/components/ui";
import { antiFraudNotice, employmentTypes } from "@/config/jobs";
import { listJobAreas, listJobCategories, listVacancies } from "@/lib/jobs";
import { toPage } from "@/lib/content/public";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Jobs and Careers in Ashanti", description: "Vacancies from employers across the Ashanti Region. Applying is always free.", path: "/jobs",
});

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = toPage(sp.page);
  const [res, categories, areas] = await Promise.all([listVacancies({ q: sp.q, category: sp.category, type: sp.type, area: sp.area, page }), listJobCategories(), listJobAreas()]);
  const filtered = Boolean(sp.q || sp.category || sp.type || sp.area);
  return (
    <>
      <PageHeader title="Jobs and Careers" intro="Discover opportunities. Build your career. Grow Ashanti." crumbs={[{ label: "Jobs" }]} />
      <Container className="space-y-6 py-10">
        <FilterBar action="/jobs" q={sp.q} qLabel="Job title or keyword" values={{ category: sp.category, type: sp.type, area: sp.area }} filters={[
          { name: "category", label: "Field", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
          { name: "type", label: "Type", options: Object.entries(employmentTypes).map(([value, label]) => ({ value, label })) },
          { name: "area", label: "District", options: areas.map((a) => ({ value: a.slug, label: a.name })) },
        ]} />
        <Notice tone="info">{antiFraudNotice}</Notice>
        {res.items.length === 0 ? (
          <EmptyState title={filtered ? "No vacancies match your search" : "No vacancies are published yet"} text={filtered ? "Try fewer filters." : "Employers can register and post a vacancy; each one is reviewed before it appears."} action={{ href: "/employer", label: "Post a vacancy" }} />
        ) : (
          <>
            <p className="text-sm text-muted">{res.total} {res.total === 1 ? "vacancy" : "vacancies"}</p>
            <ul className="grid gap-4">{res.items.map((v) => <div key={v.id} className="relative"><VacancyCard v={v} /></div>)}</ul>
            <Pagination page={res.page} pageCount={res.pageCount} basePath="/jobs" params={{ q: sp.q, category: sp.category, type: sp.type, area: sp.area }} />
          </>
        )}
        <div className="flex flex-wrap gap-3 border-t border-line pt-6">
          <ButtonLink href="/employer" variant="outline">Employers: post a vacancy</ButtonLink>
          <ButtonLink href="/account/applications" variant="ghost">My applications</ButtonLink>
        </div>
      </Container>
    </>
  );
}
