import { expect, test, type Page } from "@playwright/test";
import { hydrated, sql, unique } from "./helpers";
import { startMockPaystack } from "./mock-paystack";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const pw = "E2e-password-123";
const alice = `${unique("alice")}@example.com`, bob = `${unique("bob")}@example.com`;
const tag = unique("pl");
let mock: Awaited<ReturnType<typeof startMockPaystack>>;
let planId = "", shareUrl = "";

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Planner Tester");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test.beforeAll(async () => { mock = await startMockPaystack(); });
test.afterAll(() => mock?.close());

test("setup: published places with verified coordinates", async ({ page }) => {
  await register(page, alice); await register(page, bob);
  const cat = sql(`select id from attraction_categories where slug='natural'`);
  sql(`insert into attractions(slug,name,status,summary,category_id,latitude,longitude) values
    ('${tag}-a','${tag} Viewpoint','published','Test viewpoint','${cat}',6.5000,-1.4100),
    ('${tag}-b','${tag} Boardwalk','published','Test boardwalk','${cat}',6.5030,-1.4100),
    ('${tag}-far','${tag} Far Away','published','Far',null,7.9000,-1.4100)`);
  sql(`insert into experiences(slug,title,category,status) values ('${tag}-bird','${tag} Bird Walk','birdwatching','published')`);
});

test("nearby places show close, published, located items with distance", async ({ page }) => {
  await page.goto(`/attractions/${tag}-a`);
  await expect(page.getByRole("heading", { name: "Nearby" })).toBeVisible();
  const nearby = page.getByRole("heading", { name: "Nearby" }).locator("xpath=following-sibling::ul");
  await expect(nearby.getByText(`${tag} Boardwalk`)).toBeVisible();
  await expect(nearby.getByText(`${tag} Far Away`)).toHaveCount(0);
  await expect(nearby.getByText(/\d+ m|\d\.\d km/).first()).toBeVisible();
});

test("anonymous visitors are asked to sign in", async ({ page }) => {
  await page.goto("/travel-planner");
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
  await page.goto("/travel-planner/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login/);
});

test("create a plan, add places by search, reorder, note, and see suggestions", async ({ page }) => {
  await login(page, alice);
  await page.goto("/travel-planner");
  await hydrated(page);
  await page.getByLabel("Plan name").fill("Alice weekend");
  await page.getByLabel("Number of days").fill("2");
  await page.getByLabel("Nature").check();
  await page.getByRole("button", { name: "Create plan" }).click();
  await expect(page.getByRole("heading", { name: "Alice weekend" })).toBeVisible();
  planId = page.url().split("/travel-planner/")[1].split("?")[0];

  const panel = page.locator("section", { has: page.getByRole("heading", { name: "Add places" }) });
  await page.getByLabel("Search places").fill(tag);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await panel.getByRole("button", { name: `Add ${tag} Viewpoint to plan` }).click();
  await expect(page.getByText("Added to your plan.")).toBeVisible();
  await page.getByLabel("Search places").fill(tag);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await panel.getByRole("button", { name: `Add ${tag} Boardwalk to plan` }).click();
  await expect(page.getByText("Added to your plan.")).toBeVisible();

  // order within the day, then move one to day 2
  const day1 = page.locator("section[aria-labelledby='day-1']");
  await expect(day1.locator("ol > li")).toHaveCount(2);
  await expect(day1.locator("ol > li").nth(0)).toContainText("Viewpoint");
  await day1.getByRole("button", { name: /Move .*Boardwalk up/ }).click();
  await expect(day1.locator("ol > li").nth(0)).toContainText("Boardwalk");
  await day1.locator("ol > li").nth(0).getByLabel("Move to day").selectOption("2");
  await day1.locator("ol > li").nth(0).getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.locator("section[aria-labelledby='day-2']")).toContainText("Boardwalk");

  // note + custom item
  const li = page.locator("section[aria-labelledby='day-1'] ol > li").first();
  await li.getByPlaceholder("Add a note").fill("Go at sunrise");
  await Promise.all([page.waitForResponse((r) => r.request().method() === "POST"), li.getByRole("button", { name: "Save", exact: true }).click()]);
  await expect(page.locator("section[aria-labelledby='day-1'] input[name='note']").first()).toHaveValue("Go at sunrise");
  expect(sql(`select count(*) from itinerary_items where itinerary_id='${planId}' and note='Go at sunrise'`)).toBe("1");
  await page.getByLabel("Or add your own item").fill("Picnic lunch");
  await Promise.all([page.waitForResponse((r) => r.request().method() === "POST"), page.getByRole("button", { name: "Add", exact: true }).last().click()]);
  await expect(page.locator("ol > li", { hasText: "Picnic lunch" })).toBeVisible();

  // interest-based suggestions (nature -> natural attraction / birdwatching experience)
  await expect(page.getByRole("heading", { name: "Suggested for your interests" })).toBeVisible();
  const sugg = page.locator("section", { has: page.getByRole("heading", { name: "Suggested for your interests" }) });
  await expect(sugg.getByText(`${tag} Bird Walk`, { exact: true })).toBeVisible();
  expect(sql(`select count(*) from itinerary_items where itinerary_id='${planId}'`)).toBe("3");
});

test("another user cannot open, edit or print the plan", async ({ page }) => {
  await login(page, bob);
  expect((await page.goto(`/travel-planner/${planId}`))?.status()).toBe(404);
  expect((await page.goto(`/travel-planner/${planId}/print`))?.status()).toBe(404);
  await page.goto("/travel-planner");
  await expect(page.getByText("Alice weekend")).toHaveCount(0);
});

test("share link works read-only for anyone, and stops working when sharing is turned off", async ({ page, browser }) => {
  await login(page, alice);
  await page.goto(`/travel-planner/${planId}`);
  await page.getByRole("button", { name: "Create share link" }).click();
  shareUrl = await page.locator("a", { hasText: "/plan/" }).first().innerText();
  expect(shareUrl).toMatch(/\/plan\/[A-Za-z0-9_-]{22,}$/);

  const anon = await (await browser.newContext()).newPage();
  const path = new URL(shareUrl).pathname;
  expect((await anon.goto(path))?.status()).toBe(200);
  await expect(anon.getByRole("heading", { name: "Alice weekend" })).toBeVisible();
  await expect(anon.getByText(`${tag} Viewpoint`)).toBeVisible();
  await expect(anon.getByRole("button", { name: /Remove|Move/ })).toHaveCount(0);         // read-only
  expect(await anon.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");

  // an unpublished item must not leak through a shared plan
  sql(`update attractions set status='draft' where slug='${tag}-a'`);
  await anon.goto(path);
  await expect(anon.getByText(`${tag} Viewpoint`)).toHaveCount(0);
  await expect(anon.getByText("No longer available").first()).toBeVisible();
  sql(`update attractions set status='published' where slug='${tag}-a'`);

  await Promise.all([page.waitForResponse((r) => r.request().method() === "POST"), page.getByRole("button", { name: "Stop sharing" }).click()]);
  await expect(page.getByRole("button", { name: "Create share link" })).toBeVisible();
  expect((await anon.goto(path))?.status()).toBe(404);
  expect((await anon.goto("/plan/aaaaaaaaaaaaaaaaaaaaaaaaaaaa"))?.status()).toBe(404);
});

test("print view renders the plan without site chrome rules breaking", async ({ page }) => {
  await login(page, alice);
  await page.goto(`/travel-planner/${planId}/print`);
  await expect(page.getByRole("heading", { name: "Alice weekend" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeVisible();
  await expect(page.getByText(/it is not a booking/)).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("body > header")).toBeHidden();
  await expect(page.getByText("Picnic lunch")).toBeVisible();
});

test("AI suggestions come only from published listings; invented items are dropped", async ({ page }) => {
  await login(page, alice);
  await page.goto(`/travel-planner/${planId}`);
  const before = Number(sql(`select count(*) from itinerary_items where itinerary_id='${planId}'`));
  await page.getByRole("button", { name: "Suggest places for my plan" }).click();
  await expect(page.getByText(/from our listings/)).toBeVisible();
  await expect(page.getByText(/ignored because they are not in our listings/)).toBeVisible();   // the mock returns one fake id
  const after = Number(sql(`select count(*) from itinerary_items where itinerary_id='${planId}'`));
  expect(after).toBeGreaterThanOrEqual(before);
  expect(sql(`select count(*) from itinerary_items where itinerary_id='${planId}' and item_id='11111111-2222-3333-4444-555555555555'`)).toBe("0");
  expect(sql(`select count(*) from itinerary_items i where i.itinerary_id='${planId}' and i.item_type<>'custom' and not exists (
    select 1 from attractions a where a.id=i.item_id union all select 1 from experiences e where e.id=i.item_id union all select 1 from listings l where l.id=i.item_id
    union all select 1 from events ev where ev.id=i.item_id union all select 1 from communities c where c.id=i.item_id)`)).toBe("0");
});

test("PWA manifest, icons, service worker and offline page are served", async ({ request }) => {
  const m = await request.get("/manifest.webmanifest");
  expect(m.status()).toBe(200);
  const json = await m.json();
  expect(json.display).toBe("standalone");
  expect((await request.get(json.icons[0].src)).status()).toBe(200);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(await sw.text()).toContain("/admin");     // private areas are excluded from caching
  expect((await request.get("/offline")).status()).toBe(200);
});
