import { redirect } from "next/navigation";
import { AccountNav, type NavItem } from "@/components/account/AccountNav";
import { PageHeader } from "@/components/layout/blocks";
import { Container } from "@/components/ui";
import { firstName, getAccountSummary } from "@/lib/account/summary";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Every page in My account shares this frame: the banner, the navigation and the content area. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const { profile, counts } = await getAccountSummary(user.id);
  const items: NavItem[] = [
    { key: "overview", href: "/account", label: "Overview" },
    { key: "bookings", href: "/account/bookings", label: "Bookings", count: counts.bookings },
    { key: "events", href: "/account/events", label: "My events", count: counts.events },
    { key: "applications", href: "/account/applications", label: "Applications", count: counts.applications },
    { key: "saved", href: "/account/saved", label: "Saved jobs", count: counts.saved },
    { key: "plans", href: "/account/plans", label: "Travel plans", count: counts.plans },
    { key: "profile", href: "/account/profile", label: "My details" },
    { key: "security", href: "/account/security", label: "Password & security" },
  ];
  return (
    <>
      <PageHeader title="My account" intro={`Hello, ${firstName(profile?.full_name, user.email)}.`} crumbs={[{ label: "My account" }]} />
      <Container className="py-6 sm:py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <AccountNav items={items} />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </>
  );
}
