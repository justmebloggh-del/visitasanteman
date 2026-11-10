import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Employer portal", template: "%s | Employer portal" }, robots: { index: false, follow: false } };

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/employer");
  return <div className="bg-mist"><div className="mx-auto max-w-5xl p-4 sm:p-8">{children}</div></div>;
}
