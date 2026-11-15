"use client";

import { useActionState } from "react";
import { saveBanner } from "@/app/admin/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Textarea } from "@/components/ui";
import type { BannerDef } from "@/config/banners";
import type { FormState } from "@/lib/validations/forms";

export function BannerForm({ def }: { def: BannerDef }) {
  const [state, action] = useActionState<FormState, FormData>(saveBanner.bind(null, def.key), {});
  const err = state.errors ?? {};
  const k = def.key;
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-3">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Headline" htmlFor={`${k}-h`} error={err.headline}><Input id={`${k}-h`} name="headline" defaultValue={def.headline} maxLength={200} /></Field>
      <Field label="Small line above the headline (optional)" htmlFor={`${k}-k`}><Input id={`${k}-k`} name="kicker" defaultValue={def.kicker ?? ""} maxLength={60} /></Field>
      <Field label="Supporting message" htmlFor={`${k}-m`} error={err.message}><Textarea id={`${k}-m`} name="message" rows={2} defaultValue={def.message} maxLength={400} /></Field>
      <Field label="Description (optional, shown on larger screens)" htmlFor={`${k}-d`}><Textarea id={`${k}-d`} name="description" rows={2} defaultValue={def.description ?? ""} maxLength={500} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button 1 text" htmlFor={`${k}-l1`} error={err.label1}><Input id={`${k}-l1`} name="label1" defaultValue={def.buttons[0]?.label ?? ""} maxLength={60} /></Field>
        <Field label="Button 1 link" htmlFor={`${k}-u1`} error={err.href1} hint="e.g. /events or https://…"><Input id={`${k}-u1`} name="href1" defaultValue={def.buttons[0]?.href ?? ""} /></Field>
        <Field label="Button 2 text (optional)" htmlFor={`${k}-l2`} error={err.label2}><Input id={`${k}-l2`} name="label2" defaultValue={def.buttons[1]?.label ?? ""} maxLength={60} /></Field>
        <Field label="Button 2 link" htmlFor={`${k}-u2`} error={err.href2}><Input id={`${k}-u2`} name="href2" defaultValue={def.buttons[1]?.href ?? ""} /></Field>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={def.enabled} className="size-4 accent-[var(--color-forest)]" />Show this banner</label>
        <SubmitButton size="sm" pendingText="Saving…">Save banner</SubmitButton>
      </div>
    </form>
  );
}
