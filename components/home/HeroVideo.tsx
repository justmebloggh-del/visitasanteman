"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const canPlay = () => {
  const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? "")) return false;
  return window.matchMedia(QUERY).matches;
};

/**
 * The hero film (about 8 MB). Phones, visitors who prefer reduced motion, Data Saver users and slow connections never download it;
 * they see the hero photograph instead. Tablets and larger screens stream it.
 */
export function HeroVideo() {
  const play = useSyncExternalStore(subscribe, canPlay, () => false);
  if (!play) return null;
  return (
    <video className="absolute inset-0 -z-10 size-full object-cover opacity-70" src="/hero-video.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden tabIndex={-1} />
  );
}
