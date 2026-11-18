"use client";

import { useActionState } from "react";
import { changePassword, requestAccountDeletion, updateProfile } from "@/app/actions/account";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Full name" htmlFor="full_name" error={err.full_name}><Input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" required aria-invalid={!!err.full_name} /></Field>
      <Field label="Email" htmlFor="email" hint="To change your email address, contact us."><Input id="email" value={email} readOnly disabled /></Field>
      <Field label="Phone (optional)" htmlFor="phone" error={err.phone}><Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={phone} autoComplete="tel" aria-invalid={!!err.phone} /></Field>
      <SubmitButton pendingText="Saving…">Save details</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Current password" htmlFor="current_password" error={err.current_password}><Input id="current_password" name="current_password" type="password" autoComplete="current-password" required aria-invalid={!!err.current_password} /></Field>
      <Field label="New password" htmlFor="new_password" error={err.new_password} hint="At least 10 characters."><Input id="new_password" name="new_password" type="password" autoComplete="new-password" required aria-invalid={!!err.new_password} /></Field>
      <SubmitButton pendingText="Changing…">Change password</SubmitButton>
    </form>
  );
}

export function DeleteRequest() {
  const [state, action] = useActionState<FormState>(requestAccountDeletion, {});
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-3">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <p className="text-sm text-muted">This asks our team to delete your account and the personal information linked to it. Bookings and applications you made may be kept where the law requires it.</p>
      <SubmitButton variant="outline" pendingText="Sending…">Request account deletion</SubmitButton>
    </form>
  );
}
