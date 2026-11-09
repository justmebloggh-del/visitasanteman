import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { accommodationTypes, businessTypes, restaurantTypes } from "@/config/site";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  await requireStaff();
  const supabase = await createClient();
  const count = async (table: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    q = f ? f(q) : q;
    const { count: c } = await q;
    return c ?? 0;
  };
  const live = (q: any) => q.is("deleted_at", null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const published = (q: any) => q.is("deleted_at", null).eq("status", "published"); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [users, attractions, communities, stays, food, biz, experiences, events, articles, newEnq, subs, pA, pC, pL, pE, pV, pT, recent, mediaCount] = await Promise.all([
    count("profiles"), count("attractions", live), count("communities", live),
    count("listings", (q) => live(q).in("type", accommodationTypes)), count("listings", (q) => live(q).in("type", restaurantTypes)),
    count("listings", (q) => live(q).in("type", businessTypes)), count("experiences", live), count("events", live), count("articles", live),
    count("enquiries", (q) => q.eq("status", "new")), count("newsletter_subscribers", (q) => q.is("unsubscribed_at", null)),
    count("attractions", (q) => q.eq("status", "pending_review")), count("communities", (q) => q.eq("status", "pending_review")),
    count("listings", (q) => q.eq("status", "pending_review")), count("experiences", (q) => q.eq("status", "pending_review")),
    count("events", (q) => q.eq("status", "pending_review")), count("articles", (q) => q.eq("status", "pending_review")),
    supabase.from("enquiries").select("id,name,kind,status,created_at").order("created_at", { ascending: false }).limit(6),
    count("media", live),
  ]);
  const pending = pA + pC + pL + pE + pV + pT;
  const pubAttr = await count("attractions", published);
  const [bookingsPending, bookingsAll, paidRows] = await Promise.all([
    count("bookings", (q) => q.eq("status", "pending")), count("bookings"),
    supabase.from("bookings").select("total_amount,commission_amount,currency").eq("payment_status", "paid"),
  ]);
  const revenue = (paidRows.data ?? []).reduce((a, r) => a + Number(r.total_amount ?? 0), 0);
  const commissions = (paidRows.data ?? []).reduce((a, r) => a + Number(r.commission_amount ?? 0), 0);

  const stats = [
    { label: "Registered users", value: users, href: "/admin/users" }, { label: "Attractions", value: attractions, href: "/admin/attractions" },
    { label: "Communities", value: communities, href: "/admin/communities" }, { label: "Accommodation", value: stays, href: "/admin/accommodation" },
    { label: "Restaurants", value: food, href: "/admin/restaurants" }, { label: "Businesses", value: biz, href: "/admin/businesses" },
    { label: "Experiences", value: experiences, href: "/admin/experiences" }, { label: "Events", value: events, href: "/admin/events" },
    { label: "Articles", value: articles, href: "/admin/articles" }, { label: "Newsletter subscribers", value: subs, href: "/admin/newsletter" },
    { label: "New enquiries", value: newEnq, href: "/admin/enquiries" }, { label: "Bookings awaiting confirmation", value: bookingsPending, href: "/admin/bookings?status=pending" }, { label: "All booking requests", value: bookingsAll, href: "/admin/bookings" }, { label: "Online revenue (GHS, paid)", value: revenue, href: "/admin/bookings?status=paid" }, { label: "Commission recorded (GHS)", value: commissions, href: "/admin/bookings?status=paid" }, { label: "Pending approval", value: pending, href: "/admin/businesses?status=pending_review" },
  ];
  const checklist = [
    { done: communities > 0, text: "Research, verify and publish community pages", href: "/admin/communities" },
    { done: pubAttr > 0, text: "Publish the first verified attraction", href: "/admin/attractions/new" },
    { done: mediaCount > 0, text: "Upload photographs to the media library", href: "/admin/media" },
    { done: stays + food > 0, text: "Add accommodation and restaurants confirmed by their owners", href: "/admin/accommodation/new" },
    { done: false, text: "Fill in contact details and social links", href: "/admin/settings" },
    { done: false, text: "Write and publish About, Explore, Travel Guide, Privacy and Terms pages", href: "/admin/pages" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" intro="Overview of the platform." />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}><Link href={s.href} className="block rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
            <p className="text-3xl font-semibold text-forest">{s.value}</p><p className="mt-1 text-sm text-muted">{s.label}</p></Link></li>
        ))}
      </ul>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Recent enquiries</h2>
          {(recent.data ?? []).length === 0 ? <p className="text-sm text-muted">No enquiries yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {recent.data!.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5"><span><strong>{e.name}</strong> <span className="text-muted">({e.kind.replace("_", " ")}, {formatDate(e.created_at)})</span></span><StatusBadge value={e.status} /></li>
              ))}
            </ul>
          )}
          <Link href="/admin/enquiries" className="mt-3 inline-block text-sm text-lake-dark hover:underline">All enquiries</Link>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Launch checklist</h2>
          <ul className="space-y-2.5 text-sm">
            {checklist.map((c) => (
              <li key={c.text}><Link href={c.href} className="flex items-start gap-2 hover:text-forest">{c.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" aria-label="Done" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-label="To do" />}<span className={c.done ? "text-muted line-through" : ""}>{c.text}</span></Link></li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mt-6 text-xs text-muted">Revenue counts only bookings paid online and verified with the gateway. Website traffic is in Google Analytics (see Analytics).</p>
    </>
  );
}
