import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/account/Avatar";
import { ProfileForm } from "@/components/account/AccountForms";
import { initials, getAccountSummary } from "@/lib/account/summary";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My details", robots: { index: false } };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/profile");
  const { profile } = await getAccountSummary(user.id);
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar text={initials(profile?.full_name, user.email)} />
        <div><h2 className="font-serif text-2xl font-semibold text-forest">My details</h2><p className="text-sm text-muted">{profile?.created_at ? `Member since ${formatDate(profile.created_at)}` : "Your name and how to reach you."}</p></div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} email={user.email ?? ""} />
      </div>
    </div>
  );
}
