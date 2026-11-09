import Link from "next/link";
import { EmptyState, PageHeader, Pagination } from "@/components/layout/blocks";
import { Badge, Container } from "@/components/ui";
import { eventStatusLabels } from "@/config/site";
import { listEvents, toPage } from "@/lib/content/public";
import { formatDate } from "@/lib/utils";

/** Upcoming events of one category (sports, education). Only organiser-confirmed events are published, so nothing is invented. */
export async function CategoryEvents({ category, title, intro, base, crumbs, page }: {
  category: string; title: string; intro: string; base: string; crumbs: { label: string; href?: string }[]; page?: string;
}) {
  const result = await listEvents({ when: "upcoming", category, page: toPage(page) });
  return (
    <>
      <PageHeader title={title} intro={intro} crumbs={crumbs} />
      <Container className="py-10">
        {result.items.length === 0 ? (
          <EmptyState title="No upcoming events listed" text="Events appear here once organisers have confirmed the details. Fixtures and results need an authorised data source and are not listed." />
        ) : (
          <ul className="space-y-4">
            {result.items.map((ev) => (
              <li key={ev.id}>
                <Link href={`/events/${ev.slug}`} className="flex gap-5 rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
                  <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-forest text-center text-white">
                    <div><div className="text-xl font-semibold leading-none">{new Date(ev.starts_at).getUTCDate()}</div>
                      <div className="text-xs uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(ev.starts_at))}</div></div>
                  </div>
                  <div><h2 className="font-serif text-lg font-semibold text-forest">{ev.title}</h2>
                    <p className="mt-1 text-sm text-muted">{[ev.venue, formatDate(ev.starts_at)].filter(Boolean).join(" · ")}</p>
                    {ev.event_status !== "scheduled" && <Badge tone="gold" className="mt-2">{eventStatusLabels[ev.event_status]}</Badge>}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath={base} params={{}} />
      </Container>
    </>
  );
}
