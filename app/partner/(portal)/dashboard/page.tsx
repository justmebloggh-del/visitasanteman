import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { Notice } from "@/components/ui";
import { accountTypeLabels } from "@/config/site";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function PartnerDashboard() {
  const user = await requirePartner();
  const supabase = await createClient();
  const since = new Date(new Date().getTime() - 30 * 864e5).toISOString().slice(0, 10);
  const [{ data: listings }, { data: views }, { count: newEnq }, { count: pendingBookings }] = await Promise.all([
    supabase.from("listings").select("id,status,name").eq("owner_id", user.id).is("deleted_at", null),
    supabase.from("listing_views").select("listing_id,views").gte("day", since),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  // Per-listing performance over the last 30 days: what visitors did, not just how many looked.
  const sinceTs = `${since}T00:00:00Z`;
  const [{ data: enqRows }, { data: bookRows }] = await Promise.all([
    supabase.from("enquiries").select("listing_id").not("listing_id", "is", null).gte("created_at", sinceTs).limit(5000),
    supabase.from("bookings").select("listing_id").not("listing_id", "is", null).gte("created_at", sinceTs).limit(5000),
  ]);
  const tally = (rows: { listing_id: string | null; views?: number }[] | null) => { const m = new Map<string, number>(); for (const r of rows ?? []) if (r.listing_id) m.set(r.listing_id, (m.get(r.listing_id) ?? 0) + (r.views ?? 1)); return m; };
  const viewBy = tally(views as unknown as { listing_id: string | null; views: number }[]);
  const enqBy = tally(enqRows), bookBy = tally(bookRows);
  const by = (s: string) => (listings ?? []).filter((l) => l.status === s).length;
  const total = (views ?? []).reduce((a, v) => a + v.views, 0);
  const stats = [["Published", by("published")], ["Awaiting review", by("pending_review")], ["Drafts", by("draft")], ["Page views (30 days)", total], ["New enquiries", newEnq ?? 0], ["Bookings to confirm", pendingBookings ?? 0]] as const;
  return (
    <>
      <AdminHeader title="Dashboard" intro={user.accountType ? accountTypeLabels[user.accountType] : undefined} />
      {(listings ?? []).length === 0 && <div className="mb-5"><Notice tone="info">You have no listings yet. <Link href="/partner/listings/new" className="font-medium underline">Add your first listing</Link>. Our team reviews it before it goes live.</Notice></div>}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([l, v]) => <li key={l} className="rounded-2xl border border-line bg-white p-5"><p className="text-3xl font-semibold text-forest">{v}</p><p className="mt-1 text-sm text-muted">{l}</p></li>)}
      </ul>
      {(listings ?? []).length > 0 && (
        <section className="mt-8" aria-label="Listing performance">
          <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Performance, last 30 days</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Listing</th><th scope="col" className="px-4 py-3 text-right">Page views</th><th scope="col" className="px-4 py-3 text-right">Enquiries</th><th scope="col" className="px-4 py-3 text-right">Booking requests</th></tr></thead>
              <tbody className="divide-y divide-line">
                {(listings ?? []).map((l) => (
                  <tr key={l.id}><td className="px-4 py-3 font-medium">{l.name}</td><td className="px-4 py-3 text-right">{viewBy.get(l.id) ?? 0}</td><td className="px-4 py-3 text-right">{enqBy.get(l.id) ?? 0}</td><td className="px-4 py-3 text-right">{bookBy.get(l.id) ?? 0}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Counts are of visitors who viewed your page, sent an enquiry or asked to book. They are not confirmed sales.</p>
        </section>
      )}
    </>
  );
}
