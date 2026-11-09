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
    supabase.from("listing_views").select("views").gte("day", since),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
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
    </>
  );
}
