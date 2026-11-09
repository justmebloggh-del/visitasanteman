"use client";

import { useActionState } from "react";
import { savePartnerSettings } from "@/app/partner/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function PartnerSettingsForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useActionState<FormState, FormData>(savePartnerSettings, {});
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="max-w-md space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Your name" htmlFor="full_name" error={state.errors?.full_name}><Input id="full_name" name="full_name" defaultValue={name} required /></Field>
      <Field label="Phone" htmlFor="phone"><Input id="phone" name="phone" type="tel" defaultValue={phone} /></Field>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
