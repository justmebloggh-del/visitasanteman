import type { Metadata } from "next";
import Link from "next/link";
import { assignPlan, endOverduePlans, setPlanEnd } from "@/app/admin/actions";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { Badge, Button, Input, Notice, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, nowMs } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function Subscriptions({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: subs }, { data: plans }, { data: listings }] = await Promise.all([
    supabase.from("business_subscriptions").select("id,listing_id,status,starts_at,ends_at,ended_at,plan:subscription_plans(name),listing:listings(name,slug,type,status)").order("starts_at", { ascending: false }).limit(200),
    supabase.from("subscription_plans").select("id,name").order("sort_order"),
    supabase.from("listings").select("id,name").is("deleted_at", null).order("name").limit(500),
  ]);
  type Row = { id: string; listing_id: string; status: string; starts_at: string; ends_at: string | null; ended_at: string | null; plan: { name: string } | null; listing: { name: string; type: string; status: string } | null };
  const rows = (subs ?? []) as unknown as Row[];
  const active = rows.filter((r) => r.status === "active");
  const overdue = active.filter((r) => r.ends_at && Date.parse(r.ends_at) <= nowMs()).length;

  return (
    <>
      <AdminHeader title="Subscriptions" intro="Plans are arranged with each business and assigned here. There is no online purchase. Assigning a plan never verifies a business." />
      <Flash sp={sp} />
      {sp.ended && <div className="mb-4"><Notice tone="success">{sp.ended} overdue plan(s) ended.</Notice></div>}
      <section className="mb-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-forest">Assign a plan</h2>
        <form action={assignPlan} className="mt-3 grid gap-3 sm:grid-cols-4">
          <div><label htmlFor="as-listing" className="mb-1.5 block text-xs font-medium text-muted">Business listing</label><Select id="as-listing" name="listing_id" required defaultValue="">{[<option key="" value="">Choose…</option>, ...(listings ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)]}</Select></div>
          <div><label htmlFor="as-plan" className="mb-1.5 block text-xs font-medium text-muted">Plan</label><Select id="as-plan" name="plan_id" required defaultValue="">{[<option key="" value="">Choose…</option>, ...(plans ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)]}</Select></div>
          <div><label htmlFor="as-end" className="mb-1.5 block text-xs font-medium text-muted">Ends on (optional)</label><Input id="as-end" name="ends" type="date" /></div>
          <div className="flex items-end"><Button>Assign</Button></div>
        </form>
      </section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-forest">{active.length} active</h2>
        <form action={endOverduePlans}><Button size="sm" variant="outline" disabled={overdue === 0}>End overdue plans ({overdue})</Button></form>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Business</th><th scope="col" className="px-4 py-3">Plan</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Started</th><th scope="col" className="px-4 py-3">Ends</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No subscriptions yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.listing?.name ?? "(removed)"}</td>
                <td className="px-4 py-3">{r.plan?.name}</td>
                <td className="px-4 py-3"><Badge tone={r.status === "active" ? "green" : "neutral"}>{r.status}</Badge></td>
                <td className="px-4 py-3">{formatDate(r.starts_at)}</td>
                <td className="px-4 py-3">
                  {r.status === "active" ? (
                    <form action={setPlanEnd.bind(null, r.listing_id)} className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`end-${r.id}`}>End date for {r.listing?.name}</label>
                      <Input id={`end-${r.id}`} name="ends" type="date" defaultValue={r.ends_at?.slice(0, 10) ?? ""} className="h-9 w-40" />
                      <Button size="sm" variant="outline">Save</Button>
                    </form>
                  ) : (r.ended_at ? `Ended ${formatDate(r.ended_at)}` : "-")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">A plan lapses when an administrator runs “End overdue plans”. Automatic expiry needs a scheduler, which is not set up. <Link href="/admin/businesses" className="underline">Business listings</Link> show the current plan.</p>
    </>
  );
}
