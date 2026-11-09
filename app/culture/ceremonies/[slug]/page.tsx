import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Facts, Photo, TextBlock } from "@/components/layout/blocks";
import { breadcrumbLd, buildMetadata, JsonLd } from "@/components/layout/seo";
import { AttendanceNotice, ceremonyWhen } from "@/components/listings/CeremonyBits";
import { SourceNote } from "@/components/listings/AccessNotice";
import { ButtonLink, Container } from "@/components/ui";
import { ceremonyKindLabels } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getCeremony } from "@/lib/content/public";
import { safeUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCeremony((await params).slug);
  if (!c) return { title: "Not found" };
  return buildMetadata({ title: c.name, description: c.summary, path: `/culture/ceremonies/${c.slug}`, image: c.cover, seoTitle: c.seo_title, seoDescription: c.seo_description, canonical: c.canonical_url, noindex: c.noindex });
}

export default async function CeremonyPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCeremony((await params).slug);
  if (!c) notFound();
  const when = ceremonyWhen(c);
  const url = `${SITE_URL}/culture/ceremonies/${c.slug}`;
  const announce = safeUrl(c.official_announcement_url);
  const open = c.attendance === "public" || c.attendance === "public_with_conditions";
  const share = (base: string) => `${base}${encodeURIComponent(url)}`;

  return (
    <>
      {/* Event structured data only when a confirmed date exists and the public may attend. */}
      {when && open && c.starts_at && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Event", name: c.name, startDate: c.starts_at, endDate: c.ends_at ?? undefined, description: c.summary ?? undefined, url, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode" }} />
      )}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Culture & Heritage", path: "/culture" }, { name: "Ceremonies", path: "/culture/ceremonies" }, { name: c.name, path: `/culture/ceremonies/${c.slug}` }])} />
      <div className="relative h-56 bg-forest sm:h-72">
        <Photo media={c.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: "Ceremonies", href: "/culture/ceremonies" }, { label: c.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{c.name}</h1>
          <p className="mt-1 text-sm text-white/80">{ceremonyKindLabels[c.kind]}</p>
        </Container>
      </div>
      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <AttendanceNotice attendance={c.attendance} notes={c.attendance_notes} />
          {c.summary && <p className="text-lg text-ink/90">{c.summary}</p>}
          <section aria-label="Date">
            <h2 className="mb-2 text-2xl font-semibold text-forest">Date and time</h2>
            {when ? (
              <p className="text-ink/90"><strong>{when.date}</strong>{when.time && <> at {when.time}</>} (Ghana time). Confirmed with the organisers; check the official announcement before you travel.</p>
            ) : (
              <p className="text-muted">The date for this year has not been confirmed. Traditional dates are announced by the organisers and do not follow fixed calendar dates.{c.date_note && <> {c.date_note}</>}</p>
            )}
            {when && c.starts_at && <ButtonLink href={`/culture/ceremonies/${c.slug}/calendar.ics`} variant="outline" className="mt-3">Add to my calendar (.ics)</ButtonLink>}
          </section>
          <TextBlock title="Significance" text={c.significance} />
          <TextBlock title="Visitor etiquette" text={c.etiquette} />
          <TextBlock title="Dress guidance" text={c.dress_guidance} />
          <TextBlock title="Photography and recording" text={c.photography_rules} />
          <SourceNote organisation={c.source_organisation} url={c.source_url} publishedAt={c.source_published_at} checkedAt={c.researched_at} />
        </div>
        <aside className="space-y-6">
          <Facts items={[
            { label: "Traditional area", value: c.traditional_area?.name },
            { label: "Community", value: c.community?.name },
            { label: "Organiser", value: c.organiser },
            { label: "Phone", value: c.contact_phone },
            { label: "Email", value: c.contact_email },
          ]} />
          {c.area && <p className="text-sm">District: <Link href={`/districts/${c.area.slug}`} className="text-lake-dark underline">{c.area.name}</Link></p>}
          {announce && <p className="text-sm"><a href={announce} className="text-lake-dark underline" target="_blank" rel="noopener noreferrer">Official announcement</a></p>}
          <p className="text-sm">Share: <a className="text-lake-dark underline" target="_blank" rel="noopener noreferrer" href={share("https://wa.me/?text=")}>WhatsApp</a> · <a className="text-lake-dark underline" target="_blank" rel="noopener noreferrer" href={share("https://www.facebook.com/sharer/sharer.php?u=")}>Facebook</a></p>
          <p className="text-sm text-muted">Looking for somewhere to stay? See <Link href={c.area ? `/accommodation?area=${c.area.slug}` : "/accommodation"} className="text-lake-dark underline">accommodation{c.area ? ` in ${c.area.name}` : ""}</Link>.</p>
        </aside>
      </Container>
    </>
  );
}
