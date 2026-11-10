"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EMPLOYER_SETTABLE } from "@/config/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/utils/rate-limit";
import { zodErrors, type FormState } from "@/lib/validations/forms";
import { applicationSchema, checkCv, employerSchema, reportSchema, vacancySchema } from "@/lib/validations/jobs";

const GENERIC: FormState = { ok: false, message: "Could not save. Please try again." };
const suffix = () => randomBytes(3).toString("hex");
const val = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v : ""; };
const blank = <T,>(v: T | "" | undefined): T | null => (v === "" || v === undefined ? null : v);

async function signedIn(next: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/* ───────────── Employer profile ───────────── */
export async function saveEmployer(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await signedIn("/employer");
  const parsed = employerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  if (!supabaseConfigured) return { ok: false, message: "Jobs are not available yet." };
  const d = parsed.data;
  const supabase = await createClient();
  const fields = { name: d.name, description: blank(d.description), website: blank(d.website), administrative_area_id: d.administrative_area_id ?? null };
  const { data: existing } = await supabase.from("employer_profiles").select("id").eq("owner_id", user.id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("employer_profiles").update(fields).eq("id", existing.id);
    if (error) { console.error("[employer update]", error.message); return GENERIC; }
  } else {
    if (!(await rateLimit("employer-create", 5, 60 * 60_000))) return { ok: false, message: "Too many attempts. Please try again later." };
    const { error } = await supabase.from("employer_profiles").insert({ ...fields, owner_id: user.id, slug: `${slugify(d.name) || "employer"}-${suffix()}` });
    if (error) {
      console.error("[employer create]", error.message);
      return { ok: false, message: /row-level security|policy/i.test(error.message) ? "Please verify your email address first, then try again." : GENERIC.message };
    }
  }
  revalidatePath("/employer");
  return { ok: true, message: "Saved." };
}

export async function requestEmployerVerification(): Promise<void> {
  await signedIn("/employer");
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const { error } = await supabase.from("employer_profiles").update({ verification_status: "pending", verification_requested_at: new Date().toISOString() })
    .eq("owner_id", me.user!.id).eq("verification_status", "unverified");
  if (error) console.error("[employer verify request]", error.message);
  revalidatePath("/employer");
}

/* ───────────── Vacancies ───────────── */
export async function saveVacancy(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await signedIn("/employer");
  const parsed = vacancySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: zodErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const { data: emp } = await supabase.from("employer_profiles").select("id,verification_status").eq("owner_id", user.id).maybeSingle();
  if (!emp) return { ok: false, message: "Create your employer profile first." };
  if (emp.verification_status === "suspended") return { ok: false, message: "This employer account is suspended." };

  const submit = fd.get("intent") === "submit";
  const fields = {
    title: d.title, employment_type: d.employment_type, category_id: d.category_id ?? null, administrative_area_id: d.administrative_area_id ?? null,
    location_note: blank(d.location_note), description: d.description, requirements: blank(d.requirements), qualifications: blank(d.qualifications),
    experience_required: blank(d.experience_required), salary_min: d.salary_min ?? null, salary_max: d.salary_max ?? null,
    salary_period: d.salary_min != null || d.salary_max != null ? blank(d.salary_period) : null, application_deadline: blank(d.application_deadline),
  };
  if (id) {
    const { data: cur } = await supabase.from("job_vacancies").select("status").eq("id", id).eq("employer_id", emp.id).maybeSingle();
    if (!cur) return { ok: false, message: "Vacancy not found." };
    // Editing a published vacancy sends it back for review, so approved content is never silently changed.
    const status = submit || cur.status === "published" || cur.status === "approved" ? "pending_review" : cur.status;
    const { error } = await supabase.from("job_vacancies").update({ ...fields, status }).eq("id", id).eq("employer_id", emp.id);
    if (error) { console.error("[vacancy update]", error.message); return GENERIC; }
    revalidatePath("/employer");
    return { ok: true, message: status === "pending_review" ? "Saved and sent for review." : "Draft saved." };
  }
  if (!(await rateLimit("vacancy-create", 20, 60 * 60_000))) return { ok: false, message: "Too many vacancies created. Please try again later." };
  const { data: row, error } = await supabase.from("job_vacancies")
    .insert({ ...fields, employer_id: emp.id, slug: `${slugify(d.title) || "job"}-${suffix()}`, status: submit ? "pending_review" : "draft" }).select("id").single();
  if (error || !row) { console.error("[vacancy create]", error?.message); return GENERIC; }
  redirect(`/employer/vacancies/${row.id}`);
}

export async function closeVacancy(id: string, filled: boolean): Promise<void> {
  await signedIn("/employer");
  const supabase = await createClient();
  const { error } = await supabase.from("job_vacancies").update(filled ? { is_filled: true } : { status: "archived" }).eq("id", id);
  if (error) console.error("[vacancy close]", error.message);
  revalidatePath("/employer");
  revalidatePath(`/employer/vacancies/${id}`);
}

/* ───────────── Applications ───────────── */
export async function applyToVacancy(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true, message: "Application sent." };           // honeypot: pretend success, store nothing
  const user = await signedIn(`/jobs`);
  if (!(await rateLimit("job-apply", 15, 60 * 60_000))) return { ok: false, message: "Too many applications. Please try again later." };
  const supabase = await createClient();

  let cvPath: string | null = null;
  const file = fd.get("cv");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkCv(file.name, file.size, bytes.slice(0, 8));
    if (!check.ok) return { ok: false, errors: { cv: check.message } };
    cvPath = `${user.id}/${d.vacancy_id}-${suffix()}.${check.ext}`;
    const { error: upErr } = await supabase.storage.from("cvs").upload(cvPath, bytes, {
      contentType: check.ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert: false,
    });
    if (upErr) { console.error("[cv upload]", upErr.message); return { ok: false, message: "Your CV could not be uploaded. Please try again." }; }
  }
  const { error } = await supabase.from("job_applications").insert({
    vacancy_id: d.vacancy_id, applicant_id: user.id, applicant_name: d.applicant_name, applicant_phone: blank(d.applicant_phone),
    cover_note: blank(d.cover_note), cv_path: cvPath,
  });
  if (error) {
    if (cvPath) await supabase.storage.from("cvs").remove([cvPath]);
    const msg = error.message;
    if (/duplicate|unique/i.test(msg)) return { ok: false, message: "You have already applied for this vacancy." };
    if (/not open|own vacancy/i.test(msg)) return { ok: false, message: msg.replace(/^.*?:\s*/, "") };
    if (/row-level security|policy/i.test(msg)) return { ok: false, message: "Please verify your email address before applying." };
    console.error("[apply]", msg);
    return GENERIC;
  }
  revalidatePath("/account/applications");
  return { ok: true, message: "Application sent. You can follow its progress under My applications." };
}

export async function withdrawApplication(id: string): Promise<void> {
  await signedIn("/account/applications");
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").update({ status: "withdrawn" }).eq("id", id);
  if (error) console.error("[withdraw]", error.message);
  revalidatePath("/account/applications");
}

/** Removes the application and its CV file: the applicant controls their data. */
export async function deleteApplication(id: string): Promise<void> {
  await signedIn("/account/applications");
  const supabase = await createClient();
  const { data } = await supabase.from("job_applications").select("cv_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("job_applications").delete().eq("id", id);
  if (error) { console.error("[delete application]", error.message); return; }
  if (data?.cv_path) await supabase.storage.from("cvs").remove([data.cv_path]);
  revalidatePath("/account/applications");
}

export async function setApplicationStatus(id: string, vacancyId: string, fd: FormData): Promise<void> {
  await signedIn("/employer");
  const status = val(fd, "status");
  if (!(EMPLOYER_SETTABLE as readonly string[]).includes(status)) return;
  const interview = val(fd, "interview_at");
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").update({
    status, interview_at: status === "interview" && interview ? new Date(interview).toISOString() : null,
  }).eq("id", id).neq("status", "withdrawn");
  if (error) console.error("[application status]", error.message);
  revalidatePath(`/employer/vacancies/${vacancyId}`);
}

/* ───────────── Saved jobs and reports ───────────── */
export async function toggleSavedJob(vacancyId: string, slug: string): Promise<void> {
  const user = await signedIn(`/jobs/${slug}`);
  const supabase = await createClient();
  const { data } = await supabase.from("saved_jobs").select("vacancy_id").eq("vacancy_id", vacancyId).eq("user_id", user.id).maybeSingle();
  if (data) await supabase.from("saved_jobs").delete().eq("vacancy_id", vacancyId).eq("user_id", user.id);
  else await supabase.from("saved_jobs").insert({ vacancy_id: vacancyId, user_id: user.id });
  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/account/applications");
}

export async function reportVacancy(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const user = await signedIn(`/jobs`);
  if (!(await rateLimit("job-report", 10, 60 * 60_000))) return { ok: false, message: "Too many reports. Please try again later." };
  const supabase = await createClient();
  const { error } = await supabase.from("job_reports").insert({ vacancy_id: parsed.data.vacancy_id, reporter_id: user.id, reason: parsed.data.reason, details: blank(parsed.data.details) });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return { ok: true, message: "Thank you. You have already reported this vacancy and our team will review it." };
    console.error("[report]", error.message);
    return GENERIC;
  }
  return { ok: true, message: "Thank you. Our team will review this vacancy." };
}
