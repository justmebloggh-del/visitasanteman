import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Launch readiness" };
type State = "ok" | "warn" | "todo";
interface Check { label: string; state: State; detail: string; href?: string }

const env = (k: string) => Boolean(process.env[k]);

export default async function Readiness() {
  await requireAdmin();
  const db = await createClient();
  const count = async (table: string, f?: (q: ReturnType<ReturnType<typeof db.from>["select"]>) => unknown) => {
    const base = db.from(table).select("*", { count: "exact", head: true });
    const { count: n } = await ((f ? f(base as never) : base) as unknown as Promise<{ count: number | null }>);
    return n ?? 0;
  };
  const published = (t: string) => count(t, (q) => (q as unknown as { eq: (c: string, v: string) => unknown }).eq("status", "published"));

  const [areasTotal, areasActive, areasUnverified, attractions, attractionsNoCover, attractionsNoCoords, research, ceremonies, institutions, sports, transport, accommodation, restaurants, communities, destinations, articles, verifiedListings, partners, pagesRows, settingsRows, hero] = await Promise.all([
    count("administrative_areas"),
    count("administrative_areas", (q) => (q as unknown as { eq: (c: string, v: boolean) => unknown }).eq("is_active", true)),
    count("administrative_areas", (q) => (q as unknown as { like: (c: string, v: string) => unknown }).like("source", "UNVERIFIED%")),
    published("attractions"),
    count("attractions", (q) => (q as unknown as { eq: (c: string, v: string) => { is: (c: string, v: null) => unknown } }).eq("status", "published").is("cover_media_id", null)),
    count("attractions", (q) => (q as unknown as { eq: (c: string, v: string) => { is: (c: string, v: null) => unknown } }).eq("status", "published").is("latitude", null)),
    count("attractions", (q) => (q as unknown as { eq: (c: string, v: string) => unknown }).eq("verification_status", "research_identified")),
    published("ceremonies"), published("institutions"), published("sports_venues"), published("transport_providers"),
    count("listings", (q) => (q as unknown as { eq: (c: string, v: string) => { in: (c: string, v: string[]) => unknown } }).eq("status", "published").in("type", ["hotel", "resort", "guesthouse", "lodge", "eco_lodge", "boutique_hotel", "homestay", "holiday_home", "apartment"])),
    count("listings", (q) => (q as unknown as { eq: (c: string, v: string) => { in: (c: string, v: string[]) => unknown } }).eq("status", "published").in("type", ["restaurant", "cafe", "bakery", "food_vendor", "caterer"])),
    published("communities"), published("destinations"), published("articles"),
    count("listings", (q) => (q as unknown as { eq: (c: string, v: boolean) => unknown }).eq("is_verified", true)),
    count("user_roles", (q) => (q as unknown as { eq: (c: string, v: string) => unknown }).eq("role", "partner")),
    db.from("pages").select("slug,status"),
    db.from("site_settings").select("key,value"),
    db.from("homepage_sections").select("config").eq("key", "hero").maybeSingle(),
  ]);
  const pageStatus = Object.fromEntries((pagesRows.data ?? []).map((p) => [p.slug, p.status]));
  const settings = Object.fromEntries((settingsRows.data ?? []).map((s) => [s.key, s.value as Record<string, string>]));
  const contact = settings.contact ?? {};
  const heroSet = Boolean((hero.data?.config as Record<string, unknown> | null)?.image_path);
  const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";

  const sections: { title: string; checks: Check[] }[] = [
    { title: "Hosting and services", checks: [
      { label: "Site address", state: SITE_URL.startsWith("https://") && !SITE_URL.includes("localhost") ? "ok" : "todo", detail: `NEXT_PUBLIC_SITE_URL is ${SITE_URL}. It must be the real https address (canonical links, sitemap and emails use it).` },
      { label: "Database and storage", state: env("NEXT_PUBLIC_SUPABASE_URL") && env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "ok" : "todo", detail: "Supabase URL and public key are set." },
      { label: "Service key for payments", state: env("SUPABASE_SERVICE_ROLE_KEY") ? "ok" : "warn", detail: "Needed only to record gateway-verified payments. Never exposed to the browser." },
      { label: "Email (Resend)", state: env("RESEND_API_KEY") && env("EMAIL_FROM") ? "ok" : "todo", detail: "Enquiry, booking and partner notifications are sent only when RESEND_API_KEY and EMAIL_FROM are set and the sending domain is verified." },
      { label: "Online payments", state: process.env.PAYMENTS_ENABLED === "true" && paystackKey ? (paystackKey.startsWith("sk_live") ? "ok" : "warn") : "todo", detail: process.env.PAYMENTS_ENABLED === "true" && paystackKey ? `Enabled with a ${paystackKey.startsWith("sk_live") ? "LIVE" : "test"} key. Test with real test-mode keys before going live.` : "Off. Payments stay disabled until real Paystack keys have been tested." },
      { label: "Analytics and Search Console", state: env("NEXT_PUBLIC_GA_ID") && env("NEXT_PUBLIC_GSC_VERIFICATION") ? "ok" : "todo", detail: "NEXT_PUBLIC_GA_ID and NEXT_PUBLIC_GSC_VERIFICATION, then submit /sitemap.xml in Search Console." },
      { label: "Staff enquiry notifications", state: env("ENQUIRY_NOTIFY_EMAIL") ? "ok" : "warn", detail: "ENQUIRY_NOTIFY_EMAIL receives general enquiries. Without it they only appear in Admin → Enquiries." },
    ] },
    { title: "Districts and geography", checks: [
      { label: "Districts checked and active", state: areasTotal === 0 ? "todo" : areasActive === areasTotal && areasUnverified === 0 ? "ok" : "todo", detail: `${areasActive} of ${areasTotal} districts are active; ${areasUnverified} still carry the “UNVERIFIED” source note. Compare each with the official Local Government Service list, then activate.`, href: "/admin/administrative-areas" },
    ] },
    { title: "Content", checks: [
      { label: "Attractions published", state: attractions >= 5 ? "ok" : "todo", detail: `${attractions} published. A credible launch needs several verified attractions with photos and coordinates.`, href: "/admin/attractions" },
      { label: "Research records still unchecked", state: research === 0 ? "ok" : "warn", detail: `${research} attraction records are still “research identified”. They are hidden from the public.`, href: "/admin/attractions?filter=research_identified" },
      { label: "Published attractions without a photo", state: attractionsNoCover === 0 ? "ok" : "warn", detail: `${attractionsNoCover} without a main photograph.` },
      { label: "Published attractions without coordinates", state: attractionsNoCoords === 0 ? "ok" : "warn", detail: `${attractionsNoCoords} will not appear on the map.` },
      { label: "Communities, destinations, accommodation, food", state: communities > 0 && destinations > 0 && accommodation >= 3 && restaurants >= 3 ? "ok" : "todo", detail: `${communities} communities, ${destinations} destinations, ${accommodation} places to stay, ${restaurants} places to eat published.` },
      { label: "Ceremonies, education, sports, transport", state: ceremonies + institutions + sports + transport > 0 ? "ok" : "warn", detail: `${ceremonies} ceremonies, ${institutions} institutions, ${sports} sports venues, ${transport} transport services published. Optional at launch, but empty sections are hidden.` },
      { label: "Articles", state: articles > 0 ? "ok" : "warn", detail: `${articles} published.` },
      { label: "Homepage hero photograph", state: heroSet ? "ok" : "todo", detail: "Set under Admin → Homepage.", href: "/admin/homepage" },
      { label: "Contact details", state: contact.email || contact.phone ? "ok" : "todo", detail: "Email or phone under Admin → Settings.", href: "/admin/settings" },
    ] },
    { title: "Pages and legal", checks: [
      ["about", "About"], ["about-our-mission", "Our mission"], ["explore", "Explore"], ["travel-guide", "Travel guide"], ["privacy", "Privacy policy"], ["terms", "Terms and conditions"],
    ].map(([slug, label]): Check => ({ label, state: pageStatus[slug] === "published" ? "ok" : "todo", detail: pageStatus[slug] === "published" ? "Published." : "Not published. Write it under Admin → Pages." + (slug === "privacy" || slug === "terms" ? " Have it reviewed by a lawyer first." : ""), href: `/admin/pages/${slug}` })) },
    { title: "Businesses", checks: [
      { label: "Verified businesses", state: verifiedListings > 0 ? "ok" : "warn", detail: `${verifiedListings} verified listings, ${partners} partner accounts.`, href: "/admin/verification" },
    ] },
  ];
  const all = sections.flatMap((s) => s.checks);
  const todo = all.filter((c) => c.state === "todo").length, warn = all.filter((c) => c.state === "warn").length;
  const tone = { ok: "green", warn: "gold", todo: "red" } as const;
  const label = { ok: "Ready", warn: "Check", todo: "To do" } as const;

  return (
    <>
      <AdminHeader title="Launch readiness" intro="A live checklist of what still stands between this site and a credible public launch. It shows only whether settings exist, never their values." />
      <p className="mb-6 rounded-2xl border border-line bg-white p-5 text-sm"><strong>{todo}</strong> things to do, <strong>{warn}</strong> to check, <strong>{all.length - todo - warn}</strong> ready. Not covered here: legal review, cultural review by custodians, a restore test of the database backup, and rate limiting at the hosting edge (see the deployment guide).</p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title} aria-label={s.title}>
            <h2 className="mb-3 font-serif text-lg font-semibold text-forest">{s.title}</h2>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {s.checks.map((c) => (
                <li key={c.label} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                  <div><p className="font-medium">{c.href ? <Link href={c.href} className="text-forest hover:underline">{c.label}</Link> : c.label}</p><p className="mt-0.5 text-muted">{c.detail}</p></div>
                  <Badge tone={tone[c.state]}>{label[c.state]}</Badge>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
