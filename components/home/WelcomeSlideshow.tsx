"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Slide { src: string; alt: string }

/**
 * Crossfading photo slideshow for the homepage welcome. Autoplays unless the visitor prefers reduced motion,
 * pauses on hover and keyboard focus, and has previous/next buttons, dots and a pause button.
 */
export function WelcomeSlideshow({ slides, interval = 5500, className }: { slides: Slide[]; interval?: number; className?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || hold || reduced || count < 2) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearTimeout(t);
  }, [index, playing, hold, reduced, count, interval]);

  if (count === 0) return null;
  const running = playing && !reduced;

  return (
    <div
      role="group" aria-roledescription="carousel" aria-label="Photographs of Manhyia Palace and Asante ceremonies"
      className={cn("relative", className)}
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={() => setHold(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(index - 1); if (e.key === "ArrowRight") go(index + 1); }}
    >
      {/* Offset gold frame behind the photograph */}
      <div className="absolute -bottom-3 -right-3 h-full w-full rounded-3xl border-2 border-gold/70" aria-hidden />
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest-dark shadow-2xl ring-1 ring-gold/30">
        {slides.map((s, i) => (
          <div key={s.src} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={i !== index}
            className={cn("absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none", i === index ? "opacity-100" : "opacity-0")}>
            {/* Blurred copy fills the frame behind the photograph so nothing is cropped and there are no bare bars */}
            <Image src={encodeURI(s.src)} alt="" fill sizes="(min-width:1024px) 8rem, 20vw" quality={40} aria-hidden
              className="scale-125 object-cover opacity-45 blur-3xl saturate-125" />
            <Image src={encodeURI(s.src)} alt={s.alt} fill priority={i === 0} loading={i === 0 ? undefined : "lazy"}
              sizes="(min-width:1024px) 27rem, (min-width:640px) 72vw, 100vw" quality={90}
              className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 to-transparent" aria-hidden />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 text-white">
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose a photograph">
            {slides.map((s, i) => (
              <button key={s.src} type="button" onClick={() => go(i)} aria-label={`Show photograph ${i + 1}`} aria-current={i === index}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-gold" : "w-2 bg-white/60 hover:bg-white")} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={running ? "Pause slideshow" : "Play slideshow"}
              className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55">
              {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous photograph" className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55"><ChevronLeft className="size-5" aria-hidden /></button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next photograph" className="grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55"><ChevronRight className="size-5" aria-hidden /></button>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live={running ? "off" : "polite"}>{slides[index].alt}</p>
    </div>
  );
}
