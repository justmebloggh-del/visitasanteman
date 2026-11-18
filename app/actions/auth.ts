"use server";

import { redirect } from "next/navigation";
import { SITE_URL, supabaseConfigured } from "@/lib/env";
import { getSessionUser, isStaff, canManageMedia } from "@/lib/auth/session";
import { landingPath } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  forgotSchema, loginSchema, registerSchema, resetSchema, zodErrors, type FormState,
} from "@/lib/validations/forms";

const NOT_CONFIGURED: FormState = { ok: false, message: "Sign-in is not available yet because the service is not configured." };

/** The Cloudflare Turnstile token, when the form carried one. Supabase checks it only if CAPTCHA is switched on for the project. */
const captchaToken = (fd: FormData) => String(fd.get("cf-turnstile-response") ?? "").slice(0, 4096) || undefined;

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
  const { error } = await supabase.auth.signInWithPassword({ ...parsed.data, options: { captchaToken: captchaToken(formData) } });
  if (error) {
    // Do not reveal whether the account exists.
    // A CAPTCHA switched on in the Supabase dashboard rejects every sign-in that carries no CAPTCHA token (this site sends none).
    // Say so plainly instead of blaming the password.
    if (error.code === "captcha_failed" || /captcha/i.test(error.message)) {
      console.error("[login] blocked by Supabase CAPTCHA protection:", error.message);
      return { ok: false, message: "The security check did not complete. Please wait for the check to finish, then try again." };
    }
    console.error("[login] rejected:", error.code ?? error.status, error.message);
    const unconfirmed = /confirm/i.test(error.message);
    return { ok: false, message: unconfirmed ? "Please verify your email address first. Check your inbox, or ask for a new link on the Check your inbox page." : "Incorrect email or password." };
  }
  // No specific page requested: staff go straight to the admin dashboard.
  const target = safeNext(formData.get("next"), "");
  const user = await getSessionUser();
  const hasAdminAccess = !!user && (isStaff(user.role) || canManageMedia(user.role));
  // Signed in, but the account is not an administrator: say so here, instead of bouncing to the homepage with no explanation.
  if (target.startsWith("/admin") && !hasAdminAccess) {
    return { ok: false, message: "You are signed in, but this account does not have administrator access yet. A super administrator must give it the admin role." };
  }
  if (target) redirect(target);
  redirect(landingPath(user?.role));
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("register", 5, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };

  const supabase = await createClient();
  const { data: created, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // Role is NOT sent from here; the database trigger always assigns 'visitor'.
    options: { data: { full_name: parsed.data.full_name }, emailRedirectTo: `${SITE_URL}/auth/callback`, captchaToken: captchaToken(formData) },
  });
  if (error) {
    console.error("[register]", error.message);
    return { ok: false, message: "We could not create that account. If you already have one, try logging in." };
  }
  // With email confirmation switched off Supabase signs the new account in at once; otherwise they must open the emailed link first.
  redirect(created.session ? "/account" : "/verify-email");
}

/** Sends the verification email again. The answer is the same whether or not the address has an account. */
export async function resendVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("resend-verify", 4, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data.email, options: { emailRedirectTo: `${SITE_URL}/auth/callback`, captchaToken: captchaToken(formData) } });
  if (error) console.error("[resend]", error.message);
  return { ok: true, message: "If that address has an account waiting to be verified, a new link is on its way." };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!(await rateLimit("reset", 4, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    captchaToken: captchaToken(formData),
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
