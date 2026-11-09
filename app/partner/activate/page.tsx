import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivateForm } from "@/components/partner/PartnerForms";
import { Container, Notice } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activate your business account", robots: { index: false } };

export default async function Activate() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/partner/activate");
  if (user.role === "partner") redirect("/partner/dashboard");
  const { data } = await (await createClient()).auth.getUser();
  const hint = typeof data.user?.user_metadata?.account_type === "string" ? data.user.user_metadata.account_type : undefined;
  return (
    <Container className="max-w-lg py-12">
      <h1 className="mb-2 text-3xl font-semibold text-forest">Activate your business account</h1>
      <p className="mb-6 text-sm text-muted">Signed in as {user.email}. Your email must be verified.</p>
      {user.role !== "visitor" && <Notice tone="info">Staff accounts cannot be converted to business accounts.</Notice>}
      {user.role === "visitor" && <ActivateForm defaultType={hint} />}
    </Container>
  );
}
