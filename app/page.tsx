import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bed, Calendar, Camera, Car, Compass, FileText, Info, Map as MapIcon, Phone, Quote, Star, Ticket, Users, Utensils } from "lucide-react";
import { CardGrid, ContentCard, Photo } from "@/components/layout/blocks";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { ButtonLink, Container } from "@/components/ui";
import { AdSlot } from "@/components/ads/AdSlot";
import { Map } from "@/components/maps/Map";
import { SearchBox } from "@/components/layout/SearchBox";
import { WelcomeSlideshow, type Slide } from "@/components/home/WelcomeSlideshow";
import { educationCfg, sportsCfg, transportCfg } from "@/config/domains";
import { listDomain } from "@/lib/content/domains";
import { ceremonyKindLabels, stageLabels, eventStatusLabels, experienceCategoryLabels, listingTypeLabels, accommodationTypes, businessTypes, restaurantTypes, planVisit, type ListingType } from "@/config/site";
import {
  getCategoryCards, getHomepageSections, getQuickLinks, getThemeCounts, listThemes, listCeremonies, getTestimonials, listArticles, listAttractions, listCommunities, listDestinations, listEvents,
  listExperiences, listListings, getMapPoints, getSettings, listInvestments,
} from "@/lib/content/public";
import { SITE_URL } from "@/lib/env";
import { eventDateText, formatDate, formatPrice, mediaUrl } from "@/lib/utils";


// Photographs in public/manhyia, in display order. Descriptions are plain (no names) so they stay accurate.
const WELCOME_SLIDES: Slide[] = [
  { src: "/manhyia/museum.jpeg", alt: "The front of the Manhyia Palace Museum in Kumasi" },
  { src: "/manhyia/66244868.jpg", alt: "A ruler carried in a palanquin beneath a red canopy, wearing kente cloth and gold ornaments" },
  { src: "/manhyia/Explore-Kumasi-Akwasidae-Festival-2.webp", alt: "A chief in a feathered headdress and gold ornaments at a festival" },
  { src: "/manhyia/Explore-Kumasi-Akwasidae-Festival-Dancers.jpg", alt: "Women dancing in orange kente and gold jewellery on a red carpet" },
  { src: "/manhyia/images.jpeg", alt: "A ruler in kente and gold borne in a palanquin among attendants" },
  { src: "/manhyia/Fig-2-1.jpg", alt: "Gold regalia displayed in glass cases in a museum" },
  { src: "/manhyia/kumasi-ghana-ashanti-akwasidae-ceremony-traditional-ashanti-warriors-entering-the-ceremonial-area-3AWBA8C.jpg", alt: "A warrior in white cloth carrying a musket at an Akwasidae ceremony" },
  { src: "/manhyia/akwasidae2.jpg", alt: "Women in kente and gold jewellery at an Akwasidae gathering" },
  { src: "/manhyia/images (1).jpeg", alt: "A ruler in bold kente cloth at a lectern, with attendants and a gold staff" },
  { src: "/manhyia/Asantehene & Asantehemaa.jpg", alt: "Two portraits from Manhyia Palace: a man in green and yellow kente and a woman in white cloth seated on a throne" },
  { src: "/manhyia/WhatsApp Image 2026-09-02 at 07.43.18.jpg", alt: "A ruler in kente speaking at a lectern beneath a tasselled umbrella" },
  { src: "/manhyia/images (2).jpeg", alt: "People in dark cloth carrying muskets in a ceremonial procession" },
  { src: "/manhyia/sword.jpeg", alt: "Visitors in a museum gallery around a large gold-rimmed bowl" },
  { src: "/manhyia/anokye.jpg", alt: "A statue of a figure raising a blade and a vessel towards a cloudy sky" },
  { src: "/manhyia/images (3).jpeg", alt: "The welcome sign at the entrance to Manhyia Palace" },
];

export const revalidate = 60;
const QUICK_ICONS: Record<string, typeof Compass> = { car: Car, info: Info, "file-text": FileText, calendar: Calendar, map: MapIcon, compass: Compass, bed: Bed, utensils: Utensils, camera: Camera, users: Users, ticket: Ticket, phone: Phone };
export const metadata: Metadata = { alternates: { canonical: SITE_URL } };

export default async function HomePage() {
  const [sections, attractions, experiences, stays, food, communities, events, articles, testimonials, points, settings, investments, destinations, businesses, cultureStories, ceremonies, education, sports, transport, quickLinks, categoryCards, themeList, themeCounts] = await Promise.all([
    getHomepageSections(),
    listAttractions({ limit: 6 }),
    listExperiences({ limit: 3 }),
    listListings(accommodationTypes, { limit: 3 }),
    listListings(restaurantTypes, { limit: 3 }),
    listCommunities(),
    listEvents({ limit: 3 }),
    listArticles({ limit: 3 }),
    getTestimonials(3),
    getMapPoints(),
    getSettings(),
    listInvestments({ limit: 3 }),
    listDestinations({ limit: 6 }),
    listListings(businessTypes, { limit: 3 }),
    listArticles({ category: "culture-heritage", limit: 3 }),
    listCeremonies({ when: "upcoming", limit: 3 }),
    listDomain(educationCfg, { limit: 3 }), listDomain(sportsCfg, { limit: 3 }), listDomain(transportCfg, { limit: 3 }),
    getQuickLinks(), getCategoryCards(), listThemes(), getThemeCounts(),
  ]);
  const mapCfg = settings.map ?? {};

  const on = (k: string) => sections[k]?.is_enabled !== false;
  const hero = sections.hero;
  const glanceItems = ((sections.glance?.config as { items?: { label: string; value: string }[] } | undefined)?.items ?? []).filter((i) => i.label && i.value);
  const highlightItems = ((sections.highlights?.config as { items?: { title: string; text: string; href: string }[] } | undefined)?.items ?? [])
    .filter((c) => c.title && c.href && (c.href.startsWith("/") || /^https?:\/\//.test(c.href)));
  const heroImg = mediaUrl(String(hero?.config?.image_path ?? ""));

  return (
    <>
      {/* Hero */}
      {on("hero") && (
        <section className="relative isolate overflow-hidden bg-forest-dark text-white">
          {/* Fallback layer: shown while the video loads and for visitors who prefer reduced motion */}
          {heroImg ? (
            <Image src={heroImg} alt={String(hero?.config?.image_alt ?? "")} fill priority sizes="100vw" className="-z-20 object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-forest-dark via-forest to-lake-dark" aria-hidden />
          )}
          <video
            className="absolute inset-0 -z-10 size-full object-cover opacity-70 motion-reduce:hidden"
            src="/hero-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            tabIndex={-1}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-dark/80 via-forest-dark/30 to-forest-dark/40" aria-hidden />
          <Container className="flex min-h-[78vh] flex-col justify-center py-20">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gold">Asanteman, Ghana</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
              {hero?.title ?? "Discover Asanteman. Experience Our Heritage."}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">{hero?.subtitle || "Plan your visit to Asanteman, Ghana: its places, its people and its heritage, district by district."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/explore" variant="accent" size="lg">Explore Asanteman</ButtonLink>
              <ButtonLink href={planVisit.href} variant="light" size="lg">{planVisit.label}</ButtonLink>
            </div>
            <SearchBox className="mt-10 max-w-xl" />
          </Container>
        </section>
      )}

      {/* Quick links: managed in Admin, hidden while their page is unpublished */}
      {quickLinks.length > 0 && (
        <Container className="relative z-10 -mt-8">
          <nav aria-label="Quick links">
            <ul className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-lg sm:grid-cols-3 lg:grid-cols-6">
              {quickLinks.map((q) => {
                const Icon = QUICK_ICONS[q.icon] ?? Compass;
                return (
                  <li key={q.id}><Link href={q.url} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-mist px-3 text-center text-sm font-medium text-forest hover:bg-forest hover:text-white">
                    <Icon className="size-4 shrink-0" aria-hidden />{q.label}</Link></li>
                );
              })}
            </ul>
          </nav>
        </Container>
      )}

      <AdSlot placement="homepage_banner" />

      {/* Intro */}
      {on("intro") && sections.intro?.body && (
        <Block title={sections.intro.title} subtitle={sections.intro.subtitle}>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26.52rem] lg:gap-14">
            <div className="space-y-4 text-lg leading-relaxed text-ink/90 sm:text-justify" lang="en">
              {sections.intro.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para.trim()}</p>)}
              <ButtonLink href="/about" variant="outline" className="mt-2">Read more about Asanteman</ButtonLink>
            </div>
            <WelcomeSlideshow slides={WELCOME_SLIDES} className="mx-auto w-full max-w-[28.56rem] lg:sticky lg:top-24 lg:max-w-none" />
          </div>
        </Block>
      )}

      {/* At a glance and highlights: edited in Admin > Homepage */}
      {on("glance") && glanceItems.length > 0 && (
        <Block tone="mist" title={sections.glance?.title} subtitle={sections.glance?.subtitle}>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {glanceItems.map((i, n) => (
              <div key={n} className="rounded-2xl border border-line bg-white p-5">
                <dt className="text-sm text-muted">{i.label}</dt><dd className="mt-1 font-serif text-xl font-semibold text-forest">{i.value}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {on("highlights") && highlightItems.length > 0 && (
        <Block title={sections.highlights?.title} subtitle={sections.highlights?.subtitle}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {highlightItems.map((c, n) => (
              <li key={n}><Link href={c.href} className="block h-full rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
                <h3 className="font-serif text-lg font-semibold text-forest">{c.title}</h3><p className="mt-2 text-sm text-muted">{c.text}</p>
              </Link></li>
            ))}
          </ul>
        </Block>
      )}

      {/* B. Explore the region: featured destinations and browse by district */}
      {on("destinations") && destinations.length > 0 && (
        <Block title={sections.destinations?.title ?? "Explore the region"} subtitle={sections.destinations?.subtitle ?? "Featured destinations and the districts of Asanteman."} more={{ href: "/districts", label: "All districts" }}>
          {destinations.length > 0 && (
            <CardGrid>
              {destinations.map((d) => <ContentCard key={d.id} href={`/destinations/${d.slug}`} title={d.name} summary={d.summary} media={d.cover} meta={d.area?.name} />)}
            </CardGrid>
          )}
        </Block>
      )}

      {/* Experience themes: Eat, Wear, See, Feel (only those with published content) */}
      {(() => {
        const live = themeList.filter((t) => t.kind === "experience_theme" && (themeCounts[t.slug] ?? 0) > 0);
        return live.length > 0 && (
          <Block title="Experience Asanteman" subtitle="Browse by what you want to do.">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {live.map((t) => (
                <li key={t.id}><Link href={`/themes/${t.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest">
                  <Photo media={t.cover} sizes="(min-width:1024px) 25vw, 50vw" className="opacity-80 transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white"><span className="block font-serif text-xl font-semibold">{t.name}</span><span className="text-sm text-white/85">{themeCounts[t.slug]} {themeCounts[t.slug] === 1 ? "place or experience" : "places and experiences"}</span></span>
                </Link></li>
              ))}
            </ul>
          </Block>
        );
      })()}

      {/* Explore by type: attraction categories with published attractions */}
      {categoryCards.length > 0 && (
        <Block tone="mist" title="Explore by type" subtitle="Find attractions by what they are." more={{ href: "/attractions", label: "All attractions" }}>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categoryCards.map((c) => (
              <li key={c.id}><Link href={`/attractions?category=${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest-dark">
                <Photo media={c.cover} sizes="(min-width:1024px) 25vw, 50vw" className="opacity-70 transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white"><span className="block font-serif text-lg font-semibold">{c.name}</span><span className="text-sm text-white/85">{c.count} {c.count === 1 ? "attraction" : "attractions"}</span></span>
              </Link></li>
            ))}
          </ul>
        </Block>
      )}

      {/* Map: always on the homepage (the Map menu link moved here); districts live in the Explore Asanteman menu */}
      <Block title="Explore the map" subtitle="Attractions, places to stay, food and events with verified locations across Asanteman." more={{ href: "/map", label: "Open full map" }}>
        <Map points={points} center={[Number(mapCfg.center_lng ?? -1.6), Number(mapCfg.center_lat ?? 6.7)]} zoom={Number(mapCfg.zoom ?? 8)} />
        {points.length === 0 && <p className="mt-3 text-sm text-muted">Places appear on the map once their locations have been checked.</p>}
      </Block>

      {on("attractions") && attractions.items.length > 0 && (
        <Block title={sections.attractions?.title} subtitle={sections.attractions?.subtitle} more={{ href: "/attractions", label: "All attractions" }}>
          <CardGrid>
            {attractions.items.map((a) => (
              <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} meta={a.community?.name ?? a.category?.name} badge={a.category?.name} />
            ))}
          </CardGrid>
        </Block>
      )}

      {/* D1. Upcoming ceremonies and festivals: only dates the organisers have confirmed */}
      {on("ceremonies") && ceremonies.items.length > 0 && (
        <Block title={sections.ceremonies?.title ?? "Ceremonies and festivals"} subtitle={sections.ceremonies?.subtitle} more={{ href: "/culture/calendar", label: "Cultural calendar" }}>
          <CardGrid>
            {ceremonies.items.map((c) => <ContentCard key={c.id} href={`/culture/ceremonies/${c.slug}`} title={c.name} summary={c.summary} media={c.cover} meta={[ceremonyKindLabels[c.kind], formatDate(c.starts_at!)].join(" · ")} />)}
          </CardGrid>
        </Block>
      )}

      {/* D. Experience Asanteman culture: only verified, published stories */}
      {on("culture") && cultureStories.items.length > 0 && (
        <Block title={sections.culture?.title ?? "Experience Asanteman culture"} subtitle={sections.culture?.subtitle} more={{ href: "/culture", label: "Culture & heritage" }}>
          <CardGrid>
            {cultureStories.items.map((a) => <ContentCard key={a.id} href={`/articles/${a.slug}`} title={a.title} summary={a.excerpt} media={a.cover} meta={a.category?.name} />)}
          </CardGrid>
        </Block>
      )}

      {on("experiences") && experiences.items.length > 0 && (
        <Block tone="mist" title={sections.experiences?.title} subtitle={sections.experiences?.subtitle} more={{ href: "/experiences", label: "All experiences" }}>
          <CardGrid>
            {experiences.items.map((e) => (
              <ContentCard key={e.id} href={`/experiences/${e.slug}`} title={e.title} summary={e.summary} media={e.cover}
                meta={[experienceCategoryLabels[e.category], e.price_from != null ? `From ${formatPrice(e.price_from, e.price_currency)}` : null].filter(Boolean).join(" · ")} />
            ))}
          </CardGrid>
        </Block>
      )}

      {on("accommodation") && stays.items.length > 0 && (
        <Block title={sections.accommodation?.title} subtitle={sections.accommodation?.subtitle} more={{ href: "/accommodation", label: "All accommodation" }}>
          <CardGrid>
            {stays.items.map((l) => (
              <ContentCard key={l.id} href={`/accommodation/${l.slug}`} title={l.name} summary={l.summary} media={l.cover}
                meta={[listingTypeLabels[l.type as ListingType], l.price_from != null ? `From ${formatPrice(l.price_from, l.price_currency)}` : null].filter(Boolean).join(" · ")}
                badge={l.is_verified ? "Verified" : null} badgeTone="green" />
            ))}
          </CardGrid>
        </Block>
      )}

      {on("restaurants") && food.items.length > 0 && (
        <Block tone="mist" title={sections.restaurants?.title} subtitle={sections.restaurants?.subtitle} more={{ href: "/restaurants", label: "All restaurants" }}>
          <CardGrid>
            {food.items.map((l) => (
              <ContentCard key={l.id} href={`/restaurants/${l.slug}`} title={l.name} summary={l.summary} media={l.cover}
                meta={l.cuisines?.join(", ") || l.community?.name} badge={l.is_verified ? "Verified" : null} />
            ))}
          </CardGrid>
        </Block>
      )}

      {on("communities") && communities.length > 0 && (
        <Block title={sections.communities?.title} subtitle={sections.communities?.subtitle} more={{ href: "/communities", label: "All communities" }}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {communities.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/communities/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-forest">
                  <Photo media={c.cover} sizes="(min-width:1024px) 25vw, 50vw" className="opacity-80 transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 font-serif text-lg font-semibold text-white">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {on("events") && events.items.length > 0 && (
        <Block tone="mist" title={sections.events?.title} subtitle={sections.events?.subtitle} more={{ href: "/events", label: "All events" }}>
          <ul className="grid gap-4 md:grid-cols-3">
            {events.items.map((ev) => (
              <li key={ev.id}>
                <Link href={`/events/${ev.slug}`} className="flex h-full gap-4 rounded-2xl border border-line bg-white p-5 transition hover:shadow-md">
                  <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-forest text-center text-white">
                    {ev.date_verified ? (
                      <div><div className="text-xl font-semibold leading-none">{new Date(ev.starts_at).getUTCDate()}</div>
                        <div className="text-xs uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(ev.starts_at))}</div></div>
                    ) : <div className="text-sm font-semibold">TBC</div>}
                  </div>
                  <div><h3 className="font-serif text-lg font-semibold text-forest">{ev.title}</h3>
                    <p className="mt-1 text-sm text-muted">{[ev.area?.name, ev.venue, ev.event_status !== "scheduled" ? eventStatusLabels[ev.event_status] : eventDateText(ev)].filter(Boolean).join(" · ")}</p></div>
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {on("articles") && articles.items.length > 0 && (
        <Block title={sections.articles?.title} subtitle={sections.articles?.subtitle} more={{ href: "/articles", label: "All stories" }}>
          <CardGrid>
            {articles.items.map((a) => (
              <ContentCard key={a.id} href={`/articles/${a.slug}`} title={a.title} summary={a.excerpt} media={a.cover} meta={a.category?.name} />
            ))}
          </CardGrid>
          <p className="mt-6 text-sm">Looking for pictures? See the <Link href="/gallery" className="text-lake-dark underline underline-offset-2 hover:no-underline">photo gallery</Link>.</p>
        </Block>
      )}

      {on("testimonials") && testimonials.length > 0 && (
        <Block tone="mist" title={sections.testimonials?.title} subtitle={sections.testimonials?.subtitle}>
          <ul className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.id} className="rounded-2xl border border-line bg-white p-6">
                <Quote className="size-6 text-gold" aria-hidden />
                <p className="mt-3 text-ink/90">{t.quote}</p>
                {t.rating && <p className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5`}>{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-4 fill-gold text-gold" />)}</p>}
                <p className="mt-3 text-sm font-medium text-forest">{t.author_name}{t.author_origin ? `, ${t.author_origin}` : ""}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Education, sports and transport: each part appears only when it has published records */}
      {[{ cfg: educationCfg, data: education, heading: "Education and learning" }, { cfg: sportsCfg, data: sports, heading: "Sports and recreation" }, { cfg: transportCfg, data: transport, heading: "Getting around" }]
        .filter((x) => x.data.items.length > 0).map((x, i) => (
          <Block key={x.cfg.key} tone={i % 2 === 0 ? "mist" : undefined} title={x.heading} more={{ href: x.cfg.base, label: `All ${x.cfg.noun}s` }}>
            <CardGrid>
              {x.data.items.map((r) => <ContentCard key={r.id} href={`${x.cfg.base}/${r.slug}`} title={r.name} summary={r.summary} media={r.cover} meta={[x.cfg.kindColumn ? x.cfg.kinds?.[String(r[x.cfg.kindColumn])] : null, r.area?.name].filter(Boolean).join(" · ")} />)}
            </CardGrid>
          </Block>
        ))}

      {/* I. Plan your visit: always available, these are working tools */}
      <Block title={sections.plan?.title ?? "Plan your visit"} subtitle={sections.plan?.subtitle ?? "Build an itinerary, read the travel guide or find places on the map."}>
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { href: "/travel-planner", title: "Travel planner", text: "Choose places and arrange them into a day-by-day plan you can save and share." },
            { href: "/travel-guide", title: "Travel guide", text: "Practical information for getting here and getting around." },
            { href: "/map", title: "Tourism map", text: "See places with verified locations on an interactive map." },
          ].map((c) => (
            <li key={c.href}><Link href={c.href} className="block h-full rounded-2xl border border-line bg-white p-6 transition hover:shadow-md">
              <h3 className="font-serif text-xl font-semibold text-forest">{c.title}</h3><p className="mt-2 text-sm text-muted">{c.text}</p>
            </Link></li>
          ))}
        </ul>
      </Block>

      {/* J. Local tourism businesses */}
      <Block tone="mist" title={sections.businesses?.title ?? "Local tourism businesses"} subtitle={sections.businesses?.subtitle ?? "Tour operators, guides, makers and other businesses. Every listing is reviewed before it is published."} more={{ href: "/business-directory", label: "Business directory" }}>
        {businesses.items.length > 0 && (
          <div className="mb-8"><CardGrid>
            {businesses.items.map((l) => <ContentCard key={l.id} href={`/business/${l.slug}`} title={l.name} summary={l.summary} media={l.cover} meta={listingTypeLabels[l.type as ListingType]} badge={l.is_verified ? "Verified" : null} />)}
          </CardGrid></div>
        )}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/partner">Register your business</ButtonLink>
          <ButtonLink href="/advertise" variant="outline">Advertise with VisitAsanteman</ButtonLink>
        </div>
      </Block>

      {on("investment") && investments.length > 0 && (
        <Block title={sections.investment?.title} subtitle={sections.investment?.subtitle} more={{ href: "/investment", label: "All opportunities" }}>
          <CardGrid>
            {investments.map((p) => <ContentCard key={p.id} href={`/investment/${p.slug}`} title={p.title} summary={p.summary} media={p.cover} meta={p.proposed_location} badge={stageLabels[p.stage]} badgeTone={p.stage === "proposed" ? "gold" : "green"} />)}
          </CardGrid>
        </Block>
      )}

      {/* Partner CTA + newsletter */}
      <Container className="mt-20 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-forest p-8 text-white sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">Partnerships and investment</h2>
          <p className="mt-3 text-white/85">Organisations that want to support tourism in the region can talk to us, and tourism businesses can ask to be listed. Every listing is reviewed before it is published.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/partner-with-us" variant="accent">Partner with us <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="/partner" variant="light">List your business</ButtonLink>
          </div>
        </div>
        {on("newsletter") && (
          <div className="rounded-3xl border border-line bg-mist p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-forest sm:text-3xl">{sections.newsletter?.title ?? "Stay in the loop"}</h2>
            <p className="mb-5 mt-3 text-muted">{sections.newsletter?.subtitle}</p>
            <NewsletterForm />
          </div>
        )}
      </Container>
    </>
  );
}

function Block({ title, subtitle, more, tone, children }: {
  title?: string | null; subtitle?: string | null; more?: { href: string; label: string }; tone?: "mist"; children: React.ReactNode;
}) {
  return (
    <section className={tone === "mist" ? "mt-20 bg-mist py-16" : "mt-20"}>
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-3xl font-semibold text-forest sm:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
          </div>
          {more && <Link href={more.href} className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">{more.label}<ArrowRight className="size-4" /></Link>}
        </div>
        {children}
      </Container>
    </section>
  );
}
