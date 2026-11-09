import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { buildMetadata } from "@/components/layout/seo";
import { Badge, Container } from "@/components/ui";
import { eventStatusLabels } from "@/config/site";
import { listAreas, listEvents, toPage } from "@/lib/content/public";
import { cn, formatDate } from "@/lib/utils";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({
  title: "Events and festivals in the Ashanti Region",
  description: "Festivals, cultural celebrations and tourism events across the Ashanti Region.",
  path: "/events",
});

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ view?: string; when?: string; month?: string; area?: string; page?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const now = new Date();
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const when = sp.when === "past" ? "past" : "upcoming";
  const [result, areas] = await Promise.all([
    listEvents(view === "calendar" ? { month, area: sp.area, limit: 100 } : { when, area: sp.area, page: toPage(sp.page) }),
    listAreas(),
  ]);

  return (
    <>
      <PageHeader title="Events and festivals" intro="What is happening across the Ashanti Region." crumbs={[{ label: "Events" }]} />
      <Container className="py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" role="group" aria-label="View">
            <Link href="/events" aria-current={view === "list"} className={cn("inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm", view === "list" ? "border-forest bg-forest text-white" : "border-line")}><List className="size-4" aria-hidden />List</Link>
            <Link href="/events?view=calendar" aria-current={view === "calendar"} className={cn("inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm", view === "calendar" ? "border-forest bg-forest text-white" : "border-line")}><CalendarDays className="size-4" aria-hidden />Calendar</Link>
          </div>
          {view === "list" && (
            <div className="flex gap-2 text-sm">
              <Link href="/events" className={cn("rounded-full px-3 py-1.5", when === "upcoming" ? "bg-forest-soft text-forest" : "text-muted")}>Upcoming</Link>
              <Link href="/events?when=past" className={cn("rounded-full px-3 py-1.5", when === "past" ? "bg-forest-soft text-forest" : "text-muted")}>Past</Link>
            </div>
          )}
        </div>

        {areas.length > 0 && (
          <form action="/events" className="mb-6 flex flex-wrap items-end gap-2">
            {view === "calendar" && <input type="hidden" name="view" value="calendar" />}
            {view === "list" && when === "past" && <input type="hidden" name="when" value="past" />}
            <div><label htmlFor="ev-area" className="mb-1.5 block text-xs font-medium text-muted">District</label>
              <select id="ev-area" name="area" defaultValue={sp.area ?? ""} className="h-11 rounded-lg border border-line bg-white px-3 text-sm">
                <option value="">All districts</option>
                {areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
              </select></div>
            <button type="submit" className="h-11 rounded-lg bg-forest px-4 text-sm font-medium text-white">Apply</button>
          </form>
        )}

        {view === "calendar" ? <Calendar month={month} events={result.items} /> : result.items.length === 0 ? (
          <EmptyState title={when === "past" ? "No past events" : "No upcoming events listed"} text="Events appear here once organisers have confirmed the details." />
        ) : (
          <ul className="space-y-4">
            {result.items.map((ev) => (
              <li key={ev.id}>
                <Link href={`/events/${ev.slug}`} className="flex gap-5 rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
                  <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-forest text-center text-white">
                    <div><div className="text-2xl font-semibold leading-none">{new Date(ev.starts_at).getUTCDate()}</div>
                      <div className="text-xs uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(ev.starts_at))}</div></div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl font-semibold text-forest">{ev.title}</h2>
                    <p className="mt-1 text-sm text-muted">{[formatDate(ev.starts_at, true), ev.venue].filter(Boolean).join(" · ")}</p>
                    {ev.summary && <p className="mt-2 line-clamp-2 text-sm text-ink/80">{ev.summary}</p>}
                    {ev.event_status !== "scheduled" && <Badge tone="red" className="mt-2">{eventStatusLabels[ev.event_status]}</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {view === "list" && <Pagination page={result.page} pageCount={result.pageCount} basePath="/events" params={{ when: when === "past" ? "past" : undefined, area: sp.area }} />}
      </Container>
    </>
  );
}

function Calendar({ month, events }: { month: string; events: Awaited<ReturnType<typeof listEvents>>["items"] }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const prev = new Date(Date.UTC(y, m - 2, 1)), next = new Date(Date.UTC(y, m, 1));
  const key = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const byDay = new Map<number, typeof events>();
  events.forEach((e) => { const d = new Date(e.starts_at).getUTCDate(); byDay.set(d, [...(byDay.get(d) ?? []), e]); });
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/events?view=calendar&month=${key(prev)}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-mist">Previous</Link>
        <h2 className="font-serif text-xl font-semibold text-forest">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}</h2>
        <Link href={`/events?view=calendar&month=${key(next)}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-mist">Next</Link>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-mist p-2 text-center font-medium text-muted">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className="min-h-20 bg-white p-1.5 sm:min-h-24">
            {d && <><div className="text-muted">{d}</div>
              {(byDay.get(d) ?? []).map((e) => <Link key={e.id} href={`/events/${e.slug}`} className="mt-1 block truncate rounded bg-forest-soft px-1.5 py-0.5 text-forest hover:bg-forest hover:text-white" title={e.title}>{e.title}</Link>)}</>}
          </div>
        ))}
      </div>
      {events.length === 0 && <p className="mt-4 text-sm text-muted">No events this month.</p>}
    </div>
  );
}
