import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, Users } from "lucide-react";
import { BookingForm } from "@/components/bookings/BookingForm";
import { Reviews } from "@/components/bookings/Reviews";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Breadcrumbs, Facts, Gallery, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Badge, ButtonLink, Container, Notice } from "@/components/ui";
import { experienceCategoryLabels } from "@/config/site";
import { getExperience, getGallery, getReviews } from "@/lib/content/public";
import { formatDuration, formatPrice, whatsappLink } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getExperience((await params).slug);
  if (!e) return { title: "Not found" };
  return buildMetadata({ title: e.title, description: e.summary, path: `/experiences/${e.slug}`, image: e.cover, seoTitle: e.seo_title, seoDescription: e.seo_description, canonical: e.canonical_url, noindex: e.noindex });
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getExperience((await params).slug);
  if (!e) notFound();
  const [gallery, reviews] = await Promise.all([getGallery("experience", e.id), getReviews({ experienceId: e.id })]);
  const wa = whatsappLink(e.provider?.whatsapp, `Hello, I would like to ask about ${e.title}.`);
  const hasCoords = e.latitude != null && e.longitude != null;
  const participants = e.min_participants || e.max_participants
    ? [e.min_participants && `min ${e.min_participants}`, e.max_participants && `max ${e.max_participants}`].filter(Boolean).join(", ") : null;

  return (
    <>
      {reviews.count > 0 && <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: e.title, aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count } }} />}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Experiences", path: "/experiences" }, { name: e.title, path: `/experiences/${e.slug}` }])} />
      <div className="relative h-60 bg-forest sm:h-96">
        <Photo media={e.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Experiences", href: "/experiences" }, { label: e.title }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{e.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="blue">{experienceCategoryLabels[e.category]}</Badge>
            {e.duration_minutes && <span className="inline-flex items-center gap-1"><Clock className="size-4" aria-hidden />{formatDuration(e.duration_minutes)}</span>}
            {participants && <span className="inline-flex items-center gap-1"><Users className="size-4" aria-hidden />{participants}</span>}
          </p>
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {!e.provider_verified && <Notice tone="info">The provider has not yet confirmed availability for this experience. Send a request and we will check with them before anything is confirmed.</Notice>}
          {e.summary && <p className="text-lg text-ink/90">{e.summary}</p>}
          <TextBlock title="About this experience" text={e.description} />
          <TextBlock title="Safety requirements" text={e.safety_requirements} />
          <TextBlock title="Cancellation conditions" text={e.cancellation_policy} />
          <Gallery images={gallery} />
          <Reviews {...reviews} />
          {hasCoords && (
            <section><h2 className="mb-3 text-2xl font-semibold text-forest">Meeting point</h2>
              <Map points={[{ id: e.id, kind: "experience", title: e.title, href: `/experiences/${e.slug}`, lat: e.latitude!, lng: e.longitude! }]} center={[e.longitude!, e.latitude!]} zoom={14} /></section>
          )}
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            {e.price_from != null && <p className="mb-3 text-2xl font-semibold text-forest">From {formatPrice(e.price_from, e.price_currency)}{e.price_unit && <span className="ml-1 text-sm font-normal text-muted">{e.price_unit}</span>}</p>}
            {e.provider && <p className="mb-3 text-sm text-muted">Provided by <Link href={`/business/${e.provider.slug}`} className="font-medium text-lake-dark hover:underline">{e.provider.name}</Link>{e.provider_verified && <BadgeCheck className="ml-1 inline size-4 text-forest" aria-label="Confirmed by provider" />}</p>}
            <div className="flex flex-col gap-2">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-full bg-[#1f8f4e] px-5 text-sm font-medium text-white hover:brightness-95">WhatsApp the provider</a>}
              {e.provider?.phone && <ButtonLink href={`tel:${e.provider.phone.replace(/\s/g, "")}`} variant="outline">{e.provider.phone}</ButtonLink>}
            </div>
          </div>
          <Facts items={[{ label: "Meeting point", value: e.meeting_point }, { label: "Duration", value: formatDuration(e.duration_minutes) }, { label: "Group size", value: participants }]} />
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-forest">Send a booking request</h2>
            <BookingForm kind="experience" experienceId={e.id} minGuests={e.min_participants} maxGuests={e.max_participants} />
            <details className="mt-5 border-t border-line pt-4 text-sm"><summary className="cursor-pointer font-medium text-lake-dark">Just have a question?</summary>
              <div className="mt-3"><EnquiryForm kind="experience" lockKind experienceId={e.id} subject={e.title} /></div></details>
          </div>
        </aside>
      </Container>
    </>
  );
}
