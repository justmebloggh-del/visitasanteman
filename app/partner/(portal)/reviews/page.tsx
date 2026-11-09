import type { Metadata } from "next";
import { replyToReview } from "@/app/actions/booking-manage";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { Button, Field, Input, Notice } from "@/components/ui";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

export default async function PartnerReviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePartner();
  const sp = await searchParams;
  const { data } = await (await createClient()).from("reviews").select("*, listing:listing_id(name), experience:experience_id(title)").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as { id: string; author_name: string; rating: number; comment: string | null; status: string; owner_reply: string | null; created_at: string; listing: { name: string } | null; experience: { title: string } | null }[];
  return (
    <>
      <AdminHeader title="Reviews" intro="Reviews come only from guests with a completed booking. Our team checks them before they appear publicly. You can reply publicly." />
      {sp.saved && <div className="mb-4"><Notice tone="success">Saved.</Notice></div>}
      <ul className="space-y-4">
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No reviews yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-forest">{r.rating}/5 · {r.author_name} <span className="font-normal text-muted">· {r.listing?.name ?? r.experience?.title} · {formatDate(r.created_at)}</span></p><StatusBadge value={r.status === "pending" ? "pending_review" : r.status} /></div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            <form action={replyToReview.bind(null, r.id, "/partner/reviews")} className="mt-3 flex flex-wrap items-end gap-2">
              <Field label="Your public reply" htmlFor={`reply-${r.id}`} className="min-w-64 flex-1"><Input id={`reply-${r.id}`} name="reply" defaultValue={r.owner_reply ?? ""} maxLength={1000} /></Field>
              <Button size="sm" variant="outline">Save reply</Button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
