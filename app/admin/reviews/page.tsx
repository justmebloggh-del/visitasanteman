import type { Metadata } from "next";
import { moderateReview } from "@/app/actions/booking-manage";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { Button, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff();
  const sp = await searchParams;
  const { data } = await (await createClient()).from("reviews").select("*, listing:listing_id(name), experience:experience_id(title)").order("status", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as { id: string; author_name: string; rating: number; comment: string | null; status: string; owner_reply: string | null; created_at: string; listing: { name: string } | null; experience: { title: string } | null }[];
  return (
    <>
      <AdminHeader title="Reviews" intro="Every review comes from a completed booking. Approve genuine ones; reject abusive or off-topic ones." />
      {sp.saved && <div className="mb-4"><Notice tone="success">Saved.</Notice></div>}
      <ul className="space-y-4">
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">No reviews yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-forest">{r.rating}/5 · {r.author_name} <span className="font-normal text-muted">· {r.listing?.name ?? r.experience?.title} · {formatDate(r.created_at)}</span></p><StatusBadge value={r.status === "pending" ? "pending_review" : r.status === "rejected" ? "archived" : r.status} /></div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            <div className="mt-3 flex gap-2">
              {r.status !== "published" && <form action={moderateReview.bind(null, r.id, "published", "/admin/reviews")}><Button size="sm">Approve</Button></form>}
              {r.status !== "rejected" && <form action={moderateReview.bind(null, r.id, "rejected", "/admin/reviews")}><Button size="sm" variant="danger">Reject</Button></form>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
