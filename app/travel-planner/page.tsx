import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { PlanForm } from "@/components/planner/PlanForm";
import { ButtonLink, Container } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Travel planner", description: "Plan your visit to the Ashanti Region: pick attractions, places to stay, food and experiences, arrange them by day, and share or print your itinerary.", path: "/travel-planner" });

export default async function TravelPlanner() {
  const user = await getSessionUser();
  const plans = user ? ((await (await createClient()).from("travel_itineraries").select("id,title,days,updated_at").order("updated_at", { ascending: false })).data ?? []) : [];
  return (
    <>
      <PageHeader title="Travel planner" intro="Build a day-by-day plan from places that are really on this site, then share it or print it." crumbs={[{ label: "Travel planner" }]} />
      <Container className="py-10">
        {!user ? (
          <div className="max-w-2xl space-y-4">
            <p className="text-lg">Create a free account to build and save your plans. You can add attractions, accommodation, restaurants, experiences and events, arrange them by day, see them on a map and share a link.</p>
            <div className="flex gap-3"><ButtonLink href="/register?next=/travel-planner">Create an account</ButtonLink><ButtonLink href="/login?next=/travel-planner" variant="outline">Log in</ButtonLink></div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            <section><h2 className="mb-4 text-2xl font-semibold text-forest">Your plans</h2>
              {plans.length === 0 ? <p className="rounded-2xl bg-mist p-6 text-muted">No plans yet. Start one on the right.</p> : (
                <ul className="space-y-3">{plans.map((p) => <li key={p.id}><Link href={`/travel-planner/${p.id}`} className="flex justify-between rounded-2xl border border-line bg-white p-4 hover:shadow-md"><span className="font-semibold text-forest">{p.title}</span><span className="text-sm text-muted">{p.days} day{p.days > 1 ? "s" : ""} · {formatDate(p.updated_at)}</span></Link></li>)}</ul>
              )}
            </section>
            <section><h2 className="mb-4 text-2xl font-semibold text-forest">Start a new plan</h2><PlanForm /></section>
          </div>
        )}
      </Container>
    </>
  );
}
