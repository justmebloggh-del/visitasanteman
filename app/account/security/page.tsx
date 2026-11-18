import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOutAction, signOutEverywhere } from "@/app/actions/account";
import { DeleteRequest, PasswordForm } from "@/components/account/AccountForms";
import { Button } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Password and security", robots: { index: false } };

export default async function SecurityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/security");
  return (
    <div className="max-w-xl space-y-8">
      <section aria-labelledby="pw-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 id="pw-h" className="mb-1 font-serif text-xl font-semibold text-forest">Change your password</h2>
        <p className="mb-4 text-sm text-muted">Choose at least 10 characters that you do not use anywhere else.</p>
        <PasswordForm />
      </section>
      <section aria-labelledby="ses-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 id="ses-h" className="mb-1 font-serif text-xl font-semibold text-forest">Signing out</h2>
        <p className="mb-4 text-sm text-muted">Signed in as {user.email}. If you used a shared or public device, sign out of every device.</p>
        <div className="flex flex-wrap gap-3">
          <form action={signOutAction}><Button variant="outline">Sign out</Button></form>
          <form action={signOutEverywhere}><Button variant="outline">Sign out of all devices</Button></form>
        </div>
      </section>
      <section aria-labelledby="del-h" className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
        <h2 id="del-h" className="mb-3 font-serif text-xl font-semibold text-red-800">Delete your account</h2>
        <DeleteRequest />
      </section>
    </div>
  );
}
