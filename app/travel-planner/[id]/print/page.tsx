import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlanDays } from "@/components/planner/PlanDays";
import { PrintButton } from "@/components/planner/PrintButton";
import { Container } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import type { PlanView } from "@/lib/planner/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Print travel plan", robots: { index: false } };

export default async function PrintPlan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getSessionUser())) redirect(`/login?next=/travel-planner/${id}/print`);
  const plan = (await (await createClient()).rpc("itinerary_view", { p_id: id })).data as PlanView | null;
  if (!plan) notFound();
  return (
    <Container className="max-w-3xl py-8">
      <div className="no-print mb-6 flex items-center justify-between"><Link href={`/travel-planner/${id}`} className="text-sm text-lake-dark hover:underline">Back to editor</Link><PrintButton /></div>
      <h1 className="text-3xl font-semibold text-forest">{plan.title}</h1>
      <p className="mt-1 text-sm text-muted">VisitAsanteman · {plan.days} day{plan.days > 1 ? "s" : ""} · {plan.travellers} traveller{plan.travellers > 1 ? "s" : ""}</p>
      {plan.notes && <p className="mt-3 whitespace-pre-line text-sm">{plan.notes}</p>}
      <div className="mt-6"><PlanDays plan={{ ...plan, items: plan.items.map((i) => ({ ...i })) }} editable={false} /></div>
      <p className="mt-6 text-xs text-muted">Check opening hours, prices and availability with each provider before you travel. This plan lists places published on VisitAsanteman; it is not a booking.</p>
    </Container>
  );
}
