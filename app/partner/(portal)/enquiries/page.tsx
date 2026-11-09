import type { Metadata } from "next";
import { setPartnerEnquiryStatus } from "@/app/partner/actions";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { Button, ButtonLink, Notice } from "@/components/ui";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };

export default async function PartnerEnquiries({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePartner();
  const sp = await searchParams;
  const supabase = await createClient();
  // RLS returns only enquiries about this partner's own listings.
  const { data } = await supabase.from("enquiries").select("*, listing:listing_id(name)").not("listing_id", "is", null).order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as { id: string; name: string; email: string; phone: string | null; message: string; status: string; kind: string; created_at: string; details: Record<string, unknown>; listing: { name: string } | null }[];
  return (
    <>
      <AdminHeader title="Enquiries" intro="Booking requests and questions about your listings. These are requests, not confirmed bookings. Reply directly to the visitor." />
      {sp.saved && <div className="mb-4"><Notice tone="success">Updated.</Notice></div>}
      <ul className="space-y-4">
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No enquiries yet.</li>}
        {rows.map((e) => (
          <li key={e.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-forest">{e.name} <span className="font-normal text-muted">· {e.listing?.name} · {formatDate(e.created_at, true)}</span></p><StatusBadge value={e.status} /></div>
            <p className="text-sm"><a className="text-lake-dark hover:underline" href={`mailto:${e.email}`}>{e.email}</a>{e.phone && <> · {e.phone}</>}</p>
            <p className="mt-3 whitespace-pre-line text-sm">{e.message}</p>
            {Object.keys(e.details ?? {}).length > 0 && <p className="mt-2 text-xs text-muted">{Object.entries(e.details).map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(" · ")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink size="sm" href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your enquiry")}`}>Reply by email</ButtonLink>
              {["read", "replied", "closed"].filter((s) => s !== e.status).map((s) => <form key={s} action={setPartnerEnquiryStatus.bind(null, e.id, s)}><Button size="sm" variant="outline">Mark {s}</Button></form>)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
