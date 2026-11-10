import type { Metadata } from "next";
import { Check } from "lucide-react";
import { buildMetadata } from "@/components/layout/seo";
import { PageHeader } from "@/components/layout/blocks";
import { ButtonLink, Container } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createPublicClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "List your business", description: "Hotels, restaurants, guides and boat operators can list on VisitAsanteman. Every listing is reviewed before it is published.", path: "/partner" });

export default async function PartnerLanding() {
  const user = await getSessionUser();
  if (user?.role === "partner") redirect("/partner/dashboard");
  const plans = supabaseConfigured ? (await createPublicClient().from("subscription_plans").select("*").eq("is_active", true).order("sort_order")).data ?? [] : [];
  return (
    <>
      <PageHeader title="List your business" intro="Reach visitors planning a trip to Asanteman." crumbs={[{ label: "Partners" }]} />
      <Container className="py-12">
        <ol className="grid gap-4 md:grid-cols-4">
          {["Create a business account and verify your email", "Add your business details, photos and prices", "Submit for review. Our team checks every listing", "Once approved, visitors can find you and send enquiries"].map((t, i) => (
            <li key={t} className="rounded-2xl border border-line bg-white p-5"><span className="font-serif text-3xl text-gold">{i + 1}</span><p className="mt-2 text-sm">{t}</p></li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/partner/register" size="lg">Register your business</ButtonLink>
          <ButtonLink href="/partner/activate" variant="outline" size="lg">Already have an account? Activate it</ButtonLink>
        </div>
        {plans.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-semibold text-forest">Listing plans</h2>
            <ul className="grid gap-5 md:grid-cols-3">
              {plans.map((p) => (
                <li key={p.id} className="rounded-2xl border border-line bg-white p-6">
                  <h3 className="font-serif text-xl font-semibold text-forest">{p.name}</h3>
                  <p className="mt-1 text-lg font-semibold">{p.price_monthly != null ? `${formatPrice(p.price_monthly, p.price_currency)} / month` : p.slug === "free" ? "Free" : "Contact us for pricing"}</p>
                  <ul className="mt-4 space-y-2 text-sm">{p.features.map((f: string) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />{f}</li>)}</ul>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Paid plans are arranged with our team. Online payment is not available yet.</p>
          </section>
        )}
      </Container>
    </>
  );
}
