import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/ImportForm";
import { requireStaff } from "@/lib/auth/session";
import { templates } from "@/lib/import/csv";

export const metadata: Metadata = { title: "Import research records" };

export default async function ImportPage() {
  await requireStaff();
  return (
    <>
      <AdminHeader title="Import research records" intro="Bring researched places and communities in from a spreadsheet. Nothing is published automatically." />
      <div className="mb-6 rounded-2xl border border-line bg-white p-5 text-sm sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-forest">Templates</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {Object.entries(templates).map(([k, t]) => <li key={k}><Link className="text-lake-dark underline" href={`/admin/import/template/${k}`}>{t.label} template (CSV)</Link>: required columns {t.required.join(", ")}</li>)}
        </ul>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-muted">
          <li>Every row needs a source. Records are saved as drafts with “research identified”; a regional editor verifies and publishes them later.</li>
          <li>Rows that repeat an existing name or alternative spelling, or repeat inside the file, are skipped. Places within 200 m of an existing one are flagged.</li>
          <li>District, community and category are matched by name. A name that is not found is reported and the record is imported without it.</li>
          <li>Do not enter coordinates, hours, fees or contacts unless you have a reliable source for them.</li>
        </ul>
      </div>
      <ImportForm />
    </>
  );
}
