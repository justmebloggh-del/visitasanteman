import type { Metadata } from "next";
import { updatePassword } from "@/app/actions/auth";
import { AuthForm } from "@/components/forms/AuthForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-5 text-center text-2xl font-semibold text-forest">Choose a new password</h1>
      <AuthForm mode="reset" action={updatePassword} />
    </>
  );
}
