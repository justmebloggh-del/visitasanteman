import { notFound } from "next/navigation";
import { closeVacancy, setApplicationStatus } from "@/app/actions/jobs";
import { EmployerBadge } from "@/components/jobs/EmployerBadge";
import { VacancyForm } from "@/components/jobs/VacancyForm";
import { Badge, Button, Input, Select } from "@/components/ui";
import { applicationStatusLabels, EMPLOYER_SETTABLE, type ApplicationStatus } from "@/config/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { listJobAreas, listJobCategories } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Vacancy" };

export default async function ManageVacancy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data: emp } = await supabase.from("employer_profiles").select("id,verification_status").eq("owner_id", user.id).maybeSingle();
  if (!emp) notFound();
  const { data: v } = await supabase.from("job_vacancies").select("*").eq("id", id).eq("employer_id", emp.id).maybeSingle();
  if (!v) notFound();
  const [categories, areas, { data: apps }] = await Promise.all([
    listJobCategories(), listJobAreas(),
    supabase.from("job_applications").select("id,applicant_name,applicant_phone,cover_note,cv_path,status,interview_at,created_at").eq("vacancy_id", id).order("created_at", { ascending: false }),
  ]);
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-forest">{v.title}</h1><div className="mt-1 flex items-center gap-2"><Badge tone={v.status === "published" ? "green" : "gold"}>{v.is_filled ? "Filled" : v.status === "pending_review" ? "In review" : v.status === "archived" ? "Closed" : v.status}</Badge><EmployerBadge status={emp.verification_status} /></div></div>
        {v.status !== "archived" && !v.is_filled && (
          <div className="flex gap-2">
            {v.status === "published" && <form action={closeVacancy.bind(null, id, true)}><Button type="submit" variant="outline" size="sm">Mark as filled</Button></form>}
            <form action={closeVacancy.bind(null, id, false)}><Button type="submit" variant="ghost" size="sm">Close vacancy</Button></form>
          </div>
        )}
      </div>

      <section aria-labelledby="a-h">
        <h2 id="a-h" className="mb-3 text-lg font-semibold text-forest">Applications ({apps?.length ?? 0})</h2>
        {(apps ?? []).length === 0 ? <p className="rounded-2xl bg-white p-6 text-sm text-muted">No applications yet.</p> : (
          <ul className="space-y-4">
            {apps!.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{a.applicant_name}</p>
                    <p className="text-xs text-muted">Applied {new Date(a.created_at).toLocaleDateString("en-GB")}{a.applicant_phone ? ` · ${a.applicant_phone}` : ""}</p>
                  </div>
                  <Badge tone={a.status === "shortlisted" || a.status === "offered" ? "green" : a.status === "rejected" || a.status === "withdrawn" ? "neutral" : "gold"}>{applicationStatusLabels[a.status as ApplicationStatus]}</Badge>
                </div>
                {a.cover_note && <p className="mt-3 whitespace-pre-line text-sm">{a.cover_note}</p>}
                {a.cv_path && <p className="mt-3 text-sm"><a className="font-medium text-forest underline" href={`/api/cv?application=${a.id}`} rel="nofollow">Download CV</a></p>}
                {a.status !== "withdrawn" ? (
                  <form action={setApplicationStatus.bind(null, a.id, id)} className="mt-4 flex flex-wrap items-end gap-2">
                    <div><label htmlFor={`s-${a.id}`} className="mb-1 block text-xs text-muted">Status</label>
                      <Select id={`s-${a.id}`} name="status" defaultValue={EMPLOYER_SETTABLE.includes(a.status as never) ? a.status : "viewed"}>{EMPLOYER_SETTABLE.map((s) => <option key={s} value={s}>{applicationStatusLabels[s]}</option>)}</Select></div>
                    <div><label htmlFor={`i-${a.id}`} className="mb-1 block text-xs text-muted">Interview date (if interview)</label><Input id={`i-${a.id}`} name="interview_at" type="datetime-local" /></div>
                    <Button type="submit" size="sm">Update</Button>
                  </form>
                ) : <p className="mt-3 text-xs text-muted">The applicant withdrew this application.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="e-h" className="rounded-2xl border border-line bg-white p-6">
        <h2 id="e-h" className="mb-4 text-lg font-semibold text-forest">Edit vacancy</h2>
        <VacancyForm id={id} categories={categories} areas={areas} values={v} />
      </section>
    </div>
  );
}
