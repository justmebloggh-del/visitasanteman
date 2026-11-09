import { AlertTriangle, Info } from "lucide-react";

export const accessLabels: Record<string, string> = {
  unknown: "Visitor access has not been confirmed",
  open_to_visitors: "Open to visitors",
  permission_required: "Permission or a permit is required",
  restricted_access: "Restricted access: not open to the general public",
  temporarily_unavailable: "Temporarily unavailable",
  permanently_closed: "Permanently closed",
  proposed: "Proposed or under development: not an existing visitor facility",
};

/** Says plainly whether visitors can actually go there. Open sites with nothing to add show nothing. */
export function AccessNotice({ status, notes, managedBy }: { status: string; notes?: string | null; managedBy?: string | null }) {
  if (status === "open_to_visitors" && !notes && !managedBy) return null;
  const warn = status !== "open_to_visitors";
  const Icon = warn ? AlertTriangle : Info;
  return (
    <section aria-label="Visitor access" className={`rounded-xl border p-4 text-sm ${warn ? "border-gold bg-gold-soft" : "border-line bg-mist"}`}>
      <p className="flex items-start gap-2 font-medium text-ink"><Icon className="mt-0.5 size-4 shrink-0" aria-hidden />{accessLabels[status] ?? accessLabels.unknown}</p>
      {notes && <p className="mt-2 whitespace-pre-line text-ink/90">{notes}</p>}
      {managedBy && <p className="mt-2 text-xs text-muted">Managed by: {managedBy}</p>}
    </section>
  );
}

export function SourceNote({ organisation, url, publishedAt, checkedAt }: { organisation?: string | null; url?: string | null; publishedAt?: string | null; checkedAt?: string | null }) {
  if (!organisation && !url) return null;
  const safe = url && /^https?:\/\//.test(url) ? url : null;
  return (
    <p className="rounded-xl bg-mist p-4 text-xs text-muted">
      <strong className="text-ink">Source:</strong> {organisation ?? "See link"}
      {safe && <> (<a href={safe} className="underline" rel="noopener noreferrer" target="_blank">link</a>)</>}
      {publishedAt && <>. Published {publishedAt}</>}
      {checkedAt && <>. Last checked {checkedAt}</>}.
    </p>
  );
}
