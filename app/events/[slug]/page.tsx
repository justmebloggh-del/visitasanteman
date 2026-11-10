import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, Facts, Gallery, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { eventStatusLabels } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getEvent, getGallery } from "@/lib/content/public";
import { eventDateText, formatDate, mediaUrl, safeUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Not found" };
  return buildMetadata({ title: e.title, description: e.summary, path: `/events/${e.slug}`, image: e.cover, seoTitle: e.seo_title, seoDescription: e.seo_description, canonical: e.canonical_url, noindex: e.noindex });
}

const ldStatus: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled", cancelled: "https://schema.org/EventCancelled",
  postponed: "https://schema.org/EventPostponed", completed: "https://schema.org/EventScheduled",
};

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const gallery = await getGallery("event", e.id);
  const reg = safeUrl(e.registration_url);
  const hasCoords = e.latitude != null && e.longitude != null;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Event", name: e.title, description: e.summary ?? undefined,
        startDate: e.date_verified ? e.starts_at : undefined, endDate: e.date_verified ? e.ends_at ?? undefined : undefined, eventStatus: ldStatus[e.event_status],
        location: e.venue ? { "@type": "Place", name: e.venue } : undefined, image: mediaUrl(e.cover?.path) ?? undefined,
        organizer: e.organiser ? { "@type": "Organization", name: e.organiser } : undefined, url: `${SITE_URL}/events/${e.slug}`,
      }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Events", path: "/events" }, { name: e.title, path: `/events/${e.slug}` }])} />
      <div className="relative h-56 bg-forest sm:h-80">
        <Photo media={e.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: e.title }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{e.title}</h1>
          {e.event_status !== "scheduled" && <Badge tone="red" className="mt-2">{eventStatusLabels[e.event_status]}</Badge>}
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {e.summary && <p className="text-lg text-ink/90">{e.summary}</p>}
          <TextBlock title="About this event" text={e.description} />
          <Gallery images={gallery} />
          {hasCoords && <section><h2 className="mb-3 text-2xl font-semibold text-forest">Location</h2>
            <Map points={[{ id: e.id, kind: "event", title: e.title, href: `/events/${e.slug}`, lat: e.latitude!, lng: e.longitude! }]} center={[e.longitude!, e.latitude!]} zoom={14} /></section>}
        </div>
        <aside className="space-y-6">
          <Facts items={[
            { label: "Starts", value: eventDateText(e, true) }, { label: "Ends", value: e.date_verified && e.ends_at ? formatDate(e.ends_at, true) : null },
            { label: "Venue", value: e.venue }, { label: "Organiser", value: e.organiser }, { label: "Tickets", value: e.ticket_info },
            { label: "Contact", value: [e.contact_phone, e.contact_email].filter(Boolean).join("\n") || null },
          ]} />
          {reg && <ButtonLink href={reg} target="_blank" rel="noopener noreferrer" className="w-full">Register or get tickets</ButtonLink>}
        </aside>
      </Container>
    </>
  );
}
