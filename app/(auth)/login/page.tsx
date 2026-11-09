import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/forms/AuthForm";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="mb-5 text-center text-2xl font-semibold text-forest">Log in</h1>
      <div className="mb-4 space-y-3">
        {sp.reset && <Notice tone="success">Password updated. You can log in now.</Notice>}
        {sp.error === "link" && <Notice tone="error">That link is invalid or has expired. Please try again.</Notice>}
      </div>
      <AuthForm mode="login" action={login} next={sp.next} />
      <div className="mt-5 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-lake-dark hover:underline">Forgot password?</Link>
        <Link href="/register" className="text-lake-dark hover:underline">Create an account</Link>
      </div>
    </>
  );
}
