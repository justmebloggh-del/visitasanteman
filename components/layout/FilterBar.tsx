import Link from "next/link";
import { Search } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

export interface FilterDef {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

/** GET form, so filters are shareable URLs, work without JS and are fully server-rendered. */
export function FilterBar({ action, q, qLabel = "Search by name", filters = [], values, extra }: {
  action: string; q?: string; qLabel?: string; filters?: FilterDef[]; values: Record<string, string | undefined>;
  extra?: React.ReactNode;
}) {
  const active = Object.values(values).some(Boolean) || !!q;
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:flex lg:items-end">
      <div className="lg:flex-1">
        <label htmlFor="f-q" className="mb-1.5 block text-xs font-medium text-muted">{qLabel}</label>
        <Input id="f-q" name="q" type="search" defaultValue={q} placeholder="Search" />
      </div>
      {filters.map((f) => (
        <div key={f.name} className="lg:w-48">
          <label htmlFor={`f-${f.name}`} className="mb-1.5 block text-xs font-medium text-muted">{f.label}</label>
          <Select id={`f-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""}>
            <option value="">All</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      ))}
      {extra}
      <div className="flex gap-2">
        <Button type="submit"><Search className="size-4" aria-hidden />Apply</Button>
        {active && <Link href={action} className="inline-flex h-11 items-center px-3 text-sm text-muted hover:text-forest">Clear</Link>}
      </div>
    </form>
  );
}
