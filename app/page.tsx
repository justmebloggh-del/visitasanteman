import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { CardGrid, ContentCard, Photo } from "@/components/layout/blocks";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { ButtonLink, Container } from "@/components/ui";
import { AdSlot } from "@/components/ads/AdSlot";
import { Map } from "@/components/maps/Map";
import { SearchBox } from "@/components/layout/SearchBox";
import { stageLabels, eventStatusLabels, experienceCategoryLabels, listingTypeLabels, accommodationTypes, restaurantTypes, type ListingType } from "@/config/site";
import {
  getHomepageSections, getTestimonials, listArticles, listAttractions, listCommunities, listEvents,
  listExperiences, listListings, getMapPoints, getSettings, listInvestments,
} from "@/lib/content/public";
import { formatDate, formatPrice, mediaUrl } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const [sections, attractions, experiences, stays, food, communities, events, articles, testimonials, points, settings, investments] = await Promise.all([
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
  ]);
  const mapCfg = settings.map ?? {};
  const contact = settings.contact ?? {};

  const on = (k: string) => sections[k]?.is_enabled !== false;
  const hero = sections.hero;
  const heroImg = mediaUrl(String(hero?.config?.image_path ?? ""));

  return (
    <>
      {/* Hero */}
      {on("hero") && (
        <section className="relative isolate overflow-hidden bg-forest-dark text-white">
          {heroImg ? (
            <Image src={heroImg} alt={String(hero?.config?.image_alt ?? "")} fill priority sizes="100vw" className="-z-10 object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-forest-dark via-forest to-lake-dark" aria-hidden />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-dark/70 to-transparent" aria-hidden />
          <Container className="flex min-h-[78vh] flex-col justify-center py-20">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gold">Ashanti Region, Ghana</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
              {hero?.title ?? "Discover the Extraordinary. Experience the Beauty of Lake Bosomtwe."}
            </h1>
            {hero?.subtitle && <p className="mt-5 max-w-xl text-lg text-white/85">{hero.subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/explore" variant="accent" size="lg">Explore now</ButtonLink>
              <ButtonLink href="/travel-guide" variant="light" size="lg">Plan your visit</ButtonLink>
            </div>
            <SearchBox className="mt-10 max-w-xl" />
          </Container>
        </section>
      )}

      {/* Main calls to action */}
      <Container className="relative z-10 -mt-8">
        <ul className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-lg sm:grid-cols-2 lg:grid-cols-5">
          {[["/explore", "Explore Lake Bosomtwe"], ["/accommodation", "Find accommodation"], ["/experiences", "Discover experiences"], ["/travel-guide", "Plan your visit"], ["/partner", "Become a tourism partner"]].map(([href, label]) => (
            <li key={href}><Link href={href} className="flex h-12 items-center justify-center rounded-xl bg-mist px-3 text-center text-sm font-medium text-forest hover:bg-forest hover:text-white">{label}</Link></li>
          ))}
        </ul>
      </Container>

      <AdSlot placement="homepage_banner" />

      {/* Intro */}
      {on("intro") && sections.intro?.body && (
        <Block title={sections.intro.title} subtitle={sections.intro.subtitle}>
          <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink/90">{sections.intro.body}</p>
          <ButtonLink href="/explore" variant="outline" className="mt-6">Read more about the lake</ButtonLink>
        </Block>
      )}

      {on("attractions") && attractions.items.length > 0 && (
        <Block title={sections.attractions?.title} subtitle={sections.attractions?.subtitle} more={{ href: "/attractions", label: "All attractions" }}>
          <CardGrid>
            {attractions.items.map((a) => (
              <ContentCard key={a.id} href={`/attractions/${a.slug}`} title={a.name} summary={a.summary} media={a.cover} meta={a.community?.name ?? a.category?.name} badge={a.category?.name} />
            ))}
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
                    <div><div className="text-xl font-semibold leading-none">{new Date(ev.starts_at).getUTCDate()}</div>
                      <div className="text-xs uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(ev.starts_at))}</div></div>
                  </div>
                  <div><h3 className="font-serif text-lg font-semibold text-forest">{ev.title}</h3>
                    <p className="mt-1 text-sm text-muted">{[ev.venue, ev.event_status !== "scheduled" ? eventStatusLabels[ev.event_status] : formatDate(ev.starts_at)].filter(Boolean).join(" · ")}</p></div>
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

      {on("investment") && investments.length > 0 && (
        <Block title={sections.investment?.title} subtitle={sections.investment?.subtitle} more={{ href: "/investment", label: "All opportunities" }}>
          <CardGrid>
            {investments.map((p) => <ContentCard key={p.id} href={`/investment/${p.slug}`} title={p.title} summary={p.summary} media={p.cover} meta={p.proposed_location} badge={stageLabels[p.stage]} badgeTone={p.stage === "proposed" ? "gold" : "green"} />)}
          </CardGrid>
        </Block>
      )}

      {points.length > 0 && (
        <Block title="Explore the map" subtitle="Attractions, places to stay, food and events with verified locations." more={{ href: "/map", label: "Open full map" }}>
          <Map points={points} center={[Number(mapCfg.center_lng ?? -1.41), Number(mapCfg.center_lat ?? 6.5)]} zoom={Number(mapCfg.zoom ?? 11)} />
        </Block>
      )}

      <Block title="Questions about your visit?" subtitle="Send us a message and we will reply by email.">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2"><EnquiryForm /></div>
          <div className="space-y-2 text-sm text-muted">
            {contact.email && <p>Email: <a className="text-lake-dark hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
            {contact.phone && <p>Phone: {contact.phone}</p>}
            <p>Follow us using the social links in the footer.</p>
          </div>
        </div>
      </Block>

      {/* Partner CTA + newsletter */}
      <Container className="mt-20 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-forest p-8 text-white sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">Run a tourism business here?</h2>
          <p className="mt-3 text-white/85">Hotels, restaurants, guides and boat operators can ask to be listed. Every listing is reviewed before it is published.</p>
          <ButtonLink href="/partner" variant="accent" className="mt-6">Become a tourism partner <ArrowRight className="size-4" /></ButtonLink>
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
