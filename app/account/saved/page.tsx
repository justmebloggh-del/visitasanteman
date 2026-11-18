import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toggleSavedJob } from "@/app/actions/jobs";
import { Button, ButtonLink } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Saved jobs", robots: { index: false } };
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);

export default async function SavedJobs() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/saved");
  const { data } = await (await createClient()).from("saved_jobs").select("vacancy:job_vacancies(id,title,slug)").eq("user_id", user.id).order("created_at", { ascending: false });
  type V = { id: string; title: string; slug: string };
  const jobs = ((data ?? []) as unknown as { vacancy: V | V[] | null }[]).map((s) => one(s.vacancy)).filter((v): v is V => !!v);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl font-semibold text-forest">Saved jobs</h2><ButtonLink href="/jobs" variant="accent">Browse jobs</ButtonLink></div>
      {jobs.length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">No saved jobs. Use the save button on a vacancy to keep it here.</p> : (
        <ul className="space-y-3">
          {jobs.map((v) => (
            <li key={v.id} className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <Link className="font-medium text-forest hover:underline" href={`/jobs/${v.slug}`}>{v.title}</Link>
              <form action={toggleSavedJob.bind(null, v.id, v.slug)}><Button type="submit" size="sm" variant="ghost">Remove</Button></form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
