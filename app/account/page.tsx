import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Briefcase, CalendarDays, Compass, Map as MapIcon } from "lucide-react";
import { Avatar } from "@/components/account/Avatar";
import { ButtonLink } from "@/components/ui";
import { firstName, getAccountSummary, initials } from "@/lib/account/summary";
import { canManageMedia, getSessionUser, isStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);

export default async function AccountOverview() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const { profile, counts, recent } = await getAccountSummary(user.id);
  const name = profile?.full_name || "";
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const tiles = [
    { label: "Bookings", value: counts.bookings, href: "/account/bookings" },
    { label: "Events I registered for", value: counts.events, href: "/account/events" },
    { label: "Job applications", value: counts.applications, href: "/account/applications" },
    { label: "Saved jobs", value: counts.saved, href: "/account/saved" },
    { label: "Travel plans", value: counts.plans, href: "/account/plans" },
  ];

  type Activity = { id: string; when: string; label: string; text: string; href: string };
  const activity: Activity[] = [
    ...recent.bookings.map((b) => ({ id: "b" + b.reference, when: b.created_at, label: "Booking", text: `${b.reference} · ${String(b.status).replace("_", " ")}`, href: "/account/bookings" })),
    ...recent.applications.map((a) => ({ id: "a" + a.id, when: a.created_at, label: "Application", text: `${one(a.vacancy)?.title ?? "Vacancy"} · ${a.status}`, href: "/account/applications" })),
    ...recent.events.map((e) => ({ id: "e" + e.id, when: e.created_at, label: "Event", text: `Registered for ${one(e.event)?.title ?? "an event"}`, href: "/account/events" })),
    ...recent.plans.map((p) => ({ id: "p" + p.id, when: p.updated_at, label: "Plan", text: p.title, href: `/travel-planner/${p.id}` })),
  ].sort((x, y) => +new Date(y.when) - +new Date(x.when)).slice(0, 6);

  const next = [
    { href: "/travel-planner", icon: MapIcon, title: "Plan a trip", text: "Build a day-by-day plan from real places." },
    { href: "/events", icon: CalendarDays, title: "Find an event", text: "Register for free events." },
    { href: "/jobs", icon: Briefcase, title: "Find a job", text: "Apply without paying a fee." },
    { href: "/explore", icon: Compass, title: "Explore Asanteman", text: "Places, culture and districts." },
  ];
  const shortcuts = [
    ...(isStaff(user.role) || canManageMedia(user.role) ? [{ href: "/admin", title: "Admin dashboard" }] : []),
    ...(user.role === "partner" ? [{ href: "/partner/dashboard", title: "Business portal" }] : []),
    { href: "/employer", title: "Post a vacancy (employer area)" },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <Avatar text={initials(name, user.email)} />
        <div className="min-w-0 flex-1 basis-40">
          <h2 className="font-serif text-xl font-semibold text-forest sm:text-2xl">Welcome back, {firstName(name, user.email)}</h2>
          <p className="truncate text-sm text-muted">{user.email}{profile?.created_at ? ` · member since ${formatDate(profile.created_at)}` : ""}</p>
        </div>
        <ButtonLink href="/travel-planner" variant="accent" className="w-full sm:w-auto">Plan a trip</ButtonLink>
      </section>

      {!profile?.phone && (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-soft p-4 text-sm">
          <span><strong>Finish your profile.</strong> Add a phone number so organisers and employers can reach you.</span>
          <Link href="/account/profile" className="inline-flex min-h-11 items-center font-medium text-forest underline underline-offset-2">Add it now</Link>
        </p>
      )}

      <section aria-labelledby="tiles-h">
        <h2 id="tiles-h" className="sr-only">At a glance</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {tiles.map((t) => (
            <li key={t.label}><Link href={t.href} className="block h-full rounded-2xl border border-line bg-white p-4 transition hover:shadow-md">
              <span className="block font-serif text-3xl font-semibold text-forest">{t.value}</span><span className="text-sm text-muted">{t.label}</span>
            </Link></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="act-h">
        <h2 id="act-h" className="mb-3 font-serif text-xl font-semibold text-forest">{total === 0 ? "Get started" : "Recent activity"}</h2>
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-6">
            <p className="text-muted">Nothing here yet. Your bookings, event registrations, job applications and saved plans will appear in this account as you use the site.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {activity.map((a) => (
              <li key={a.id}><Link href={a.href} className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-mist">
                <span className="min-w-0"><span className="mr-2 inline-block rounded-full bg-forest-soft px-2.5 py-0.5 text-xs font-medium text-forest">{a.label}</span><span className="text-sm">{a.text}</span></span>
                <span className="text-xs text-muted">{formatDate(a.when)}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="next-h">
        <h2 id="next-h" className="mb-3 font-serif text-xl font-semibold text-forest">What would you like to do?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {next.map(({ href, icon: Icon, title, text }) => (
            <li key={href}><Link href={href} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:shadow-md">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-soft text-forest"><Icon className="size-5" aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="block font-medium text-forest">{title}</span><span className="block text-sm text-muted">{text}</span></span>
              <ArrowRight className="size-4 text-forest/60 transition group-hover:translate-x-0.5" aria-hidden />
            </Link></li>
          ))}
        </ul>
        <p className="mt-4 flex flex-wrap gap-x-6 text-sm">
          {shortcuts.map((s) => <Link key={s.href} href={s.href} className="inline-flex min-h-11 items-center font-medium text-lake-dark underline underline-offset-2 hover:no-underline">{s.title}</Link>)}
        </p>
      </section>
    </div>
  );
}
