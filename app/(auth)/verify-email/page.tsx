import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <MailCheck className="mx-auto size-10 text-forest" aria-hidden />
      <h1 className="mt-3 text-2xl font-semibold text-forest">Check your inbox</h1>
      <p className="mt-2 text-sm text-muted">We have sent a verification link to your email address. Open it to activate your account, then log in.</p>
      <ButtonLink href="/login" className="mt-6">Go to log in</ButtonLink>
    </div>
  );
}
