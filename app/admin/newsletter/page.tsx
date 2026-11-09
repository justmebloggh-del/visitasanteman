import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Newsletter" };

export default async function Newsletter() {
  await requireStaff();
  const supabase = await createClient();
  const { data, count } = await supabase.from("newsletter_subscribers").select("*", { count: "exact" }).is("unsubscribed_at", null).order("subscribed_at", { ascending: false }).limit(200);
  return (
    <>
      <AdminHeader title="Newsletter subscribers" intro="People who asked for destination updates. Export the list to send campaigns with your email provider."
        actions={<ButtonLink href="/admin/newsletter/export" variant="outline">Export CSV</ButtonLink>} />
      <p className="mb-3 text-sm text-muted">{count ?? 0} active subscribers{(count ?? 0) > 200 ? " (latest 200 shown)" : ""}.</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Email</th><th scope="col" className="px-4 py-3">Source</th><th scope="col" className="px-4 py-3">Subscribed</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-muted">No subscribers yet.</td></tr>}
            {(data ?? []).map((s) => <tr key={s.id}><td className="px-4 py-3">{s.email}</td><td className="px-4 py-3">{s.source}</td><td className="px-4 py-3">{formatDate(s.subscribed_at)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
