import type { Metadata } from "next";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/layout/blocks";
import { Button, ButtonLink } from "@/components/ui";
import { setRegistrationStatus } from "@/app/admin/actions";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Event registrations" };
const PER = 30;

export default async function Registrations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  let q = supabase.from("event_registrations").select("*, event:event_id(title,slug,capacity)", { count: "exact" }).order("created_at", { ascending: false });
  if (sp.event && /^[0-9a-f-]{36}$/.test(sp.event)) q = q.eq("event_id", sp.event);
  if (sp.status && ["registered", "attended", "cancelled"].includes(sp.status)) q = q.eq("status", sp.status);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as unknown as (Record<string, any> & { event: { title: string; slug: string; capacity: number | null } | null })[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <>
      <AdminHeader title="Event registrations" intro="Free registrations from event pages. These are not tickets or payments. Turn registration on for an event under Events." />
      <Flash sp={sp} />
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        {[["", "All"], ["registered", "Registered"], ["attended", "Attended"], ["cancelled", "Cancelled"]].map(([v, l]) => (
          <ButtonLink key={v} href={v ? `/admin/registrations?status=${v}` : "/admin/registrations"} variant={(sp.status ?? "") === v ? "primary" : "outline"} size="sm">{l}</ButtonLink>
        ))}
      </nav>
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No registrations.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-forest">{r.name} <span className="font-normal text-muted">· {r.guests} {r.guests === 1 ? "place" : "places"} · {formatDate(r.created_at, true)}</span></p>
                  <p className="text-sm"><a className="text-lake-dark underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <> · {r.phone}</>}</p>
                  <p className="text-sm text-muted">{r.event ? <a className="underline" href={`/admin/registrations?event=${r.event_id}`}>{r.event.title}</a> : "Event removed"}</p>
                  {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
                </div>
                <StatusBadge value={r.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["registered", "attended", "cancelled"].filter((s) => s !== r.status).map((s) => (
                  <form key={s} action={setRegistrationStatus.bind(null, r.id, s)}><Button size="sm" variant="outline">Mark {s}</Button></form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath="/admin/registrations" params={{ status: sp.status, event: sp.event }} />
    </>
  );
}
