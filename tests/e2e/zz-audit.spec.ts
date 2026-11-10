import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Launch audits: security headers and secrets, SEO, broken links, accessibility, mobile layout, performance budget.
// Named zz- so it runs last, when earlier specs have filled the local database with published records (richer pages).
test.setTimeout(180_000);

const PUBLIC = ["/", "/about", "/explore", "/attractions", "/districts", "/destinations", "/culture", "/culture/ceremonies", "/culture/calendar", "/communities",
  "/accommodation", "/restaurants", "/venues", "/markets", "/business-directory", "/experiences", "/events", "/education", "/sports", "/sports/clubs", "/transport",
  "/articles", "/gallery", "/map", "/search?q=test", "/contact", "/partner", "/partner-with-us", "/advertise", "/investment", "/travel-planner", "/travel-planner/itineraries",
  "/login", "/register", "/privacy", "/terms", "/travel-guide"];

const grab = (html: string, re: RegExp) => html.match(re)?.[1]?.trim();
const metaContent = (html: string, attr: string, name: string) => {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const t of tags) if (new RegExp(`${attr}=["']${name}["']`, "i").test(t)) return t.match(/content=["']([^"']*)["']/i)?.[1];
  return undefined;
};

test.describe("security", () => {
  test.skip(({ isMobile }) => isMobile, "headers do not depend on the device");

  test("every response carries the security headers and no framework banner", async ({ request }) => {
    for (const path of ["/", "/attractions", "/login", "/no-such-page-404", "/api/search/suggest?q=ab", "/sitemap.xml"]) {
      const h = (await request.get(path, { failOnStatusCode: false })).headers();
      expect(h["x-content-type-options"], path).toBe("nosniff");
      expect(h["x-frame-options"], path).toBe("DENY");
      expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(h["strict-transport-security"], path).toContain("max-age=");
      expect(h["permissions-policy"], path).toContain("camera=()");
      expect(h["x-powered-by"], path).toBeUndefined();
      expect(h["content-security-policy"], path).toContain("frame-ancestors 'none'");
      expect(h["content-security-policy"], path).toContain("object-src 'none'");
    }
  });

  test("pages that use maps, forms and search run without Content Security Policy violations", async ({ page }) => {
    const violations: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    for (const path of ["/", "/map", "/search?q=test", "/attractions", "/contact", "/login", "/travel-planner", "/districts"]) {
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(1500);       // let the map and scripts run
      violations.push(...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).map((v) => `${path}: ${v}`));
    }
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("no secret or service key is shipped to the browser", async () => {
    const root = join(process.cwd(), ".next", "static");
    const files: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|css|html|map)$/.test(f)) files.push(p); } };
    walk(root);
    expect(files.length).toBeGreaterThan(0);
    // Real key shapes, not the SDK's own prefix checks (supabase-js contains the text "sb_secret_" to refuse such keys in a browser).
    const bad = [/sb_secret_[A-Za-z0-9_-]{16,}/, /SUPABASE_SERVICE_ROLE/, /PAYSTACK_SECRET/, /RESEND_API_KEY/, /ANTHROPIC_API_KEY/, /sk_(live|test)_[A-Za-z0-9]{10,}/, /re_[A-Za-z0-9]{20,}/];
    const hits: string[] = [];
    for (const f of files) {
      const txt = readFileSync(f, "utf8");
      for (const re of bad) if (re.test(txt)) hits.push(`${f.replace(root, "")}: ${re}`);
      for (const jwt of txt.match(/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g) ?? []) {
        try { if (JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).role === "service_role") hits.push(`${f.replace(root, "")}: a service_role key`); } catch { /* not a JWT */ }
      }
    }
    expect(hits).toEqual([]);
  });

  test("private areas are not indexable and robots.txt blocks them", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    for (const p of ["/admin", "/login", "/register", "/api", "/booking", "/account"]) expect(robots).toContain(`Disallow: ${p}`);
    expect(robots).toContain("Sitemap:");
    for (const p of ["/login", "/register", "/search?q=x"]) {
      const html = await (await request.get(p)).text();
      expect(`${metaContent(html, "name", "robots")}`, p).toMatch(/noindex/);
    }
    for (const p of ["/admin/dashboard", "/partner/dashboard", "/account/bookings"]) {
      const res = await request.get(p, { maxRedirects: 0, failOnStatusCode: false });
      expect([302, 303, 307, 308], p).toContain(res.status());     // signed-out visitors are redirected away
    }
  });
});

test.describe("seo", () => {
  test.skip(({ isMobile }) => isMobile, "markup does not depend on the device");

  test("every sitemap URL is live, unique, canonical, titled, described and indexable", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(urls.length).toBeGreaterThan(5);
    expect(new Set(urls).size).toBe(urls.length);                                   // no duplicates
    const titles = new Map<string, string>();
    const problems: string[] = [];
    for (const path of urls.slice(0, 150)) {
      const res = await request.get(path, { failOnStatusCode: false });
      if (res.status() !== 200) { problems.push(`${path}: status ${res.status()}`); continue; }
      const html = await res.text();
      const title = grab(html, /<title[^>]*>([^<]*)<\/title>/i);
      const desc = metaContent(html, "name", "description");
      const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0].match(/href=["']([^"']+)["']/i)?.[1];
      const robots = metaContent(html, "name", "robots") ?? "";
      const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;
      if (!title) problems.push(`${path}: no title`);
      else { if (title.length > 90) problems.push(`${path}: title too long (${title.length})`); if (titles.has(title)) problems.push(`${path}: same title as ${titles.get(title)}`); titles.set(title, path); }
      if (!desc) problems.push(`${path}: no meta description`); else if (desc.length > 200) problems.push(`${path}: description too long`);
      if (!canonical) problems.push(`${path}: no canonical`); else if (new URL(canonical).pathname !== path) problems.push(`${path}: canonical points to ${canonical}`);
      if (/noindex/i.test(robots)) problems.push(`${path}: is in the sitemap but marked noindex`);
      if (h1s !== 1) problems.push(`${path}: ${h1s} h1 headings`);
      if (!/<html[^>]*lang=["']en/i.test(html)) problems.push(`${path}: no lang`);
      if (!metaContent(html, "property", "og:title")) problems.push(`${path}: no og:title`);
      for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try { const j = JSON.parse(block[1]); if (!j["@context"] || !j["@type"]) problems.push(`${path}: structured data without @context/@type`); } catch { problems.push(`${path}: invalid JSON-LD`); }
      }
    }
    expect(problems).toEqual([]);
  });

  test("empty or thin pages are kept out of search engines", async ({ request }) => {
    // a filter that matches nothing must be noindex (it is a thin, duplicate-looking page)
    const html = await (await request.get("/attractions?q=zzzzzz-no-match")).text();
    expect(metaContent(html, "name", "robots") ?? "").toMatch(/noindex/);
  });

  test("internal links on key pages do not lead to errors", async ({ request }) => {
    const seen = new Set<string>();
    const broken: string[] = [];
    for (const page of PUBLIC) {
      const res = await request.get(page, { failOnStatusCode: false });
      const html = await res.text();
      for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
        const href = m[1];
        if (!href.startsWith("/") || href.startsWith("//") || /^\/(_next|api)\//.test(href) || seen.has(href)) continue;
        seen.add(href);
      }
    }
    for (const href of seen) {
      const r = await request.get(href, { failOnStatusCode: false, maxRedirects: 5 });
      if (r.status() >= 400 && !/^\/(admin|partner\/|account|login\?next|booking)/.test(href)) broken.push(`${href}: ${r.status()}`);
    }
    expect(seen.size).toBeGreaterThan(20);
    expect(broken).toEqual([]);
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/attractions", "/districts", "/culture", "/culture/ceremonies", "/search?q=test", "/contact", "/login", "/register", "/map", "/education", "/transport", "/events", "/travel-planner", "/partner", "/accommodation", "/restaurants"]) {
    test(`no automatically detectable WCAG 2.1 AA violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(800);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(summary).toEqual([]);
    });
  }
});

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");
  for (const width of [360, 412]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const wide: string[] = [];
      for (const path of PUBLIC) {
        await page.goto(path, { waitUntil: "load" });
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (over > 1) wide.push(`${path}: ${over}px too wide`);
      }
      expect(wide).toEqual([]);
    });
  }
});

test.describe("performance budget (local production build)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop budget");
  for (const path of ["/", "/attractions", "/districts", "/search?q=test", "/map"]) {
    test(`${path} stays within a modest transfer and render budget`, async ({ page }) => {
      let bytes = 0, requests = 0;
      page.on("response", async (r) => { requests++; const l = Number(r.headers()["content-length"]); if (Number.isFinite(l) && l > 0) bytes += l; });
      await page.addInitScript(() => {
        const w = window as unknown as { __lcp: number; __cls: number };
        w.__lcp = 0; w.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(2000);
      const m = await page.evaluate(() => ({ lcp: (window as unknown as { __lcp: number }).__lcp, cls: (window as unknown as { __cls: number }).__cls }));
      expect(m.lcp, "largest contentful paint (ms)").toBeLessThan(2500);
      expect(m.cls, "cumulative layout shift").toBeLessThan(0.1);
      expect(bytes, "transferred bytes with a content-length header").toBeLessThan(2_000_000);
      expect(requests, "requests").toBeLessThan(80);
    });
  }
});
