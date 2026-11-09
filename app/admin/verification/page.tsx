import type { Metadata } from "next";
import Link from "next/link";
import { decideVerification } from "@/app/admin/actions";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { Badge, Button, Input, Notice } from "@/components/ui";
import { listingTypeLabels, listingSection, type ListingType } from "@/config/site";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Business verification" };
const TABS = [["pending", "Requested"], ["verified", "Verified"], ["rejected", "Rejected"], ["suspended", "Suspended"]] as const;
const adminKey: Record<string, string> = { accommodation: "accommodation", restaurants: "restaurants", venues: "venues", markets: "markets", business: "businesses" };

export default async function VerificationQueue({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "pending";
  const supabase = await createClient();
  let q = supabase.from("listings").select("id,name,slug,type,status,owner_id,verification_decision,verification_requested_at,verification_reason,plan_id,updated_at").is("deleted_at", null).eq("verification_decision", tab).limit(100);
  q = tab === "pending" ? q.not("verification_requested_at", "is", null).order("verification_requested_at") : q.order("updated_at", { ascending: false });
  const { data: rows } = await q;
  const owners = Array.from(new Set((rows ?? []).map((r) => r.owner_id).filter(Boolean)));
  const { data: people } = owners.length ? await supabase.from("profiles").select("id,full_name,email").in("id", owners) : { data: [] };
  const who = (id: string | null) => { const p = (people ?? []).find((x) => x.id === id); return p ? `${p.full_name || "(no name)"} · ${p.email}` : "Added by staff"; };

  return (
    <>
      <AdminHeader title="Business verification" intro="Check that a business is genuine before marking it verified. Paying for a plan never verifies a business." />
      <Flash sp={sp} />
      {sp.error === "reason" && <div className="mb-4"><Notice tone="error">Give a reason when rejecting or suspending a business. The owner will see it.</Notice></div>}
      <nav aria-label="Decision" className="mb-5 flex flex-wrap gap-2 text-sm">
        {TABS.map(([t, l]) => <Link key={t} href={`/admin/verification?tab=${t}`} aria-current={tab === t ? "page" : undefined} className={`rounded-full px-4 py-2 ${tab === t ? "bg-forest text-white" : "border border-line hover:bg-forest-soft"}`}>{l}</Link>)}
      </nav>
      {(rows ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">Nothing here.</p> : (
        <ul className="space-y-4">
          {rows!.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/${adminKey[listingSection(r.type)]}/${r.id}`} className="font-serif text-lg font-semibold text-forest hover:underline">{r.name}</Link>
                  <p className="mt-1 text-sm text-muted">{listingTypeLabels[r.type as ListingType]} · {who(r.owner_id)}{r.verification_requested_at && <> · requested {formatDate(r.verification_requested_at)}</>}</p>
                  {r.verification_reason && <p className="mt-1 text-sm">Reason on record: {r.verification_reason}</p>}
                </div>
                <div className="flex gap-2"><Badge tone="neutral">{r.status.replace("_", " ")}</Badge>{r.plan_id && <Badge tone="gold">Has a plan</Badge>}</div>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                {r.verification_decision !== "verified" && <form action={decideVerification.bind(null, r.id, "verified")}><Button size="sm">Verify</Button></form>}
                <form action={decideVerification.bind(null, r.id, "rejected")} className="flex items-end gap-2">
                  <label className="sr-only" htmlFor={`why-${r.id}`}>Reason for {r.name}</label>
                  <Input id={`why-${r.id}`} name="reason" placeholder="Reason (shown to the owner)" className="h-9 w-64" />
                  <Button size="sm" variant="outline" name="x" value="reject">Reject</Button>
                  {r.verification_decision !== "suspended" && <Button size="sm" variant="danger" formAction={decideVerification.bind(null, r.id, "suspended")}>Suspend</Button>}
                </form>
                {r.verification_decision !== "pending" && <form action={decideVerification.bind(null, r.id, "pending")}><Button size="sm" variant="ghost">Reset to pending</Button></form>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
