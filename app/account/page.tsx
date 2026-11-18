import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, CalendarDays, ClipboardList, Compass, Map as MapIcon, Ticket } from "lucide-react";
import { signOutAction } from "@/app/actions/account";
import { DeleteRequest, PasswordForm, ProfileForm } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/layout/blocks";
import { Button, Container } from "@/components/ui";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { landingPath } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email || "";

  const links = [
    { href: "/account/bookings", icon: Ticket, title: "My bookings", text: "Requests and bookings you have made." },
    { href: "/account/applications", icon: ClipboardList, title: "Applications and saved jobs", text: "Follow your job applications." },
    { href: "/travel-planner", icon: MapIcon, title: "My travel plans", text: "Plans you have saved or shared." },
    { href: "/events", icon: CalendarDays, title: "Events", text: "Find events and register." },
    { href: "/jobs", icon: Briefcase, title: "Jobs", text: "Browse vacancies in Asanteman." },
    { href: "/explore", icon: Compass, title: "Explore Asanteman", text: "Places, culture and plans." },
  ];
  const extra = [
    ...(isStaff(user.role) || user.role === "media_manager" ? [{ href: "/admin", title: "Admin dashboard" }] : []),
    ...(user.role === "partner" ? [{ href: "/partner/dashboard", title: "Business portal" }] : []),
    { href: "/employer", title: "Employer area (post vacancies)" },
  ];

  return (
    <>
      <PageHeader title="My account" intro={`Welcome, ${name}.`} crumbs={[{ label: "My account" }]} />
      <Container className="max-w-5xl space-y-12 py-10">
        <section aria-labelledby="quick-h">
          <h2 id="quick-h" className="sr-only">Your activity</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(({ href, icon: Icon, title, text }) => (
              <li key={href}><Link href={href} className="flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-4 transition hover:shadow-md">
                <Icon className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden /><span><span className="block font-medium text-forest">{title}</span><span className="block text-sm text-muted">{text}</span></span>
              </Link></li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-6 text-sm">
            {extra.map((e) => <Link key={e.href} href={e.href} className="inline-flex min-h-11 items-center font-medium text-lake-dark underline underline-offset-2 hover:no-underline">{e.title}</Link>)}
          </p>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="profile-h">
            <h2 id="profile-h" className="mb-4 font-serif text-xl font-semibold text-forest">Your details</h2>
            <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} email={user.email ?? ""} />
          </section>
          <section aria-labelledby="pw-h">
            <h2 id="pw-h" className="mb-4 font-serif text-xl font-semibold text-forest">Change your password</h2>
            <PasswordForm />
          </section>
        </div>

        <section aria-labelledby="out-h" className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <div><h2 id="out-h" className="font-serif text-xl font-semibold text-forest">Sign out</h2><p className="text-sm text-muted">Signed in as {user.email}.</p></div>
          <form action={signOutAction}><Button variant="outline">Sign out</Button></form>
        </section>

        <section aria-labelledby="del-h" className="rounded-2xl border border-line bg-mist p-6">
          <h2 id="del-h" className="mb-3 font-serif text-xl font-semibold text-forest">Delete your account</h2>
          <DeleteRequest />
        </section>
      </Container>
    </>
  );
}
