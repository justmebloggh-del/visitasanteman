"use client";

import { useActionState } from "react";
import { resendVerification } from "@/app/actions/auth";
import { CaptchaWidget } from "@/components/forms/CaptchaWidget";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function ResendVerification() {
  const [state, action] = useActionState<FormState, FormData>(resendVerification, {});
  if (state.ok && state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} noValidate className="space-y-3 text-left">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <Field label="Did not get it? Send a new link to" htmlFor="resend-email" error={state.errors?.email}><Input id="resend-email" name="email" type="email" autoComplete="email" required /></Field>
      <CaptchaWidget resetSignal={state} />
      <SubmitButton variant="outline" className="w-full" pendingText="Sending…">Send a new link</SubmitButton>
    </form>
  );
}
