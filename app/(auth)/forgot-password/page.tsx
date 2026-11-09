import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthForm } from "@/components/forms/AuthForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-semibold text-forest">Forgot your password?</h1>
      <p className="mb-5 text-center text-sm text-muted">Enter your email and we will send you a link to choose a new one.</p>
      <AuthForm mode="forgot" action={requestPasswordReset} />
      <p className="mt-5 text-center text-sm"><Link href="/login" className="text-lake-dark hover:underline">Back to log in</Link></p>
    </>
  );
}
