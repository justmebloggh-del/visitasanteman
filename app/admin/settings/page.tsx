import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Badge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

const integrations = [
  { name: "Google Analytics", on: !!process.env.NEXT_PUBLIC_GA_ID, env: "NEXT_PUBLIC_GA_ID" },
  { name: "Email notifications (Resend)", on: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.ENQUIRY_NOTIFY_EMAIL), env: "RESEND_API_KEY, EMAIL_FROM, ENQUIRY_NOTIFY_EMAIL" },
  { name: "Search Console verification", on: !!process.env.NEXT_PUBLIC_GSC_VERIFICATION, env: "NEXT_PUBLIC_GSC_VERIFICATION" },
  { name: "Paystack payments", on: false, env: "Phase 3: not yet built, so nothing to enable" },
];

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key,value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, Record<string, string | number>>;
  return (
    <>
      <AdminHeader title="Settings" intro="Administrators only." />
      <SettingsForm s={s} />
      <section className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="mb-1 font-serif text-lg font-semibold text-forest">Integrations</h2>
        <p className="mb-4 text-sm text-muted">Secrets are set as environment variables in Vercel, never stored in the database. This shows what the server can currently see.</p>
        <ul className="divide-y divide-line text-sm">
          {integrations.map((i) => <li key={i.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span>{i.name}<span className="block text-xs text-muted">{i.env}</span></span><Badge tone={i.on ? "green" : "neutral"}>{i.on ? "Configured" : "Not configured"}</Badge></li>)}
        </ul>
      </section>
    </>
  );
}
