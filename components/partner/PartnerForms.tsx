"use client";

import { useActionState } from "react";
import { activatePartner, registerBusiness } from "@/app/partner/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select } from "@/components/ui";
import { accountTypeLabels } from "@/config/site";
import type { FormState } from "@/lib/validations/forms";

const options = Object.entries(accountTypeLabels);

export function BusinessRegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerBusiness, {});
  const e = state.errors ?? {};
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <Field label="Your full name" htmlFor="full_name" error={e.full_name}><Input id="full_name" name="full_name" autoComplete="name" required /></Field>
      <Field label="Business name" htmlFor="business_name" error={e.business_name}><Input id="business_name" name="business_name" required /></Field>
      <Field label="Business type" htmlFor="account_type" error={e.account_type}>
        <Select id="account_type" name="account_type" defaultValue="" required>
          <option value="" disabled>Choose…</option>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Email" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters."><Input id="password" name="password" type="password" autoComplete="new-password" required /></Field>
      <SubmitButton className="w-full" pendingText="Creating account…">Create business account</SubmitButton>
    </form>
  );
}

export function ActivateForm({ defaultType }: { defaultType?: string }) {
  const [state, action] = useActionState<FormState, FormData>(activatePartner, {});
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <Field label="Business type" htmlFor="account_type" error={state.errors?.account_type}>
        <Select id="account_type" name="account_type" defaultValue={defaultType ?? ""} required>
          <option value="" disabled>Choose…</option>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <SubmitButton className="w-full" pendingText="Activating…">Activate business account</SubmitButton>
    </form>
  );
}
