"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

/**
 * A slow scrolling campaign hashtag. It is decorative: the moving copy is hidden from screen readers (one static copy is read),
 * it can be paused, and visitors who prefer reduced motion get plain static text (see .ticker rules in globals.css).
 */
export function HashtagTicker({ text }: { text: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex items-center gap-3 border-t border-white/10 py-3" data-testid="hashtag-ticker">
      <span className="sr-only">{text}</span>
      <div className="ticker-window flex-1 overflow-hidden" aria-hidden>
        <div className={`ticker-track flex w-max gap-10 whitespace-nowrap font-serif text-lg text-gold ${paused ? "ticker-paused" : ""}`}>
          {Array.from({ length: 12 }, (_, i) => <span key={i}>{text}</span>)}
        </div>
      </div>
      <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Play the hashtag animation" : "Pause the hashtag animation"}
        className="ticker-control grid size-9 shrink-0 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10">
        {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
