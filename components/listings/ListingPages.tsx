import { notFound } from "next/navigation";
import { BadgeCheck, Globe, Mail, MessageCircle, Navigation, Phone } from "lucide-react";
import { ViewPing } from "@/components/listings/ViewPing";
import { AdSlot } from "@/components/ads/AdSlot";
import { BookingForm } from "@/components/bookings/BookingForm";
import { Reviews } from "@/components/bookings/Reviews";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Breadcrumbs, CardGrid, ContentCard, EmptyState, Facts, Gallery, PageHeader, Pagination, Photo, TextBlock } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { breadcrumbLd, JsonLd } from "@/components/layout/seo";
import { Map } from "@/components/maps/Map";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { listingTypeLabels, type ListingType } from "@/config/site";
import { SITE_URL } from "@/lib/env";
import { getGallery, getListing, getMenuItems, getReviews, getRoomTypes, listCommunities, listListings, toPage } from "@/lib/content/public";
import { directionsLink, formatPrice, mediaUrl, safeUrl, whatsappLink } from "@/lib/utils";
import type { Listing } from "@/types/content";

export interface Group {
  base: string;            // index route, e.g. "accommodation"
  detail: string;          // detail route base, e.g. "accommodation" or "business"
  title: string;
  intro: string;
  types: ListingType[];
  noun: string;            // "place to stay"
  emptyText: string;
  withPrice?: boolean;
}

export async function ListingIndex({ group, searchParams }: {
  group: Group; searchParams: { q?: string; type?: string; community?: string; max?: string; page?: string };
}) {
  const page = toPage(searchParams.page);
  const maxPrice = Number(searchParams.max) > 0 ? Number(searchParams.max) : undefined;
  const [result, communities] = await Promise.all([
    listListings(group.types, { q: searchParams.q, type: searchParams.type, community: searchParams.community, maxPrice, page }),
    listCommunities(),
  ]);
  const filters = [
    ...(group.types.length > 1 ? [{ name: "type", label: "Type", options: group.types.map((t) => ({ value: t, label: listingTypeLabels[t] })) }] : []),
    { name: "community", label: "Community", options: communities.map((c) => ({ value: c.slug, label: c.name })) },
  ];
  const filtered = !!(searchParams.q || searchParams.type || searchParams.community || maxPrice);

  return (
    <>
      <PageHeader title={group.title} intro={group.intro} crumbs={[{ label: group.title }]} />
      <AdSlot placement="directory_top" />
      <Container className="py-10">
        <FilterBar
          action={`/${group.base}`} q={searchParams.q} filters={filters}
          values={{ type: searchParams.type, community: searchParams.community, max: searchParams.max }}
          extra={group.withPrice ? (
            <div className="lg:w-40">
              <label htmlFor="f-max" className="mb-1.5 block text-xs font-medium text-muted">Max price (GHS)</label>
              <input id="f-max" name="max" type="number" min={1} defaultValue={searchParams.max} className="h-11 w-full rounded-lg border border-line px-3.5 text-sm" />
            </div>
          ) : null}
        />
        <p className="mb-6 mt-6 text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "result" : "results"}</p>
        {result.items.length === 0 ? (
          <EmptyState title={filtered ? "Nothing matches those filters" : `No ${group.noun}s listed yet`}
            text={filtered ? "Try removing a filter or searching a different name." : group.emptyText}
            action={filtered ? { href: `/${group.base}`, label: "Clear filters" } : { href: "/contact?kind=business_listing", label: "List your business" }} />
        ) : (
          <CardGrid>
            {result.items.map((l) => (
              <ContentCard key={l.id} href={`/${group.detail}/${l.slug}`} title={l.name} summary={l.summary} media={l.cover}
                meta={[listingTypeLabels[l.type as ListingType], l.community?.name, l.price_from != null && group.withPrice ? `From ${formatPrice(l.price_from, l.price_currency)}` : null].filter(Boolean).join(" · ")}
                badge={l.is_verified ? "Verified" : null} />
            ))}
          </CardGrid>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath={`/${group.base}`}
          params={{ q: searchParams.q, type: searchParams.type, community: searchParams.community, max: searchParams.max }} />
      </Container>
    </>
  );
}

const ldType = (t: string) =>
  ["hotel", "resort", "guesthouse", "lodge", "eco_lodge"].includes(t) ? "Hotel" : t === "restaurant" ? "Restaurant" : "LocalBusiness";

export async function ListingDetail({ group, slug }: { group: Group; slug: string }) {
  const listing = await getListing(slug);
  if (!listing || !group.types.includes(listing.type as ListingType)) notFound();
  const isStay = listing.type !== "restaurant" && group.base === "accommodation";
  const isFood = listing.type === "restaurant";

  const [gallery, rooms, menu, nearby, reviews] = await Promise.all([
    getGallery("listing", listing.id),
    isStay ? getRoomTypes(listing.id) : Promise.resolve([]),
    isFood ? getMenuItems(listing.id) : Promise.resolve([]),
    listListings(group.types, { limit: 4 }),
    getReviews({ listingId: listing.id }),
  ]);
  const related = nearby.items.filter((l) => l.id !== listing.id).slice(0, 3);
  const wa = whatsappLink(listing.whatsapp, `Hello, I found ${listing.name} on Visit Lake Bosomtwe.`);
  const dir = directionsLink(listing.latitude, listing.longitude);
  const website = safeUrl(listing.website);
  const menuBySection = menu.reduce<Record<string, typeof menu>>((acc, m) => { (acc[m.section] ??= []).push(m); return acc; }, {});
  const hasCoords = listing.latitude != null && listing.longitude != null;

  const ld = {
    "@context": "https://schema.org", "@type": ldType(listing.type), name: listing.name,
    description: listing.summary ?? undefined, url: `${SITE_URL}/${group.detail}/${listing.slug}`,
    image: mediaUrl(listing.cover?.path) ?? undefined, telephone: listing.phone ?? undefined, email: listing.email ?? undefined,
    address: listing.address ? { "@type": "PostalAddress", streetAddress: listing.address, addressCountry: "GH" } : undefined,
    aggregateRating: reviews.count > 0 ? { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count } : undefined,
    geo: hasCoords ? { "@type": "GeoCoordinates", latitude: listing.latitude, longitude: listing.longitude } : undefined,
  };

  return (
    <>
      <ViewPing listingId={listing.id} />
      <JsonLd data={ld} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: group.title, path: `/${group.base}` }, { name: listing.name, path: `/${group.detail}/${listing.slug}` }])} />
      <div className="relative h-64 bg-forest sm:h-96">
        <Photo media={listing.cover} sizes="100vw" priority className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="[&_*]:!text-white/80 [&_[aria-current]]:!text-white"><Breadcrumbs items={[{ label: group.title, href: `/${group.base}` }, { label: listing.name }]} /></div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{listing.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
            <Badge tone="blue">{listingTypeLabels[listing.type as ListingType]}</Badge>
            {listing.is_verified && <Badge tone="gold"><BadgeCheck className="size-3.5" aria-hidden />Verified by Visit Lake Bosomtwe</Badge>}
            {listing.community && <span>{listing.community.name}</span>}
          </p>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {listing.summary && <p className="text-lg text-ink/90">{listing.summary}</p>}
          <TextBlock title="About" text={listing.description} />

          {rooms.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-forest">Rooms</h2>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {rooms.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
                    <div><h3 className="font-semibold text-ink">{r.name}</h3>
                      {r.description && <p className="mt-1 text-sm text-muted">{r.description}</p>}
                      {r.max_guests && <p className="mt-1 text-xs text-muted">Up to {r.max_guests} guests</p>}</div>
                    {r.price_per_night != null && <p className="text-right font-semibold text-forest">{formatPrice(r.price_per_night, listing.price_currency)}<span className="block text-xs font-normal text-muted">per night</span></p>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Prices are indicative. Availability is confirmed by the provider after you send an enquiry.</p>
            </section>
          )}

          {Object.keys(menuBySection).length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-forest">Menu</h2>
              {Object.entries(menuBySection).map(([section, items]) => (
                <div key={section} className="mb-5">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-lake-dark">{section}</h3>
                  <ul className="divide-y divide-line rounded-2xl border border-line">
                    {items.map((m) => (
                      <li key={m.id} className="flex justify-between gap-4 p-4">
                        <div><p className="font-medium">{m.name}</p>{m.description && <p className="text-sm text-muted">{m.description}</p>}</div>
                        {m.price != null && <p className="shrink-0 font-medium text-forest">{formatPrice(m.price, listing.price_currency)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {(listing.amenities.length > 0 || listing.cuisines.length > 0) && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-forest">{listing.cuisines.length ? "Food and facilities" : "Facilities"}</h2>
              <ul className="flex flex-wrap gap-2">
                {[...listing.cuisines, ...listing.amenities].map((a) => <li key={a}><Badge tone="green" className="px-3 py-1 text-sm">{a}</Badge></li>)}
              </ul>
            </section>
          )}

          <Gallery images={gallery} />
          <Reviews {...reviews} />

          {hasCoords && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-forest">Location</h2>
              <Map points={[{ id: listing.id, kind: isFood ? "restaurant" : isStay ? "accommodation" : "business", title: listing.name, href: `/${group.detail}/${listing.slug}`, lat: listing.latitude!, lng: listing.longitude! }]}
                center={[listing.longitude!, listing.latitude!]} zoom={14} />
              {listing.directions && <p className="mt-3 whitespace-pre-line text-sm text-ink/90">{listing.directions}</p>}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5">
            {listing.price_from != null && (
              <p className="mb-4 text-2xl font-semibold text-forest">From {formatPrice(listing.price_from, listing.price_currency)}
                {listing.price_note && <span className="block text-xs font-normal text-muted">{listing.price_note}</span>}</p>
            )}
            <div className="flex flex-col gap-2">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-5 text-sm font-medium text-white hover:brightness-95"><MessageCircle className="size-4" aria-hidden />WhatsApp</a>}
              {listing.phone && <ButtonLink href={`tel:${listing.phone.replace(/\s/g, "")}`} variant="outline"><Phone className="size-4" aria-hidden />{listing.phone}</ButtonLink>}
              {listing.email && <ButtonLink href={`mailto:${listing.email}`} variant="outline"><Mail className="size-4" aria-hidden />Email</ButtonLink>}
              {website && <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest hover:bg-forest-soft"><Globe className="size-4" aria-hidden />Website</a>}
              {dir && <a href={dir} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest hover:bg-forest-soft"><Navigation className="size-4" aria-hidden />Directions</a>}
            </div>
          </div>
          <Facts items={[{ label: "Address", value: listing.address }, { label: "Opening hours", value: listing.opening_hours }]} />
          <div className="rounded-2xl border border-line bg-white p-5" id="enquire">
            {isStay || isFood ? (
              <>
                <h2 className="mb-3 text-xl font-semibold text-forest">{isFood ? "Request a table" : "Send a booking request"}</h2>
                <BookingForm kind={isFood ? "table" : "accommodation"} listingId={listing.id}
                  rooms={rooms.map((r) => ({ id: r.id, name: r.name, price: formatPrice(r.price_per_night, listing.price_currency), maxGuests: r.max_guests }))} />
                <details className="mt-5 border-t border-line pt-4 text-sm"><summary className="cursor-pointer font-medium text-lake-dark">Just have a question?</summary>
                  <div className="mt-3"><EnquiryForm kind="general" lockKind listingId={listing.id} subject={listing.name} /></div></details>
              </>
            ) : (
              <>
                <h2 className="mb-3 text-xl font-semibold text-forest">Send an enquiry</h2>
                <EnquiryForm kind="general" lockKind listingId={listing.id} subject={listing.name} />
              </>
            )}
          </div>
        </aside>
      </Container>

      {related.length > 0 && (
        <Container className="pb-4">
          <h2 className="mb-5 text-2xl font-semibold text-forest">You may also like</h2>
          <CardGrid>
            {related.map((l: Listing) => <ContentCard key={l.id} href={`/${group.detail}/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} meta={listingTypeLabels[l.type as ListingType]} />)}
          </CardGrid>
        </Container>
      )}
    </>
  );
}

export async function listingMetadataData(slug: string, types: ListingType[]) {
  const l = await getListing(slug);
  return l && types.includes(l.type as ListingType) ? l : null;
}
