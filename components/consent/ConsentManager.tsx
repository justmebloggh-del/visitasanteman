"use client";

import Link from "next/link";
import { nowMs } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ACCEPT_ALL, REJECT_ALL, allowed, cookieString, isAnalyticsCookie, needsAsking, parseConsent, type ConsentChoice, type OptionalCategory } from "@/lib/consent";

const REASK_MONTHS = Number(process.env.NEXT_PUBLIC_CONSENT_REASK_MONTHS ?? 12) || 12;
export const OPEN_EVENT = "vasa:open-cookie-settings";

const CATEGORIES: { key: OptionalCategory; title: string; text: string }[] = [
  { key: "functional", title: "Functional", text: "Remember optional preferences. The site does not currently set any." },
  { key: "analytics", title: "Analytics", text: "Help us count visits and see which pages are useful (Google Analytics, when it is switched on for this site)." },
  { key: "advertising", title: "Advertising", text: "Third-party advertising or tracking. The site does not currently use any. Sponsored placements are shown by us and are always labelled." },
];

/** Loads Google Analytics, but only after Analytics consent; withdrawing consent switches it off and removes its cookies. */
function applyAnalytics(gaId: string | undefined, on: boolean) {
  if (!gaId || !/^G-[A-Z0-9]+$/.test(gaId)) return;
  const w = window as unknown as Record<string, unknown>;
  if (!on) {
    w[`ga-disable-${gaId}`] = true;
    for (const c of document.cookie.split(/;\s*/)) {
      const name = c.split("=")[0];
      if (isAnalyticsCookie(name)) { document.cookie = `${name}=; Max-Age=0; Path=/`; document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${location.hostname}`; }
    }
    return;
  }
  w[`ga-disable-${gaId}`] = false;
  if (document.getElementById("vasa-ga")) return;
  w.dataLayer = w.dataLayer || [];
  const gtag = (...a: unknown[]) => (w.dataLayer as unknown[]).push(a);
  w.gtag = gtag;
  gtag("js", new Date()); gtag("config", gaId);
  const s = document.createElement("script");
  s.id = "vasa-ga"; s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(s);
}

// The cookie is the single source of truth. useSyncExternalStore lets React read it safely (empty on the server, real value in the browser).
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const readCookie = () => document.cookie;
const serverCookie = () => "";
const notify = () => listeners.forEach((l) => l());
const noopSubscribe = () => () => {};

export function ConsentManager({ gaId }: { gaId?: string }) {
  const cookie = useSyncExternalStore(subscribe, readCookie, serverCookie);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const choice = parseConsent(cookie);
  const asking = ready && needsAsking(choice, nowMs(), REASK_MONTHS);
  const analyticsOn = ready && allowed(choice, "analytics", nowMs(), REASK_MONTHS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<Record<OptionalCategory, boolean>>({ functional: false, analytics: false, advertising: false });
  const first = useRef<HTMLInputElement>(null);

  // Analytics is an external script: load it only with consent, switch it off and clear its cookies otherwise.
  useEffect(() => { if (ready) applyAnalytics(gaId, analyticsOn); }, [gaId, ready, analyticsOn]);

  const save = useCallback((c: ConsentChoice) => {
    document.cookie = cookieString(c, location.protocol === "https:");
    setSettingsOpen(false);
    notify();
  }, []);

  const openSettings = useCallback(() => {
    const c = parseConsent(document.cookie);
    setDraft({ functional: c?.functional ?? false, analytics: c?.analytics ?? false, advertising: c?.advertising ?? false });
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
    const open = () => openSettings();
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [openSettings]);

  useEffect(() => { if (settingsOpen) first.current?.focus(); }, [settingsOpen]);
  const panel: "banner" | "settings" | null = settingsOpen ? "settings" : asking ? "banner" : null;

  const btn = "inline-flex h-11 items-center justify-center rounded-full border border-forest bg-white px-5 text-sm font-medium text-forest hover:bg-forest-soft focus-visible:outline-2";
  // Accept and reject are deliberately identical in look and size.
  return (
    <div data-analytics={gaId ? "on" : "off"} data-consent-ready={ready ? "yes" : "no"}>
      {panel === "banner" && (
        <section role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] sm:p-5">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 text-sm">
              <h2 id="cookie-title" className="font-serif text-lg font-semibold text-forest">Cookies</h2>
              <p className="mt-1 text-ink/85">We use cookies that are necessary to keep you signed in. With your permission we also use optional cookies. You can change your mind at any time from “Cookie settings” in the footer. <Link href="/cookie-policy" className="underline underline-offset-2">Cookie policy</Link></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => save(REJECT_ALL(Date.now()))}>Reject all</button>
              <button type="button" className={btn} onClick={openSettings}>Customise</button>
              <button type="button" className={btn} onClick={() => save(ACCEPT_ALL(Date.now()))}>Accept all</button>
            </div>
          </div>
        </section>
      )}
      {panel === "settings" && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6" onKeyDown={(e) => { if (e.key === "Escape") setSettingsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <h2 id="cookie-settings-title" className="font-serif text-xl font-semibold text-forest">Cookie settings</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-xl bg-mist p-4"><p className="font-medium text-ink">Necessary <span className="font-normal text-muted">(always on)</span></p><p className="mt-1 text-muted">Keeps you signed in and remembers this choice.</p></div>
              {CATEGORIES.map((c, i) => (
                <label key={c.key} className="flex items-start gap-3 rounded-xl border border-line p-4">
                  <input ref={i === 0 ? first : undefined} type="checkbox" checked={draft[c.key]} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.checked })} className="mt-1 size-4 accent-[var(--color-forest)]" />
                  <span><span className="block font-medium text-ink">{c.title}</span><span className="text-muted">{c.text}</span></span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => save(REJECT_ALL(Date.now()))}>Reject all</button>
              <button type="button" className={btn} onClick={() => save({ ...REJECT_ALL(Date.now()), ...draft })}>Save choices</button>
              <button type="button" className={btn} onClick={() => save(ACCEPT_ALL(Date.now()))}>Accept all</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/** Footer control that reopens the panel. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Cookie settings</button>;
}
