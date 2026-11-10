import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteApplication, toggleSavedJob, withdrawApplication } from "@/app/actions/jobs";
import { PageHeader } from "@/components/layout/blocks";
import { Badge, Button, Container } from "@/components/ui";
import { applicationStatusLabels, type ApplicationStatus } from "@/config/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My applications", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyApplications() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/applications");
  const supabase = await createClient();
  const [{ data: apps }, { data: saved }] = await Promise.all([
    supabase.from("job_applications").select("id,status,interview_at,created_at,cv_path,vacancy:job_vacancies(title,slug)").eq("applicant_id", user.id).order("created_at", { ascending: false }),
    supabase.from("saved_jobs").select("vacancy:job_vacancies(id,title,slug)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  type V = { title: string; slug: string } | null;
  const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
  return (
    <>
      <PageHeader title="My applications" crumbs={[{ label: "Jobs", href: "/jobs" }, { label: "My applications" }]} />
      <Container className="max-w-3xl space-y-10 py-10">
        <section aria-labelledby="ap-h">
          <h2 id="ap-h" className="mb-3 text-lg font-semibold text-forest">Applications</h2>
          {(apps ?? []).length === 0 ? <p className="rounded-2xl bg-mist p-8 text-center text-muted">You have not applied for any jobs yet. <Link className="font-medium text-forest underline" href="/jobs">Browse vacancies</Link>.</p> : (
            <ul className="space-y-3">
              {apps!.map((a) => {
                const v = one(a.vacancy as unknown as V | V[]);
                return (
                  <li key={a.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{v ? <Link className="text-forest hover:underline" href={`/jobs/${v.slug}`}>{v.title}</Link> : "Vacancy no longer available"}</p>
                      <Badge tone={a.status === "shortlisted" || a.status === "offered" || a.status === "interview" ? "green" : "neutral"}>{applicationStatusLabels[a.status as ApplicationStatus]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">Applied {new Date(a.created_at).toLocaleDateString("en-GB")}{a.status === "interview" && a.interview_at ? ` · Interview ${new Date(a.interview_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}</p>
                    <div className="mt-3 flex gap-2">
                      {!["withdrawn", "rejected", "offered"].includes(a.status) && <form action={withdrawApplication.bind(null, a.id)}><Button type="submit" size="sm" variant="outline">Withdraw</Button></form>}
                      <form action={deleteApplication.bind(null, a.id)}><Button type="submit" size="sm" variant="ghost">Delete my application and CV</Button></form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="sv-h">
          <h2 id="sv-h" className="mb-3 text-lg font-semibold text-forest">Saved jobs</h2>
          {(saved ?? []).length === 0 ? <p className="text-sm text-muted">No saved jobs.</p> : (
            <ul className="space-y-2">
              {saved!.map((s) => {
                const v = one(s.vacancy as unknown as { id: string; title: string; slug: string } | { id: string; title: string; slug: string }[]);
                return v ? <li key={v.id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-2"><Link className="text-forest hover:underline" href={`/jobs/${v.slug}`}>{v.title}</Link><form action={toggleSavedJob.bind(null, v.id, v.slug)}><Button type="submit" size="sm" variant="ghost">Remove</Button></form></li> : null;
              })}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}
