"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: no-preference)";
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
 * The hero film (about 8 MB), on every screen size including phones. Visitors who prefer reduced motion, Data Saver users and
 * slow connections never download it; they keep the hero photograph. The film is only added once the page has finished loading,
 * so it never delays the first paint, and the photograph shows underneath until the first frame is ready.
 */
export function HeroVideo() {
  const allowed = useSyncExternalStore(subscribe, canPlay, () => false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!allowed) return;
    const go = () => setReady(true);
    if (document.readyState === "complete") {
      const t = window.setTimeout(go, 300);
      return () => window.clearTimeout(t);
    }
    window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, [allowed]);

  // Mobile browsers sometimes ignore the autoplay attribute; ask explicitly (muted and inline playback is always permitted).
  useEffect(() => {
    if (!ready) return;
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [ready]);

  if (!allowed || !ready) return null;
  return (
    <video
      ref={ref}
      className="absolute inset-0 -z-10 size-full object-cover opacity-70"
      src="/hero-video.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
    />
  );
}
