import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { moveItem, moveToDay, removeItem, saveNote } from "@/app/actions/planner";
import { Badge, Button, Input, Select } from "@/components/ui";
import type { PlanView } from "@/lib/planner/types";

const typeLabel: Record<string, string> = { attraction: "Attraction", listing: "Place", experience: "Experience", event: "Event", community: "Community", custom: "Your item" };

export function PlanDays({ plan, editable }: { plan: PlanView; editable: boolean }) {
  const start = plan.start_date ? new Date(`${plan.start_date}T00:00:00Z`) : null;
  return (
    <div className="space-y-6">
      {Array.from({ length: plan.days }, (_, i) => i + 1).map((day) => {
        const items = plan.items.filter((it) => it.day === day);
        const date = start ? new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(start.getTime() + (day - 1) * 864e5)) : null;
        return (
          <section key={day} aria-labelledby={`day-${day}`} className="rounded-2xl border border-line bg-white p-5">
            <h2 id={`day-${day}`} className="font-serif text-xl font-semibold text-forest">Day {day}{date && <span className="ml-2 text-sm font-normal text-muted">{date}</span>}</h2>
            {items.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing planned yet.</p> : (
              <ol className="mt-3 divide-y divide-line">
                {items.map((it, idx) => (
                  <li key={it.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {it.unavailable ? <span className="text-muted line-through">No longer available</span> : it.href ? <Link href={it.href} className="text-forest hover:underline">{it.title}</Link> : it.title}
                          <Badge tone={it.unavailable ? "red" : "neutral"} className="ml-2">{it.unavailable ? "Removed from site" : typeLabel[it.item_type]}</Badge>
                        </p>
                        {!editable && it.note && <p className="mt-1 text-sm text-muted">{it.note}</p>}
                      </div>
                      {editable && (
                        <div className="no-print flex items-center gap-1">
                          <form action={moveItem.bind(null, plan.id, it.id, "up")}><Button size="sm" variant="ghost" disabled={idx === 0} aria-label={`Move ${it.title ?? "item"} up`}><ArrowUp className="size-4" /></Button></form>
                          <form action={moveItem.bind(null, plan.id, it.id, "down")}><Button size="sm" variant="ghost" disabled={idx === items.length - 1} aria-label={`Move ${it.title ?? "item"} down`}><ArrowDown className="size-4" /></Button></form>
                          <form action={removeItem.bind(null, plan.id, it.id)}><Button size="sm" variant="ghost" aria-label={`Remove ${it.title ?? "item"}`}><Trash2 className="size-4 text-red-700" /></Button></form>
                        </div>
                      )}
                    </div>
                    {editable && (
                      <div className="no-print mt-2 flex flex-wrap gap-2">
                        <form action={saveNote.bind(null, plan.id, it.id)} className="flex flex-1 gap-2">
                          <label className="sr-only" htmlFor={`note-${it.id}`}>Note for {it.title}</label>
                          <Input id={`note-${it.id}`} name="note" defaultValue={it.note ?? ""} placeholder="Add a note" maxLength={500} className="h-9" />
                          <Button size="sm" variant="outline">Save</Button>
                        </form>
                        {plan.days > 1 && (
                          <form action={moveToDay.bind(null, plan.id, it.id)} className="flex gap-2">
                            <label className="sr-only" htmlFor={`day-${it.id}`}>Move to day</label>
                            <Select id={`day-${it.id}`} name="day" defaultValue={String(day)} className="h-9 w-24">{Array.from({ length: plan.days }, (_, d) => <option key={d} value={d + 1}>Day {d + 1}</option>)}</Select>
                            <Button size="sm" variant="outline">Move</Button>
                          </form>
                        )}
                      </div>
                    )}
                    {!editable ? null : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
