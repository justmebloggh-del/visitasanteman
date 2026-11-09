/* VisitAsanteman service worker.
   Public pages: network first, cached copy if offline, then /offline.
   Never touches account, admin, partner, booking, payment, auth or API traffic. */
const VERSION = "v1";
const PAGES = `vasa-pages-${VERSION}`;
const ASSETS = `vasa-assets-${VERSION}`;
const PRIVATE = ["/admin", "/partner", "/booking", "/account", "/api", "/auth", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/travel-planner", "/plan/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/offline"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE.some((p) => url.pathname === p || url.pathname.startsWith(p.endsWith("/") ? p : p + "/"))) return;
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req)) || (await caches.match("/offline"))));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(caches.open(ASSETS).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
