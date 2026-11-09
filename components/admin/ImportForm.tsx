"use client";

import { useActionState } from "react";
import { commitImport, previewImport, type ImportState } from "@/app/admin/import/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Field, Notice, Select } from "@/components/ui";
import { importable } from "@/lib/import/csv";

const targets = [["attractions", "Attractions and heritage sites"], ["communities", "Communities"]] as const;

export function ImportForm() {
  const [prev, previewAction] = useActionState<ImportState, FormData>(previewImport, {});
  const [done, commitAction] = useActionState<ImportState, FormData>(commitImport, {});
  const p = prev.preview;
  const ready = p ? importable(p).length : 0;

  return (
    <div className="space-y-8">
      <form action={previewAction} onReset={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-forest">1. Choose a file</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What are you importing?" htmlFor="target"><Select id="target" name="target" defaultValue="attractions">{targets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <Field label="CSV file" htmlFor="file" hint="Up to 1 MB and 500 rows. Columns are matched by heading, so use the template."><input id="file" name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm" /></Field>
        </div>
        {prev.message && !prev.ok && <Notice tone="error">{prev.message}</Notice>}
        <SubmitButton pendingText="Checking…">Check the file</SubmitButton>
      </form>

      {prev.ok && p && (
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-label="Preview">
          <h2 className="font-serif text-lg font-semibold text-forest">2. Review</h2>
          <p className="text-sm">{p.rows.length} rows read. <strong>{ready} can be imported</strong>, {p.rows.length - ready} will be skipped. Imported records are always saved as <strong>unpublished drafts</strong> marked “research identified”.</p>
          {p.unknownColumns.length > 0 && <Notice tone="info">Ignored columns: {p.unknownColumns.join(", ")}. Status and verification cannot be set from a file.</Notice>}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Result</th></tr></thead>
              <tbody className="divide-y divide-line">
                {p.rows.map((r) => (
                  <tr key={r.line} className="align-top">
                    <td className="px-3 py-2">{r.line}</td>
                    <td className="px-3 py-2 font-medium">{r.name || "(blank)"}</td>
                    <td className="px-3 py-2">
                      {r.errors.length > 0 ? <span className="text-red-700">Rejected: {r.errors.join("; ")}</span>
                        : r.duplicate ? <span className="text-amber-800">Skipped: {r.duplicate}</span>
                        : <span className="text-forest">Will import</span>}
                      {r.warnings.map((w) => <span key={w} className="block text-xs text-muted">Note: {w}</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ready > 0 && (
            <form action={commitAction} onReset={(e) => e.preventDefault()}>
              <input type="hidden" name="target" value={prev.target} />
              <input type="hidden" name="csv" value={prev.csv} />
              <SubmitButton pendingText="Importing…">Import {ready} {ready === 1 ? "record" : "records"} as drafts</SubmitButton>
            </form>
          )}
        </section>
      )}

      {done.message && (
        <div role="status" className="space-y-2">
          <Notice tone={done.ok ? "success" : "error"}>{done.message}{done.skipped ? ` ${done.skipped} skipped.` : ""}</Notice>
          {done.failed && done.failed.length > 0 && <ul className="list-disc pl-5 text-sm text-red-700">{done.failed.map((f) => <li key={f}>{f}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
