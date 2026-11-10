import Link from "next/link";
import { MapPin } from "lucide-react";
import { EmployerBadge } from "@/components/jobs/EmployerBadge";
import { employmentTypes, type EmploymentType } from "@/config/jobs";
import { salaryText, type Vacancy } from "@/lib/jobs";

export function VacancyCard({ v }: { v: Vacancy }) {
  const pay = salaryText(v);
  return (
    <li className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-forest"><Link href={`/jobs/${v.slug}`} className="after:absolute after:inset-0 relative hover:underline">{v.title}</Link></h3>
        {v.employer && <EmployerBadge status={v.employer.verification_status} />}
      </div>
      <p className="mt-1 text-sm text-ink">{v.employer?.name}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>{employmentTypes[v.employment_type as EmploymentType] ?? v.employment_type}</span>
        {(v.area || v.location_note) && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{[v.location_note, v.area?.name].filter(Boolean).join(", ")}</span>}
        {pay && <span>{pay}</span>}
        {v.application_deadline && <span>Closes {new Date(v.application_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
      </p>
    </li>
  );
}
