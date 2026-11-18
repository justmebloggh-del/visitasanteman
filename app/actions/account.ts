"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";
import { zodErrors, type FormState } from "@/lib/validations/forms";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Please enter your name").max(120),
  phone: z.string().trim().max(40).regex(/^[0-9+()\s.-]*$/, "Use digits, spaces and + ( ) - only").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password"),
  new_password: z.string().min(10, "Use at least 10 characters").max(72),
});

async function me() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  return user;
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await me();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null }).eq("id", user.id);
  if (error) { console.error("[profile]", error.message); return { ok: false, message: "We could not save your details. Please try again." }; }
  return { ok: true, message: "Your details are saved." };
}

/** Asks for the current password first, so a borrowed signed-in browser cannot change it. */
export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await me();
  const parsed = passwordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!(await rateLimit("change-password", 6, 15 * 60_000))) return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: parsed.data.current_password });
  if (check.error) return { ok: false, errors: { current_password: "That is not your current password." } };
  if (parsed.data.new_password === parsed.data.current_password) return { ok: false, errors: { new_password: "Choose a different password." } };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) { console.error("[password]", error.message); return { ok: false, message: "We could not change your password. Please try again." }; }
  return { ok: true, message: "Your password has been changed." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Deletion is done by an administrator, so it is recorded as an enquiry that appears in the admin inbox. */
export async function requestAccountDeletion(_prev: FormState): Promise<FormState> {
  const user = await me();
  if (!(await rateLimit("delete-request", 3, 60 * 60_000))) return { ok: false, message: "We already have your request. Please allow some time." };
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("enquiries").insert({
    kind: "general", name: p?.full_name || user.email || "Account holder", email: user.email ?? "",
    message: "Please delete my account and the personal information linked to it.", details: { type: "account_deletion", user_id: user.id },
  });
  if (error) { console.error("[delete request]", error.message); return { ok: false, message: "We could not send your request. Please try again." }; }
  return { ok: true, message: "Your request has been sent. We will confirm by email once your account is deleted." };
}
