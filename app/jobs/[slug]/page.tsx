import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleSavedJob } from "@/app/actions/jobs";
import { ApplyForm } from "@/components/jobs/ApplyForm";
import { EmployerBadge } from "@/components/jobs/EmployerBadge";
import { ReportForm } from "@/components/jobs/ReportForm";
import { PageHeader, TextBlock, Facts } from "@/components/layout/blocks";
import { JsonLd, breadcrumbLd, buildMetadata } from "@/components/layout/seo";
import { Button, ButtonLink, Container, Notice } from "@/components/ui";
import { antiFraudNotice, employmentTypes, type EmploymentType } from "@/config/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { getVacancy, salaryText } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";    // shows the visitor's own application/saved state

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await getVacancy((await params).slug);
  if (!v) return { title: "Vacancy not found", robots: { index: false } };
  return buildMetadata({ title: `${v.title} at ${v.employer?.name ?? "an Asanteman employer"}`, description: v.description, path: `/jobs/${v.slug}` });
}

const JOB_TYPE: Record<string, string> = { full_time: "FULL_TIME", part_time: "PART_TIME", contract: "CONTRACTOR", temporary: "TEMPORARY", internship: "INTERN", apprenticeship: "OTHER", national_service: "OTHER", graduate_trainee: "OTHER", remote: "OTHER", hybrid: "OTHER" };

export default async function VacancyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await getVacancy(slug);
  if (!v) notFound();
  const user = await getSessionUser();
  let applied = false, saved = false;
  if (user) {
    const supabase = await createClient();
    const [a, s] = await Promise.all([
      supabase.from("job_applications").select("id").eq("vacancy_id", v.id).eq("applicant_id", user.id).maybeSingle(),
      supabase.from("saved_jobs").select("vacancy_id").eq("vacancy_id", v.id).eq("user_id", user.id).maybeSingle(),
    ]);
    applied = !!a.data; saved = !!s.data;
  }
  const pay = salaryText(v);
  const next = encodeURIComponent(`/jobs/${v.slug}`);
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "JobPosting", title: v.title, description: v.description,
    datePosted: v.published_at, validThrough: v.application_deadline ?? v.expires_at ?? undefined,
    employmentType: JOB_TYPE[v.employment_type], hiringOrganization: { "@type": "Organization", name: v.employer?.name, sameAs: v.employer?.website ?? undefined },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: v.area?.name ?? v.location_note ?? "Ashanti Region", addressRegion: "Ashanti", addressCountry: "GH" } },
    ...(v.salary_min != null || v.salary_max != null ? { baseSalary: { "@type": "MonetaryAmount", currency: v.salary_currency, value: { "@type": "QuantitativeValue", minValue: v.salary_min ?? undefined, maxValue: v.salary_max ?? undefined, unitText: (v.salary_period ?? "").toUpperCase() || undefined } } } : {}),
  };
  return (
    <>
      <JsonLd data={ld} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Jobs", path: "/jobs" }, { name: v.title, path: `/jobs/${v.slug}` }])} />
      <PageHeader title={v.title} intro={v.employer?.name} crumbs={[{ label: "Jobs", href: "/jobs" }, { label: v.title }]} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <article className="space-y-6">
          {v.employer && <div className="flex items-center gap-3"><EmployerBadge status={v.employer.verification_status} />{v.employer.verification_status !== "verified" && <span className="text-xs text-muted">We have not independently verified this employer.</span>}</div>}
          <Facts items={[
            { label: "Type", value: employmentTypes[v.employment_type as EmploymentType] ?? v.employment_type },
            { label: "Location", value: [v.location_note, v.area?.name].filter(Boolean).join(", ") || undefined },
            { label: "Field", value: v.category?.name }, { label: "Pay", value: pay ?? undefined },
            { label: "Experience", value: v.experience_required ?? undefined },
            { label: "Apply by", value: v.application_deadline ? new Date(v.application_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : undefined },
          ]} />
          <TextBlock title="About the role" text={v.description} />
          <TextBlock title="Requirements" text={v.requirements} />
          <TextBlock title="Qualifications" text={v.qualifications} />
          <Notice tone="info">{antiFraudNotice}</Notice>
        </article>
        <aside className="space-y-8">
          <section aria-labelledby="apply-h" className="rounded-2xl border border-line bg-white p-5">
            <h2 id="apply-h" className="text-lg font-semibold text-forest">Apply for this job</h2>
            <div className="mt-4">
              {!user ? <p className="text-sm text-muted"><Link className="font-medium text-forest underline" href={`/login?next=${next}`}>Log in</Link> or <Link className="font-medium text-forest underline" href="/register">create a free account</Link> to apply. Applying is always free.</p>
                : applied ? <Notice tone="success">You have applied. Follow progress under <Link className="underline" href="/account/applications">My applications</Link>.</Notice>
                : <ApplyForm vacancyId={v.id} />}
            </div>
            {user && <form action={toggleSavedJob.bind(null, v.id, v.slug)} className="mt-4"><Button type="submit" variant="ghost" size="sm">{saved ? "Remove from saved jobs" : "Save this job"}</Button></form>}
          </section>
          <section aria-labelledby="report-h" className="rounded-2xl border border-line p-5">
            <h2 id="report-h" className="text-base font-semibold text-forest">Report this vacancy</h2>
            <p className="mb-3 mt-1 text-sm text-muted">Tell us if it asks for money, looks fake or is misleading.</p>
            {user ? <ReportForm vacancyId={v.id} /> : <ButtonLink href={`/login?next=${next}`} variant="outline" size="sm">Log in to report</ButtonLink>}
          </section>
        </aside>
      </Container>
    </>
  );
}
