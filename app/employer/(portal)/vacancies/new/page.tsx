import { redirect } from "next/navigation";
import { VacancyForm } from "@/components/jobs/VacancyForm";
import { getSessionUser } from "@/lib/auth/session";
import { listJobAreas, listJobCategories } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New vacancy" };

export default async function NewVacancy() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data: emp } = await supabase.from("employer_profiles").select("id,verification_status").eq("owner_id", user.id).maybeSingle();
  if (!emp || emp.verification_status === "suspended") redirect("/employer");
  const [categories, areas] = await Promise.all([listJobCategories(), listJobAreas()]);
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold text-forest">New vacancy</h1>
      <div className="rounded-2xl border border-line bg-white p-6"><VacancyForm id={null} categories={categories} areas={areas} /></div>
    </div>
  );
}
