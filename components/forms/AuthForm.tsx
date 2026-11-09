"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Input, Notice } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

type Mode = "login" | "register" | "forgot" | "reset";
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

const copy: Record<Mode, { cta: string; pending: string }> = {
  login: { cta: "Log in", pending: "Logging in…" },
  register: { cta: "Create account", pending: "Creating account…" },
  forgot: { cta: "Send reset link", pending: "Sending…" },
  reset: { cta: "Set new password", pending: "Saving…" },
};

export function AuthForm({ mode, action, next }: { mode: Mode; action: Action; next?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const err = state.errors ?? {};
  if (state.ok && state.message) return <Notice tone="success">{state.message}</Notice>;

  return (
    <form action={formAction} onReset={(e) => e.preventDefault()} noValidate className="space-y-4">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" && (
        <Field label="Full name" htmlFor="full_name" error={err.full_name}>
          <Input id="full_name" name="full_name" autoComplete="name" required aria-invalid={!!err.full_name} />
        </Field>
      )}
      {mode !== "reset" && (
        <Field label="Email" htmlFor="email" error={err.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!err.email} />
        </Field>
      )}
      {mode !== "forgot" && (
        <Field label={mode === "reset" ? "New password" : "Password"} htmlFor="password" error={err.password} hint={mode === "login" ? undefined : "At least 8 characters."}>
          <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required aria-invalid={!!err.password} />
        </Field>
      )}
      <SubmitButton className="w-full" pendingText={copy[mode].pending}>{copy[mode].cta}</SubmitButton>
    </form>
  );
}
