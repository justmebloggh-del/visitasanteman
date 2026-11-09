import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { PartnerSettingsForm } from "@/components/partner/SettingsForm";
import { accountTypeLabels } from "@/config/site";
import { requirePartner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function PartnerSettings() {
  const user = await requirePartner();
  const { data } = await (await createClient()).from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle();
  return (
    <>
      <AdminHeader title="Settings" intro={`${user.email}${user.accountType ? ` · ${accountTypeLabels[user.accountType]}` : ""}`} />
      <PartnerSettingsForm name={data?.full_name ?? ""} phone={data?.phone ?? ""} />
      <p className="mt-8 text-sm text-muted">Need to change your password? <Link href="/forgot-password" className="text-lake-dark hover:underline">Send a reset link</Link>. To change your business type or contact the team, <Link href="/contact" className="text-lake-dark hover:underline">get in touch</Link>.</p>
    </>
  );
}
