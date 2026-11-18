import type { Metadata } from "next";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getSessionUser } from "@/lib/auth/session";
import { landingPath } from "@/lib/auth/landing";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(landingPath(user.role));
  return (
    <>
      <h1 className="mb-5 text-center text-2xl font-semibold text-forest">Create your account</h1>
      <AuthForm mode="register" action={register} />
      <p className="mt-5 text-center text-sm text-muted">Already registered? <Link href="/login" className="text-lake-dark underline underline-offset-2 hover:no-underline">Log in</Link></p>
    </>
  );
}
