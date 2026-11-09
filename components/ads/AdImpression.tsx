"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Counts one impression per ad per browser session. Fails silently. */
export function AdImpression({ adId }: { adId: string }) {
  useEffect(() => {
    const key = `ad:${adId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
    createBrowserSupabase().rpc("record_ad_event", { p_ad: adId, p_event: "impression" }).then(() => {}, () => {});
  }, [adId]);
  return null;
}
