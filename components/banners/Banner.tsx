import Link from "next/link";
import { StaticPhoto } from "@/components/layout/blocks";
import { Container, buttonClasses } from "@/components/ui";
import { SikaDwaEmblem } from "@/components/banners/SikaDwaEmblem";
import type { BannerDef } from "@/config/banners";
import { cn } from "@/lib/utils";

/**
 * One banner, used for the whole collection. Layout:
 *  - wide screens: words on the left, a photograph in the centre, the emblem at the far right;
 *  - phones: words on the left with the emblem still at the far right (smaller), the photograph underneath.
 * The emblem sits in its own grid column, so text and buttons can never overlap it. Headlines, text and buttons are real HTML.
 */
export function Banner({ def, as: Heading = "h2", priority, children, media, className }: {
  def: BannerDef; as?: "h1" | "h2"; priority?: boolean; children?: React.ReactNode; media?: React.ReactNode; className?: string;
}) {
  const hero = Heading === "h1";
  const photo = media ?? (def.image ? (
    <div className="banner-float overflow-hidden rounded-xl border-4 border-gold bg-black/30 shadow-2xl">
      <StaticPhoto image={def.image} priority={priority} className="max-h-56 sm:max-h-64 lg:max-h-72" />
    </div>
  ) : null);
  return (
    <section className={cn("kente-bg gold-shimmer relative isolate overflow-hidden text-white", className)} aria-labelledby={`banner-${def.key}`}>
      <div className="kente-veil absolute inset-0 -z-10" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-[5] hidden sm:block" aria-hidden>
        <span className="gold-mote left-[8%] top-[70%] size-1.5" style={{ animationDelay: "0s" }} />
        <span className="gold-mote left-[34%] top-[82%] size-1" style={{ animationDelay: "4s" }} />
        <span className="gold-mote left-[58%] top-[74%] size-1.5" style={{ animationDelay: "8s" }} />
        <span className="gold-mote left-[76%] top-[86%] size-1" style={{ animationDelay: "2s" }} />
      </div>
      <Container className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-5 sm:gap-x-6", hero ? "py-12 sm:py-16 lg:py-20" : "py-8 sm:py-10 lg:py-12",
        photo ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_auto]" : "lg:grid-cols-[minmax(0,1fr)_auto]")}>
        <div className="banner min-w-0 lg:col-start-1 lg:row-start-1">
          {def.kicker && <p className="banner-rise mb-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-soft-gold sm:text-xs">{def.kicker}</p>}
          <Heading id={`banner-${def.key}`} className={cn("banner-rise banner-rise-2 break-words font-serif font-bold uppercase leading-[1.12] tracking-wide text-white",
            hero ? "text-[1.7rem] sm:text-5xl lg:text-6xl" : "text-[1.3rem] sm:text-3xl lg:text-4xl")}>{def.headline}</Heading>
          <span className="banner-rise banner-rise-2 mt-3 block h-1 w-16 rounded-full bg-gold" aria-hidden />
          <p className="banner-rise banner-rise-3 mt-3 text-left text-[0.95rem] font-medium leading-snug text-soft-gold sm:text-lg">{def.message}</p>
          {def.description && <p className="banner-rise banner-rise-3 mt-3 hidden max-w-xl text-left text-base text-white/85 sm:block">{def.description}</p>}
          <div className="banner-rise banner-rise-4 mt-5 flex flex-wrap gap-3">
            {def.buttons.map((b, i) => (
              <Link key={b.href + b.label} href={b.href} className={buttonClasses(i === 0 ? "accent" : "light", "lg", "min-h-12 text-[0.95rem] sm:text-base")}>{b.label}</Link>
            ))}
          </div>
          {children}
        </div>
        {photo && <div className="col-span-2 col-start-1 row-start-2 justify-self-start lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center">{photo}</div>}
        {/* Signature emblem: always in the last column, at the far right. Same artwork and proportions everywhere, scaled by screen width. */}
        <div className={cn("col-start-2 row-start-1 justify-self-end", photo ? "lg:col-start-3" : "lg:col-start-2")}>
          <SikaDwaEmblem className={cn("h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]", hero ? "w-[4.25rem] sm:w-28 lg:w-40" : "w-[3.75rem] sm:w-24 lg:w-32")} />
        </div>
      </Container>
      <div className="kente-strip" aria-hidden />
    </section>
  );
}
