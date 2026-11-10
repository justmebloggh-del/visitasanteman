import Link from "next/link";
import { requestEmployerVerification } from "@/app/actions/jobs";
import { EmployerBadge } from "@/components/jobs/EmployerBadge";
import { EmployerForm } from "@/components/jobs/EmployerForm";
import { Badge, Button, ButtonLink, Notice } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { listJobAreas } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export default async function EmployerHome() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const [{ data: emp }, areas] = await Promise.all([supabase.from("employer_profiles").select("*").eq("owner_id", user.id).maybeSingle(), listJobAreas()]);

  if (!emp) {
    return (
      <div className="max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold text-forest">Post jobs on VisitAsanteman</h1>
        <p className="text-muted">Create an employer profile to advertise vacancies across the Ashanti Region. Basic postings are free; every vacancy is checked before it is published. You must verify your email address first.</p>
        <div className="rounded-2xl border border-line bg-white p-6"><EmployerForm areas={areas} /></div>
      </div>
    );
  }
  const [{ data: vacancies }, { data: counts }] = await Promise.all([
    supabase.from("job_vacancies").select("id,title,slug,status,is_filled,expires_at,published_at").eq("employer_id", emp.id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("job_applications").select("vacancy_id"),
  ]);
  const perVacancy = new Map<string, number>();
  (counts ?? []).forEach((c) => perVacancy.set(c.vacancy_id, (perVacancy.get(c.vacancy_id) ?? 0) + 1));
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-forest">{emp.name}</h1><div className="mt-1"><EmployerBadge status={emp.verification_status} /></div></div>
        {emp.verification_status !== "suspended" && <ButtonLink href="/employer/vacancies/new">Post a vacancy</ButtonLink>}
      </div>
      {emp.verification_status === "suspended" && <Notice tone="error">This employer account is suspended. Your vacancies are hidden. Contact us if you think this is a mistake.</Notice>}
      {emp.verification_status === "unverified" && (
        <Notice tone="info">
          <form action={requestEmployerVerification} className="flex flex-wrap items-center gap-3">
            <span>Your organisation is not yet verified. Vacancies are still reviewed, but job seekers see an &quot;Unverified employer&quot; label.</span>
            <Button type="submit" size="sm" variant="outline">Request verification</Button>
          </form>
        </Notice>
      )}
      {emp.verification_status === "pending" && <Notice tone="info">Verification requested. An administrator will contact you to confirm your organisation.</Notice>}

      <section aria-labelledby="v-h">
        <h2 id="v-h" className="mb-3 text-lg font-semibold text-forest">Your vacancies</h2>
        {(vacancies ?? []).length === 0 ? <p className="rounded-2xl bg-white p-6 text-sm text-muted">No vacancies yet.</p> : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {vacancies!.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/employer/vacancies/${v.id}`} className="font-medium text-forest hover:underline">{v.title}</Link>
                  <p className="text-xs text-muted">{perVacancy.get(v.id) ?? 0} application(s)</p>
                </div>
                <Badge tone={v.status === "published" ? "green" : v.status === "pending_review" ? "gold" : "neutral"}>{v.is_filled ? "Filled" : v.status === "pending_review" ? "In review" : v.status === "archived" ? "Closed" : v.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="p-h" className="rounded-2xl border border-line bg-white p-6">
        <h2 id="p-h" className="mb-4 text-lg font-semibold text-forest">Organisation profile</h2>
        <EmployerForm areas={areas} values={emp} />
      </section>
    </div>
  );
}
