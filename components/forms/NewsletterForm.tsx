"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/forms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Input } from "@/components/ui";
import type { FormState } from "@/lib/validations/forms";

export function NewsletterForm({ compact }: { compact?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(subscribeNewsletter, {});
  return (
    <form action={action} onReset={(e) => e.preventDefault()} noValidate>
      <label htmlFor={compact ? "nl-footer" : "nl-main"} className={compact ? "mb-1.5 block text-sm font-medium text-white" : "sr-only"}>
        Newsletter email
      </label>
      <div className="flex gap-2">
        <Input id={compact ? "nl-footer" : "nl-main"} name="email" type="email" autoComplete="email" placeholder="Your email address" required className="min-w-0 flex-1 text-ink" aria-invalid={!!state.errors?.email} />
        {/* honeypot */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <SubmitButton variant={compact ? "accent" : "primary"} pendingText="Joining…">Subscribe</SubmitButton>
      </div>
      {state.errors?.email && <p role="alert" className={`mt-1.5 text-xs font-medium ${compact ? "text-red-200" : "text-red-700"}`}>{state.errors.email}</p>}
      {state.message && (
        <p role="status" className={`mt-1.5 text-xs font-medium ${state.ok ? (compact ? "text-gold" : "text-forest") : compact ? "text-red-200" : "text-red-700"}`}>{state.message}</p>
      )}
    </form>
  );
}
