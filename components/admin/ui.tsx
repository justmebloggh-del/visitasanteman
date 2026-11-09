import { Badge, Notice } from "@/components/ui";

export function AdminHeader({ title, intro, actions }: { title: string; intro?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold text-forest sm:text-3xl">{title}</h1>{intro && <p className="mt-1 text-sm text-muted">{intro}</p>}</div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

const tone = { published: "green", draft: "neutral", pending_review: "gold", archived: "red", new: "gold", read: "blue", replied: "green", closed: "neutral" } as const;
export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={tone[value as keyof typeof tone] ?? "neutral"}>{value.replace("_", " ")}</Badge>;
}

/** Flash messages driven by ?saved=1 style query params. */
export function Flash({ sp }: { sp: Record<string, string | undefined> }) {
  if (sp.saved) return <div className="mb-4"><Notice tone="success">Saved.</Notice></div>;
  if (sp.deleted) return <div className="mb-4"><Notice tone="success">Deleted.</Notice></div>;
  if (sp.error === "in-use") return <div className="mb-4"><Notice tone="error">That file is still used by content. Remove it from there first.</Notice></div>;
  if (sp.error) return <div className="mb-4"><Notice tone="error">That did not work. Please try again, or check you have permission.</Notice></div>;
  return null;
}
