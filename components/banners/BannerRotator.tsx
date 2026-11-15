"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useEffect, useState } from "react";
import { useMedia } from "@/components/banners/useMedia";

/**
 * Cycles through promotional banners with a slow fade. Every slide shares one grid cell, so the height never jumps.
 * Starts paused for visitors who prefer reduced motion, pauses while the pointer or keyboard focus is inside, and has
 * real previous, next, pause and dot controls. Hidden slides are made inert, so they cannot be tabbed to.
 */
export function BannerRotator({ children, intervalMs = 9000, label = "Featured" }: { children: React.ReactNode; intervalMs?: number; label?: string }) {
  const slides = Children.toArray(children);
  const [i, setI] = useState(0);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (paused || hover || slides.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), intervalMs);
    return () => clearTimeout(t);
  }, [i, paused, hover, slides.length, intervalMs]);
  if (slides.length === 0) return null;
  const go = (n: number) => setI((n + slides.length) % slides.length);

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}>
      <div className="grid">
        {slides.map((s, n) => (
          <div key={n} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${slides.length}`} aria-hidden={n !== i}
            inert={n !== i}
            className={`[grid-area:1/1] transition-opacity duration-1000 motion-reduce:transition-none ${n === i ? "opacity-100" : "pointer-events-none invisible opacity-0"}`}>
            {s}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-white backdrop-blur-sm">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous banner" className="grid size-8 place-items-center rounded-full hover:bg-white/15"><ChevronLeft className="size-4" aria-hidden /></button>
          <button type="button" onClick={() => setUserPaused(!paused)} aria-label={paused ? "Play automatic rotation" : "Pause automatic rotation"} className="grid size-8 place-items-center rounded-full hover:bg-white/15">
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}</button>
          <ul className="flex items-center gap-1.5 px-1">
            {slides.map((_, n) => (
              <li key={n}><button type="button" onClick={() => setI(n)} aria-label={`Show banner ${n + 1}`} aria-current={n === i}
                className={`block h-2 rounded-full transition-all ${n === i ? "w-5 bg-gold" : "w-2 bg-white/60 hover:bg-white"}`} /></li>
            ))}
          </ul>
          <button type="button" onClick={() => go(i + 1)} aria-label="Next banner" className="grid size-8 place-items-center rounded-full hover:bg-white/15"><ChevronRight className="size-4" aria-hidden /></button>
        </div>
      )}
    </section>
  );
}
