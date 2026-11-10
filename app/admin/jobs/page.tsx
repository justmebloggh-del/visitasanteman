import type { Metadata } from "next";
import Link from "next/link";
import { decideEmployer, moderateVacancy, resolveReport } from "@/app/admin/jobs-actions";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { EmployerBadge } from "@/components/jobs/EmployerBadge";
import { Badge, Button } from "@/components/ui";
import { employmentTypes, reportReasons, type EmploymentType, type ReportReason } from "@/config/jobs";
import { requireStaff, canApprove, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs moderation" };
const TABS = [["vacancies", "Vacancies in review"], ["employers", "Employers"], ["reports", "Reports"]] as const;
const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);

export default async function JobsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "vacancies";
  const supabase = await createClient();
  const approver = canApprove(user.role), admin = isAdmin(user.role);

  const [vac, emp, rep] = await Promise.all([
    tab === "vacancies" ? supabase.from("job_vacancies").select("id,title,slug,status,employment_type,description,administrative_area_id,created_at,employer:employer_profiles!employer_id(name,verification_status)").in("status", ["pending_review", "approved"]).is("deleted_at", null).order("created_at").limit(100) : null,
    tab === "employers" ? supabase.from("employer_profiles").select("id,name,slug,verification_status,verification_requested_at,created_at").is("deleted_at", null).order("verification_requested_at", { ascending: true, nullsFirst: false }).limit(200) : null,
    tab === "reports" ? supabase.from("job_reports").select("id,reason,details,status,created_at,vacancy:job_vacancies(id,title,slug,employer:employer_profiles!employer_id(name))").order("created_at", { ascending: false }).limit(100) : null,
  ]);

  return (
    <>
      <AdminHeader title="Jobs moderation" intro="Check vacancies before they are published, verify employers, and act on reports. Applications and CVs are private and are not shown here." />
      <Flash sp={sp} />
      <nav aria-label="Jobs sections" className="mb-5 flex flex-wrap gap-2 text-sm">
        {TABS.map(([t, l]) => <Link key={t} href={`/admin/jobs?tab=${t}`} aria-current={tab === t ? "page" : undefined} className={`rounded-full px-4 py-2 ${tab === t ? "bg-forest text-white" : "border border-line hover:bg-forest-soft"}`}>{l}</Link>)}
      </nav>

      {tab === "vacancies" && ((vac?.data ?? []).length === 0 ? <Empty /> : (
        <ul className="space-y-4">
          {vac!.data!.map((v) => { const e = one(v.employer as unknown as { name: string; verification_status: string } | null);
            return (
            <li key={v.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg font-semibold text-forest">{v.title}</p>
                  <p className="mt-1 text-sm text-muted">{e?.name} · {employmentTypes[v.employment_type as EmploymentType]} · submitted {formatDate(v.created_at)}</p>
                  {!v.administrative_area_id && <p className="mt-1 text-sm text-red-700">No district set: it cannot be published until the employer or an editor adds one.</p>}
                </div>
                <div className="flex gap-2">{e && <EmployerBadge status={e.verification_status} />}<Badge tone="gold">{v.status === "approved" ? "Approved" : "In review"}</Badge></div>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm">{v.description}</p>
              {approver && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={moderateVacancy.bind(null, v.id, "publish")}><Button size="sm">Publish (30 days)</Button></form>
                  <form action={moderateVacancy.bind(null, v.id, "return")}><Button size="sm" variant="outline">Send back to draft</Button></form>
                  <form action={moderateVacancy.bind(null, v.id, "archive")}><Button size="sm" variant="ghost">Reject and close</Button></form>
                </div>
              )}
            </li>); })}
        </ul>
      ))}

      {tab === "employers" && ((emp?.data ?? []).length === 0 ? <Empty /> : (
        <ul className="space-y-3">
          {emp!.data!.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <div><p className="font-medium text-forest">{e.name}</p><p className="text-xs text-muted">Joined {formatDate(e.created_at)}{e.verification_requested_at ? ` · verification requested ${formatDate(e.verification_requested_at)}` : ""}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <EmployerBadge status={e.verification_status} />
                {admin && e.verification_status !== "verified" && <form action={decideEmployer.bind(null, e.id, "verified")}><Button size="sm">Verify</Button></form>}
                {admin && e.verification_status !== "suspended" && <form action={decideEmployer.bind(null, e.id, "suspended")}><Button size="sm" variant="danger">Suspend</Button></form>}
                {admin && e.verification_status !== "unverified" && <form action={decideEmployer.bind(null, e.id, "unverified")}><Button size="sm" variant="ghost">Reset</Button></form>}
              </div>
            </li>
          ))}
        </ul>
      ))}

      {tab === "reports" && ((rep?.data ?? []).length === 0 ? <Empty /> : (
        <ul className="space-y-3">
          {rep!.data!.map((r) => { const v = one(r.vacancy as unknown as { id: string; title: string; slug: string; employer: { name: string } | { name: string }[] | null } | null); const e = v ? one(v.employer) : null;
            return (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{v ? <Link href={`/jobs/${v.slug}`} className="text-forest hover:underline">{v.title}</Link> : "Vacancy removed"}{e ? <span className="text-muted"> · {e.name}</span> : null}</p>
                <Badge tone={r.status === "open" ? "gold" : "neutral"}>{r.status}</Badge>
              </div>
              <p className="mt-1 text-sm">{reportReasons[r.reason as ReportReason]}{r.details ? `: ${r.details}` : ""}</p>
              <p className="text-xs text-muted">Reported {formatDate(r.created_at)}</p>
              {admin && r.status === "open" && (
                <div className="mt-3 flex gap-2">
                  <form action={resolveReport.bind(null, r.id, "actioned")}><Button size="sm">Mark actioned</Button></form>
                  <form action={resolveReport.bind(null, r.id, "dismissed")}><Button size="sm" variant="outline">Dismiss</Button></form>
                </div>
              )}
            </li>); })}
        </ul>
      ))}
    </>
  );
}

function Empty() { return <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">Nothing here.</p>; }
