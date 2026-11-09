import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, nowMs } from "@/lib/utils";

export const metadata: Metadata = { title: "Ad performance" };
const DAYS = 14;

export default async function AdPerformance() {
  await requireAdmin();
  const supabase = await createClient();
  const since = new Date(nowMs() - (DAYS - 1) * 864e5).toISOString().slice(0, 10);
  const [{ data: ads }, { data: stats }] = await Promise.all([
    supabase.from("advertisements").select("id,title,advertiser_name,placement,status,starts_at,ends_at,impressions,clicks").is("deleted_at", null).order("starts_at", { ascending: false }).limit(100),
    supabase.from("ad_stats_daily").select("ad_id,day,impressions,clicks").gte("day", since),
  ]);
  const recent = new Map<string, { i: number; c: number }>();
  for (const s of stats ?? []) { const r = recent.get(s.ad_id) ?? { i: 0, c: 0 }; r.i += Number(s.impressions); r.c += Number(s.clicks); recent.set(s.ad_id, r); }
  const now = nowMs();
  const state = (a: { status: string; starts_at: string; ends_at: string }) =>
    a.status !== "published" ? a.status.replace("_", " ") : now < Date.parse(a.starts_at) ? "scheduled" : now > Date.parse(a.ends_at) ? "ended" : "live";
  const ctr = (i: number, c: number) => (i > 0 ? `${((c / i) * 100).toFixed(1)}%` : "-");

  return (
    <>
      <AdminHeader title="Ad performance" intro={`Impressions and clicks per advertisement: all time, and the last ${DAYS} days. Paid placements are always labelled “Sponsored” and never affect verification or editorial content.`} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted">
            <tr><th scope="col" className="px-4 py-3">Ad</th><th scope="col" className="px-4 py-3">Placement</th><th scope="col" className="px-4 py-3">State</th><th scope="col" className="px-4 py-3">Dates</th><th scope="col" className="px-4 py-3 text-right">Views</th><th scope="col" className="px-4 py-3 text-right">Clicks</th><th scope="col" className="px-4 py-3 text-right">CTR</th><th scope="col" className="px-4 py-3 text-right">Last {DAYS} days</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(ads ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No advertisements yet.</td></tr>}
            {(ads ?? []).map((a) => {
              const r = recent.get(a.id) ?? { i: 0, c: 0 };
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3"><Link href={`/admin/advertisements/${a.id}`} className="font-medium text-forest hover:underline">{a.title}</Link><span className="block text-xs text-muted">{a.advertiser_name}</span></td>
                  <td className="px-4 py-3">{a.placement.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3"><Badge tone={state(a) === "live" ? "green" : "neutral"}>{state(a)}</Badge></td>
                  <td className="px-4 py-3 text-xs">{formatDate(a.starts_at)} to {formatDate(a.ends_at)}</td>
                  <td className="px-4 py-3 text-right">{Number(a.impressions).toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3 text-right">{Number(a.clicks).toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3 text-right">{ctr(Number(a.impressions), Number(a.clicks))}</td>
                  <td className="px-4 py-3 text-right">{r.i.toLocaleString("en-GB")} / {r.c.toLocaleString("en-GB")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Counts are recorded when an ad is shown or clicked, only while it is published and inside its dates. The browser cannot change them.</p>
    </>
  );
}
