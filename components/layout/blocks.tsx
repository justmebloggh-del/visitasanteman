import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, MapPin } from "lucide-react";
import { Badge, ButtonLink, Container } from "@/components/ui";
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

/* ── Page header used by index pages ── */
export function PageHeader({ title, intro, crumbs }: { title: string; intro?: string; crumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="bg-forest-dark text-white">
      <Container className="py-12 sm:py-16">
        {crumbs && <div className="mb-4 [&_*]:!text-white/70 [&_[aria-current]]:!text-white"><Breadcrumbs items={crumbs} /></div>}
        <h1 className="text-3xl font-semibold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">{intro}</p>}
      </Container>
    </header>
  );
}

/* ── Images ── */
export function Photo({ media, sizes, className, priority }: {
  media: MediaRef | null | undefined; sizes: string; className?: string; priority?: boolean;
}) {
  const src = mediaUrl(media?.path);
  if (!src) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center ${priority ? "bg-forest text-white/25" : "bg-forest-soft text-forest/40"} ${className ?? ""}`} aria-hidden>
        <MapPin className="size-8" />
      </div>
    );
  }
  return <Image src={src} alt={media?.alt_text ?? ""} fill sizes={sizes} priority={priority} className={`object-cover ${className ?? ""}`} />;
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
