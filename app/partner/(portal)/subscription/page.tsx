import type { Metadata } from "next";
import { Check } from "lucide-react";
import { requestPlanUpgrade } from "@/app/partner/actions";
import { AdminHeader } from "@/components/admin/ui";
import { Badge, Button, Notice } from "@/components/ui";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscription" };

export default async function Subscription({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePartner();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: plans }, { data: listings }] = await Promise.all([
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("listings").select("name,plan_id").eq("owner_id", user.id).is("deleted_at", null),
  ]);
  const current = new Set((listings ?? []).map((l) => l.plan_id));
  return (
    <>
      <AdminHeader title="Subscription" intro="Your plan decides photo allowance, placement and analytics." />
      {sp.requested && <div className="mb-4"><Notice tone="success">Thank you. Our team will contact you about this plan.</Notice></div>}
      {sp.error && <div className="mb-4"><Notice tone="error">We could not send that request. Please try again later.</Notice></div>}
      <div className="mb-5"><Notice tone="info">Paid plans are arranged with our team and activated by an administrator. Online payment is not available yet, so nothing is charged here.</Notice></div>
      <ul className="grid gap-5 md:grid-cols-3">
        {(plans ?? []).map((p) => {
          const active = current.has(p.id) || (p.slug === "free" && (listings ?? []).some((l) => !l.plan_id));
          return (
            <li key={p.id} className="rounded-2xl border border-line bg-white p-6">
              <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-forest">{p.name}</h2>{active && <Badge tone="green">Current</Badge>}</div>
              <p className="mt-1 font-semibold">{p.price_monthly != null ? `${formatPrice(p.price_monthly, p.price_currency)} / month` : p.slug === "free" ? "Free" : "Contact us"}</p>
              <p className="mt-1 text-xs text-muted">Up to {p.max_photos} gallery photos</p>
              <ul className="mt-3 space-y-1.5 text-sm">{p.features.map((f: string) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />{f}</li>)}</ul>
              {p.slug !== "free" && !active && <form action={requestPlanUpgrade.bind(null, p.id)} className="mt-5"><Button size="sm" variant="outline">Ask about this plan</Button></form>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
