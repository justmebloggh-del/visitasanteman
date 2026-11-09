"use client";

import { useActionState } from "react";
import { createPlan, updatePlan } from "@/app/actions/planner";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Textarea } from "@/components/ui";
import { INTERESTS } from "@/lib/planner/recommend";
import type { PlanView } from "@/lib/planner/types";
import type { FormState } from "@/lib/validations/forms";

export function PlanForm({ plan }: { plan?: PlanView }) {
  const [state, action] = useActionState<FormState, FormData>(plan ? updatePlan.bind(null, plan.id) : createPlan, {});
  const e = state.errors ?? {};
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Plan name" htmlFor="title" error={e.title}><Input id="title" name="title" defaultValue={plan?.title ?? ""} placeholder="Weekend at the lake" required /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start date (optional)" htmlFor="start_date" error={e.start_date}><Input id="start_date" name="start_date" type="date" defaultValue={plan?.start_date ?? ""} /></Field>
        <Field label="Number of days" htmlFor="days" error={e.days}><Input id="days" name="days" type="number" min={1} max={30} defaultValue={plan?.days ?? 2} required /></Field>
        <Field label="Travellers" htmlFor="travellers" error={e.travellers}><Input id="travellers" name="travellers" type="number" min={1} max={100} defaultValue={plan?.travellers ?? 2} required /></Field>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium">Interests</legend>
        <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => (
          <label key={i.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-forest has-[:checked]:bg-forest-soft">
            <input type="checkbox" name="interests" value={i.id} defaultChecked={plan?.interests.includes(i.id)} className="size-4 accent-[var(--color-forest)]" />{i.label}</label>
        ))}</div></fieldset>
      <Field label="Notes (optional)" htmlFor="notes"><Textarea id="notes" name="notes" rows={3} defaultValue={plan?.notes ?? ""} /></Field>
      <SubmitButton pendingText="Saving…">{plan ? "Save details" : "Create plan"}</SubmitButton>
    </form>
  );
}
