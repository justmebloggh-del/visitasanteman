import type { Metadata } from "next";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/layout/blocks";
import { Button, ButtonLink } from "@/components/ui";
import { deleteEnquiry, setEnquiryStatus } from "@/app/admin/actions";
import { isAdmin, requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };
const PER = 20;

export default async function Enquiries({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  let q = supabase.from("enquiries").select("*, listing:listing_id(name), experience:experience_id(title), investment:investment_id(title)", { count: "exact" }).order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.kind && /^[a-z_]+$/.test(sp.kind)) q = q.eq("kind", sp.kind);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as unknown as (Record<string, any> & { listing: { name: string } | null; experience: { title: string } | null; investment: { title: string } | null })[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <>
      <AdminHeader title="Enquiries" intro="Contact, booking-request and partnership messages from the website. These are requests, not confirmed bookings." />
      <Flash sp={sp} />
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        {[["", "All"], ["new", "New"], ["read", "Read"], ["replied", "Replied"], ["closed", "Closed"]].map(([v, l]) => (
          <ButtonLink key={v} href={v ? `/admin/enquiries?status=${v}` : "/admin/enquiries"} variant={(sp.status ?? "") === v ? "primary" : "outline"} size="sm">{l}</ButtonLink>
        ))}
      </nav>
      <nav className="mb-5 flex flex-wrap gap-2 text-sm" aria-label="Filter by type">
        {[["", "All types"], ["investment", "Investor"], ["partnership", "Partnership"], ["business_listing", "Business listing"], ["general", "General"]].map(([v, l]) => (
          <ButtonLink key={v} href={`/admin/enquiries?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(v ? { kind: v } : {}) }).toString()}`} variant={(sp.kind ?? "") === v ? "primary" : "outline"} size="sm">{l}</ButtonLink>
        ))}
      </nav>
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No enquiries.</p> : (
        <ul className="space-y-4">
          {rows.map((e) => (
            <li key={e.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-forest">{e.name} <span className="font-normal text-muted">· {String(e.kind).replace("_", " ")} · {formatDate(e.created_at, true)}</span></p>
                  <p className="text-sm"><a className="text-lake-dark underline underline-offset-2 hover:no-underline" href={`mailto:${e.email}`}>{e.email}</a>{e.phone && <> · {e.phone}</>}</p>
                  {(e.listing || e.experience || e.investment) && <p className="text-sm text-muted">About: {e.listing?.name ?? e.experience?.title ?? e.investment?.title}</p>}
                </div>
                <StatusBadge value={e.status} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{e.message}</p>
              {Object.keys(e.details ?? {}).length > 0 && <p className="mt-2 text-xs text-muted">{Object.entries(e.details).map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(" · ")}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your enquiry to VisitAsanteman")}`} size="sm">Reply by email</ButtonLink>
                {["read", "replied", "closed"].filter((s) => s !== e.status).map((s) => <form key={s} action={setEnquiryStatus.bind(null, e.id, s)}><Button size="sm" variant="outline">Mark {s}</Button></form>)}
                {isAdmin(user.role) && <form action={deleteEnquiry.bind(null, e.id)}><Button size="sm" variant="danger">Delete</Button></form>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath="/admin/enquiries" params={{ status: sp.status, kind: sp.kind }} />
    </>
  );
}
