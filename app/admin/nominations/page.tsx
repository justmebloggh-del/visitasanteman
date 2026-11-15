import type { Metadata } from "next";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/layout/blocks";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { setNominationStatus, setNominationWinner } from "@/app/admin/actions";
import { canApprove, requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Award nominations" };
const PER = 20;
const STATUSES = ["new", "under_review", "eligible", "shortlisted", "not_eligible", "withdrawn"];

export default async function Nominations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  let q = supabase.from("award_nominations").select("*, programme:programme_id(title)", { count: "exact" }).order("created_at", { ascending: false });
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as unknown as (Record<string, any> & { programme: { title: string } | null })[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  const approver = canApprove(user.role);

  return (
    <>
      <AdminHeader title="Award nominations" intro="Review each nomination against the published criteria. Only regional editors and administrators can shortlist nominees or name winners. Shortlisted nominees become public; nominator details never do. Sponsorship or payment must never influence a decision." />
      <Flash sp={sp} />
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        <ButtonLink href="/admin/nominations" variant={!sp.status ? "primary" : "outline"} size="sm">All</ButtonLink>
        {STATUSES.map((s) => <ButtonLink key={s} href={`/admin/nominations?status=${s}`} variant={sp.status === s ? "primary" : "outline"} size="sm">{s.replace("_", " ")}</ButtonLink>)}
      </nav>
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No nominations.</p> : (
        <ul className="space-y-4">
          {rows.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-forest">{n.nominee_name}{n.nominee_organisation ? `, ${n.nominee_organisation}` : ""} <span className="font-normal text-muted">· {n.category} · {n.programme?.title} · {formatDate(n.created_at, true)}</span></p>
                  {n.nominee_location && <p className="text-sm text-muted">{n.nominee_location}</p>}
                </div>
                <div className="flex gap-2">{n.is_winner && <Badge tone="gold">Winner</Badge>}<StatusBadge value={n.status} /></div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{n.reason}</p>
              {n.supporting_url && <p className="mt-2 text-sm"><a className="text-lake-dark underline" href={n.supporting_url} rel="noopener noreferrer nofollow" target="_blank">Supporting link</a></p>}
              <p className="mt-2 text-xs text-muted">Nominated by {n.nominator_name} (<a className="underline" href={`mailto:${n.nominator_email}`}>{n.nominator_email}</a>{n.nominator_phone ? `, ${n.nominator_phone}` : ""})</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== n.status && (s !== "shortlisted" || approver)).map((s) => (
                  <form key={s} action={setNominationStatus.bind(null, n.id, s)}><Button size="sm" variant="outline">Mark {s.replace("_", " ")}</Button></form>
                ))}
                {approver && n.status === "shortlisted" && (
                  <form action={setNominationWinner.bind(null, n.id, !n.is_winner)}><Button size="sm" variant="outline">{n.is_winner ? "Remove winner" : "Name winner"}</Button></form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath="/admin/nominations" params={{ status: sp.status }} />
    </>
  );
}
