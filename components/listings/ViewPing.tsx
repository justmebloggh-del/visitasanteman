"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Records one page view per listing per browser session (powers partner analytics). Fails silently. */
export function ViewPing({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `viewed:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage unavailable: still count once per mount */ }
    createBrowserSupabase().rpc("record_listing_view", { l: listingId }).then(() => {}, () => {});
  }, [listingId]);
  return null;
}
