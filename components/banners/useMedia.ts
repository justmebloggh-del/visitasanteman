"use client";

import { useSyncExternalStore } from "react";

/** True while the media query matches. False on the server and during hydration, so server and browser markup agree. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => { const m = window.matchMedia(query); m.addEventListener("change", notify); return () => m.removeEventListener("change", notify); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
