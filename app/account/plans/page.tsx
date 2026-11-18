import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My travel plans", robots: { index: false } };

export default async function PlansPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/plans");
  const { data } = await (await createClient()).from("travel_itineraries").select("id,title,days,updated_at").order("updated_at", { ascending: false });
  const plans = data ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl font-semibold text-forest">My travel plans</h2><ButtonLink href="/travel-planner" variant="accent">Start a new plan</ButtonLink></div>
      {plans.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">No plans yet. Choose places on the site and arrange them into a day-by-day plan you can share or print.</p>
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => (
            <li key={p.id}><Link href={`/travel-planner/${p.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-white p-4 hover:shadow-md">
              <span className="min-w-0 flex-1"><span className="block font-medium text-forest">{p.title}</span><span className="text-sm text-muted">{p.days} {p.days === 1 ? "day" : "days"} · updated {formatDate(p.updated_at)}</span></span>
              <ChevronRight className="size-4 text-forest/60" aria-hidden />
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
