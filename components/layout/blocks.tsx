import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, MapPin } from "lucide-react";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { images, type ImageKey } from "@/config/images";
import { mediaUrl } from "@/lib/utils";
import type { MediaRef } from "@/types/content";

/* ── Breadcrumbs ── */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><Link href="/" className="hover:text-forest">Home</Link></li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" aria-hidden />
            {it.href ? <Link href={it.href} className="hover:text-forest">{it.label}</Link> : <span aria-current="page" className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── Page title band, used at the top of every page ── */
// Not a banner: no photograph and no emblem. A deep green band with the kente strip, the title and a gold rule. The promotional
// banners (components/banners) carry the emblem and sit under it on the pages that have one.
export function PageHeader({ title, intro, crumbs }: { title: string; intro?: string; crumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-br from-forest-dark via-forest-dark to-forest text-white">
      <div className="kente-strip" aria-hidden />
      <Container className="py-10 sm:py-14">
        {crumbs && <div className="mb-4 [&_*]:!text-white/70 [&_[aria-current]]:!text-white"><Breadcrumbs items={crumbs} /></div>}
        <h1 className="font-serif text-3xl font-semibold sm:text-5xl">{title}</h1>
        <span className="mt-4 block h-1 w-20 rounded-full bg-gold" aria-hidden />
        {intro && <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{intro}</p>}
      </Container>
      <div className="kente-strip" aria-hidden />
    </header>
  );
}

/**
 * A built-in photograph shown at its own proportions and never larger than its real size, so it is never stretched
 * or upscaled (which is what makes small pictures look blurry). Served as the original file, not re-compressed.
 * It scales down to fit narrow screens and to the height limit given in className.
 */
export function StaticPhoto({ image, className = "", priority, sizes, decorative }: { image: ImageKey; className?: string; priority?: boolean; sizes?: string; decorative?: boolean }) {
  const i = images[image];
  return (
    <Image src={i.src} alt={decorative ? "" : i.alt} width={i.width} height={i.height} unoptimized priority={priority} sizes={sizes}
      className={`h-auto w-auto max-w-full ${className}`} />
  );
}

/* ── Images ── */
export function Photo({ media, sizes, className, priority, position }: {
  media: MediaRef | null | undefined; sizes: string; className?: string; priority?: boolean; position?: string;
}) {
  const src = mediaUrl(media?.path);
  if (!src) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center ${priority ? "bg-forest text-white/25" : "bg-forest-soft text-forest/40"} ${className ?? ""}`} aria-hidden>
        <MapPin className="size-8" />
      </div>
    );
  }
  return <Image src={src} alt={media?.alt_text ?? ""} fill sizes={sizes} priority={priority} unoptimized={src.startsWith("/")} className={`object-cover ${className ?? ""}`} style={position ? { objectPosition: position } : undefined} />;
}

/* ── Generic content card ── */
export function ContentCard({ href, title, summary, media, meta, badge, badgeTone }: {
  href: string; title: string; summary?: string | null; media?: MediaRef | null;
  meta?: string | null; badge?: string | null; badgeTone?: "green" | "gold" | "blue";
}) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Photo media={media} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="transition duration-500 group-hover:scale-105" />
        {badge && <Badge tone={badgeTone ?? "green"} className="absolute left-3 top-3 bg-white/95">{badge}</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {meta && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-lake-dark">{meta}</p>}
        <h3 className="text-lg font-semibold text-forest">{title}</h3>
        {summary && <p className="mt-2 line-clamp-3 text-sm text-muted">{summary}</p>}
        <span className="mt-auto pt-4 text-sm font-medium text-forest group-hover:underline">View details</span>
      </div>
    </Link>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/* ── Empty state ── */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-mist px-6 py-14 text-center">
      {/* An empty or filtered-out list is a thin page: keep it out of search results (React hoists this into the head). */}
      <meta name="robots" content="noindex, follow" />
      <Inbox className="mx-auto size-9 text-forest/40" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold text-forest">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <ButtonLink href={action.href} variant="outline" size="sm" className="mt-5">{action.label}</ButtonLink>}
    </div>
  );
}

/* ── Pagination (server-rendered, link based) ── */
export function Pagination({ page, pageCount, basePath, params }: {
  page: number; pageCount: number; basePath: string; params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => v && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 hover:bg-mist"><ChevronLeft className="size-4" />Previous</Link> : <span />}
      <span className="text-muted">Page {page} of {pageCount}</span>
      {page < pageCount ? <Link href={href(page + 1)} className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 hover:bg-mist">Next<ChevronRight className="size-4" /></Link> : <span />}
    </nav>
  );
}

/* ── Fact list used on detail pages ── */
export function Facts({ items }: { items: { label: string; value?: string | null }[] }) {
  const rows = items.filter((i) => i.value);
  if (!rows.length) return null;
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-1 px-5 py-3 sm:grid-cols-3">
          <dt className="text-sm font-medium text-muted">{r.label}</dt>
          <dd className="text-sm text-ink sm:col-span-2 whitespace-pre-line">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TextBlock({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null;
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold text-forest">{title}</h2>
      <p className="whitespace-pre-line leading-relaxed text-ink/90">{text}</p>
    </section>
  );
}

export function Gallery({ images }: { images: MediaRef[] }) {
  if (!images.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-2xl font-semibold text-forest">Gallery</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((m) => (
          <div key={m.path} className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Photo media={m} sizes="(min-width:768px) 33vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Videos for an item, played in the page. Nothing loads until the visitor presses play (preload="metadata"). */
export function VideoGallery({ videos }: { videos: MediaRef[] }) {
  if (!videos.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-2xl font-semibold text-forest">Videos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((v) => {
          const src = mediaUrl(v.path);
          if (!src) return null;
          return (
            <figure key={v.path} className="overflow-hidden rounded-xl border border-line bg-white">
              <video src={src} controls preload="metadata" playsInline aria-label={v.alt_text} className="aspect-video w-full bg-black" />
              {v.alt_text && <figcaption className="px-3 py-2 text-sm text-muted">{v.alt_text}</figcaption>}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Top of a detail page: title, badges and facts on the left, the main photograph at the top-right of the content area.
 * On phones the photograph comes first, then the text. The frame has one size and shape on every page (4:3, rounded), and
 * is left out when the page has no photograph rather than showing an empty box.
 */
export function DetailTop({ media, children }: { media: MediaRef | null | undefined; children: React.ReactNode }) {
  const has = !!media?.path;
  return (
    <header className="border-b border-line bg-gradient-to-b from-mist to-white">
      <div className="kente-strip" aria-hidden />
      <Container className={`grid items-start gap-6 py-8 sm:py-10 ${has ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10" : ""}`}>
        <div className="order-2 min-w-0 text-ink lg:order-1 [&_h1]:font-serif [&_h1]:text-forest">{children}</div>
        {has && (
          <div className="relative order-1 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-forest-soft shadow-md lg:order-2">
            <Photo media={media} sizes="(min-width:1024px) 26rem, 100vw" priority />
          </div>
        )}
      </Container>
    </header>
  );
}
