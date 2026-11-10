"use client";

import { useActionState } from "react";
import { saveEmployer } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export interface EmployerValues { name?: string; description?: string | null; website?: string | null; administrative_area_id?: string | null }

export function EmployerForm({ values, areas }: { values?: EmployerValues; areas: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveEmployer, {});
  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <Field label="Organisation name" htmlFor="name" error={err.name}><Input id="name" name="name" required defaultValue={values?.name} aria-invalid={!!err.name} /></Field>
      <Field label="About your organisation" htmlFor="description" error={err.description}><Textarea id="description" name="description" rows={4} defaultValue={values?.description ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website (optional)" htmlFor="website" error={err.website}><Input id="website" name="website" type="url" placeholder="https://" defaultValue={values?.website ?? ""} /></Field>
        <Field label="District (optional)" htmlFor="administrative_area_id">
          <Select id="administrative_area_id" name="administrative_area_id" defaultValue={values?.administrative_area_id ?? ""}>
            <option value="">Not specified</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
      </div>
      <SubmitButton pendingText="Saving…">{values?.name ? "Save profile" : "Create employer profile"}</SubmitButton>
    </form>
  );
}
