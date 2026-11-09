import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics" };

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

export default async function Analytics() {
  await requireStaff();
  const supabase = await createClient();
  const since = daysAgo(30);
  const head = (t: string, col: string) => supabase.from(t).select("*", { count: "exact", head: true }).gte(col, since);
  const [enq, subs, users, byKind] = await Promise.all([
    head("enquiries", "created_at"), head("newsletter_subscribers", "subscribed_at"), head("profiles", "created_at"),
    supabase.from("enquiries").select("kind").gte("created_at", since),
  ]);
  const kinds = (byKind.data ?? []).reduce<Record<string, number>>((a, r) => { a[r.kind] = (a[r.kind] ?? 0) + 1; return a; }, {});
  const ga = !!process.env.NEXT_PUBLIC_GA_ID;
  return (
    <>
      <AdminHeader title="Analytics" intro="Activity recorded by the platform over the last 30 days." />
      <ul className="grid gap-3 sm:grid-cols-3">
        {[["Enquiries", enq.count], ["Newsletter sign-ups", subs.count], ["New accounts", users.count]].map(([l, v]) => (
          <li key={String(l)} className="rounded-2xl border border-line bg-white p-5"><p className="text-3xl font-semibold text-forest">{v ?? 0}</p><p className="text-sm text-muted">{l}</p></li>
        ))}
      </ul>
      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Enquiries by type</h2>
        {Object.keys(kinds).length === 0 ? <p className="text-sm text-muted">No enquiries in this period.</p> : (
          <ul className="space-y-2 text-sm">{Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k} className="flex justify-between"><span className="capitalize">{k.replace("_", " ")}</span><strong>{n}</strong></li>)}</ul>
        )}
      </section>
      <div className="mt-6">
        <Notice tone={ga ? "success" : "info"}>{ga ? "Google Analytics is collecting website traffic. View visits, sources and pages in your Google Analytics account." : "Website traffic is not being collected yet. Set NEXT_PUBLIC_GA_ID (a G-XXXXXXXX measurement ID) in the environment variables to enable Google Analytics."}</Notice>
      </div>
    </>
  );
}
