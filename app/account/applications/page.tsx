import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteApplication, withdrawApplication } from "@/app/actions/jobs";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { applicationStatusLabels, type ApplicationStatus } from "@/config/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My applications", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyApplications() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/applications");
  const supabase = await createClient();
  const { data: apps } = await supabase.from("job_applications").select("id,status,interview_at,created_at,cv_path,vacancy:job_vacancies(title,slug)").eq("applicant_id", user.id).order("created_at", { ascending: false });
  type V = { title: string; slug: string } | null;
  const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
  return (
    <>
      <div className="max-w-3xl space-y-5">
        <section aria-labelledby="ap-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="ap-h" className="font-serif text-2xl font-semibold text-forest">My applications</h2><ButtonLink href="/jobs" variant="accent">Browse jobs</ButtonLink></div>
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
      </div>
    </>
  );
}
