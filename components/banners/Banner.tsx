import Link from "next/link";
import { Container, buttonClasses } from "@/components/ui";
import { Breadcrumbs } from "@/components/layout/blocks";
import { SikaDwaEmblem } from "@/components/banners/SikaDwaEmblem";
import type { BannerDef } from "@/config/banners";
import { cn } from "@/lib/utils";

/**
 * One banner. No photographs: a green kente weave, heritage gold, real HTML text, and the emblem at the far right.
 * The emblem sits in its own grid column, so text and buttons can never overlap it, on any screen width. On phones it
 * shrinks but stays at the far right. Three weaves, three compositions and three entrances give each banner its own look
 * (set per banner in config/banners.ts) while the identity stays the same.
 */
export function Banner({ def, as: Heading = "h2", children, className, crumbs }: {
  def: BannerDef; as?: "h1" | "h2"; children?: React.ReactNode; className?: string;
  /** Opening banner: the banner is the page header (its headline is the h1) and the breadcrumb sits inside it. */
  crumbs?: { label: string; href?: string }[];
}) {
  const { pattern, layout, motion } = def.style;
  const hero = Heading === "h1";
  const headline = (
    <Heading id={`banner-${def.key}`} className={cn("banner-rise banner-rise-2 break-words font-serif font-bold uppercase leading-[1.12] tracking-wide text-white",
      hero ? "text-[1.7rem] sm:text-5xl lg:text-6xl" : layout === "stacked" ? "text-[1.4rem] sm:text-4xl lg:text-5xl" : "text-[1.3rem] sm:text-3xl lg:text-4xl")}>{def.headline}</Heading>
  );
  const message = <p className="banner-rise banner-rise-3 text-left text-[0.95rem] font-medium leading-snug text-soft-gold sm:text-lg">{def.message}</p>;
  const description = def.description && <p className="banner-rise banner-rise-3 mt-3 hidden max-w-xl text-left text-base text-white/85 sm:block">{def.description}</p>;
  const buttons = (
    <div className="banner-rise banner-rise-4 mt-5 flex flex-wrap gap-3">
      {def.buttons.map((b, i) => (
        <Link key={b.href + b.label} href={b.href} className={buttonClasses(i === 0 ? "accent" : "light", "lg", "min-h-12 text-[0.95rem] sm:text-base")}>{b.label}</Link>
      ))}
    </div>
  );
  const rule = <span className="banner-rise banner-rise-2 my-3 block h-1 w-16 rounded-full bg-gold" aria-hidden />;

  return (
    <section className={cn("banner kente-bg gold-shimmer relative isolate overflow-hidden text-white", `kente-${pattern}`, className)} data-motion={motion} data-layout={layout} aria-labelledby={`banner-${def.key}`}>
      <div className="kente-veil absolute inset-0 -z-10" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-[5] hidden sm:block" aria-hidden>
        <span className="gold-mote left-[8%] top-[70%] size-1.5" style={{ animationDelay: "0s" }} />
        <span className="gold-mote left-[40%] top-[82%] size-1" style={{ animationDelay: "4s" }} />
        <span className="gold-mote left-[62%] top-[74%] size-1.5" style={{ animationDelay: "8s" }} />
      </div>
      {hero && <div className="kente-strip" aria-hidden />}
      <Container className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:gap-x-8", hero ? "py-10 sm:py-14 lg:py-20" : "py-8 sm:py-10 lg:py-12")}>
        {crumbs && <div className="page-crumbs col-span-2 mb-5 sm:mb-8"><Breadcrumbs items={crumbs} /></div>}
        <div className="min-w-0">
          {def.kicker && <p className="banner-rise mb-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-soft-gold sm:text-xs">{def.kicker}</p>}
          {layout === "ledger" ? (
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
              <div>{headline}{rule}</div>
              <div className="lg:border-l lg:border-gold/60 lg:pl-8">{message}{description}{buttons}{children}</div>
            </div>
          ) : layout === "stacked" ? (
            <>
              {headline}{rule}
              <div className="lg:flex lg:items-end lg:gap-10">
                <div className="lg:max-w-xl">{message}{description}</div>
                <div className="lg:ml-auto lg:shrink-0">{buttons}</div>
              </div>
              {children}
            </>
          ) : (
            <>{headline}{rule}{message}{description}{buttons}{children}</>
          )}
        </div>
        {/* Signature emblem: always in the last column, at the far right. Same artwork everywhere; only the size follows the screen. */}
        <SikaDwaEmblem className={cn("justify-self-end self-center", hero ? "w-[5rem] sm:w-32 lg:w-44" : "w-[4.5rem] sm:w-28 lg:w-36")} />
      </Container>
      <div className="kente-strip" aria-hidden />
    </section>
  );
}
