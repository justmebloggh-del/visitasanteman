"use server";

import { redirect } from "next/navigation";
import { SITE_URL, supabaseConfigured } from "@/lib/env";
import { canManageMedia, getSessionUser, isStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  forgotSchema, loginSchema, registerSchema, resetSchema, zodErrors, type FormState,
} from "@/lib/validations/forms";

const NOT_CONFIGURED: FormState = { ok: false, message: "Sign-in is not available yet because the service is not configured." };

/** Only allow same-site relative redirects (prevents open redirects). */
function safeNext(next: FormDataEntryValue | null, fallback = "/"): string {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("login", 8, 10 * 60_000))) return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Do not reveal whether the account exists.
    const unconfirmed = /confirm/i.test(error.message);
    return { ok: false, message: unconfirmed ? "Please verify your email address first. Check your inbox." : "Incorrect email or password." };
  }
  // No specific page requested: staff go straight to the admin dashboard.
  const target = safeNext(formData.get("next"), "");
  if (target) redirect(target);
  const user = await getSessionUser();
  redirect(user && (isStaff(user.role) || canManageMedia(user.role)) ? "/admin" : "/");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("register", 5, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // Role is NOT sent from here; the database trigger always assigns 'visitor'.
    options: { data: { full_name: parsed.data.full_name }, emailRedirectTo: `${SITE_URL}/auth/callback` },
  });
  if (error) {
    console.error("[register]", error.message);
    return { ok: false, message: "We could not create that account. If you already have one, try logging in." };
  }
  redirect("/verify-email");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("reset", 4, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });
  if (error) console.error("[reset]", error.message);
  // Same answer either way so accounts cannot be enumerated.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "This reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: "We could not update your password. Please request a new link." };
  redirect("/login?reset=1");
}
