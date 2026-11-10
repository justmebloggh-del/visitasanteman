import { expect, test, type Page } from "@playwright/test";
import { sql, TEST_AREA_NAME, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase (npx supabase start). Desktop project only, except the mobile menu test.
const email = `${unique("geo")}@example.com`;
const password = "E2e-password-123";
const tag = unique("geo").toLowerCase();

const SIMPLE = ["Experiences", "Where to Stay", "Food & Dining", "Events", "Business Directory", "About Us", "Contact"];
const GROUPS = ["Explore Asanteman", "Culture & Heritage", "Plan Your Visit", "Media"];

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}
const setRole = (role: string) => sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);

test.describe("VisitAsanteman brand and navigation", () => {
  test("home carries the new brand and no Lake Bosomtwe wording", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Discover Asanteman\. Experience Our Heritage\./);
    await expect(page.getByRole("link", { name: /VisitAsanteman, home/ })).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(/bosomtw/i);
    expect(await page.title()).toContain("VisitAsanteman");
  });

  test("desktop menu lists the grouped items and Plan Your Visit", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of SIMPLE) await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    for (const label of GROUPS) await expect(nav.getByRole("button", { name: label, exact: true })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Plan Your Visit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  });

  test("mobile menu lists all items, Plan Your Visit and search", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    for (const label of SIMPLE) await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
    for (const label of GROUPS) await expect(menu.getByRole("button", { name: label, exact: true })).toBeVisible();
    await expect(page.locator("#mobile-menu").getByRole("link", { name: "Plan Your Visit" })).toBeVisible();
    await page.locator("#mobile-menu").getByRole("link", { name: "Plan Your Visit" }).click();
    await expect(page).toHaveURL(/travel-planner/);
  });

  test("menu-name aliases redirect permanently, page to page", async ({ request }) => {
    for (const [from, to] of [["/where-to-stay", "/accommodation"], ["/food-and-dining", "/restaurants"], ["/culture-and-heritage", "/culture"], ["/plan-your-visit", "/travel-planner"]]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(new URL(res.headers().location, "http://x").pathname).toBe(to);
    }
  });

  test("culture hub says it is being prepared until pages are published", async ({ page }) => {
    await page.goto("/culture/festivals");
    await expect(page.getByText("This page is being prepared")).toBeVisible();
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("advertise and partner-with-us enquiries are stored as partnership enquiries", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    const who = unique("Adv ");
    await page.goto("/advertise");
    await page.getByLabel("Your name").fill(who);
    await page.getByLabel("Email", { exact: true }).fill("adv@example.com");
    await page.getByLabel("Message").fill("We would like to promote our guesthouse on the site.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Your message has been sent")).toBeVisible();
    expect(sql(`select kind from enquiries where name='${who}'`)).toBe("partnership");
  });
});

test.describe("districts, destinations and region filters", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");
  test.setTimeout(120_000);   // these wait for page caches (up to 90 s) to refresh
  const area = `e2e-area-${tag}`;
  const hidden = `e2e-hidden-${tag}`;

  test("a district lists only its published places and unknown or inactive districts 404", async ({ page, request }) => {
    const region = sql(`select id from regions where slug='ashanti'`);
    const a = sql(`insert into administrative_areas (region_id,slug,name,kind,is_active,source) values ('${region}','${area}','E2E ${tag} district','district',true,'test fixture') returning id`).split("\n")[0];
    sql(`insert into administrative_areas (region_id,slug,name,kind,is_active) values ('${region}','${hidden}','E2E ${tag} inactive','municipal',false)`);
    sql(`insert into attractions (slug,name,status,administrative_area_id,verification_status) values ('${tag}-pub','Published ${tag}','published','${a}','verified_secondary'),('${tag}-draft','Draft ${tag}','draft','${a}','verified_secondary')`);

    await expect.poll(async () => (await page.goto(`/districts/${area}`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`E2E ${tag} district`);
    await expect(page.getByText(`Published ${tag}`).first()).toBeVisible();
    await expect(page.getByText(`Draft ${tag}`)).toHaveCount(0);
    expect((await page.goto(`/districts/${hidden}`))?.status()).toBe(404);   // inactive areas are not public

    // region filter on the directory
    await page.goto(`/attractions?area=${area}`);
    await expect(page.getByText(`Published ${tag}`).first()).toBeVisible();
    await page.goto(`/attractions?area=${hidden}`);
    await expect(page.getByText(`Published ${tag}`)).toHaveCount(0);
    await expect(page.getByLabel("District")).toBeVisible();

    // the district list and sitemap include it; the inactive one is absent
    // The list page is cached for a minute, so reload until the new district appears.
    await expect.poll(async () => { await page.goto("/districts"); return await page.getByRole("link", { name: new RegExp(`E2E ${tag} district`) }).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);
    await expect(page.getByText(`E2E ${tag} inactive`)).toHaveCount(0);
    // The sitemap is cached for an hour, so only the fixed entries are asserted here.
    const map = await (await request.get("/sitemap.xml")).text();
    expect(map).toContain("/contact");
    expect(map).not.toContain(hidden);
  });

  test("a published destination is public, a draft is not", async ({ page }) => {
    const a = testAreaId();
    sql(`insert into destinations (slug,name,administrative_area_id,status,summary) values ('${tag}-dest','Dest ${tag}','${a}','published','Test destination'),('${tag}-dest-draft','Draft dest ${tag}','${a}','draft',null)`);
    await expect.poll(async () => (await page.goto(`/destinations/${tag}-dest`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Dest ${tag}`);
    await expect(page.getByRole("link", { name: TEST_AREA_NAME })).toBeVisible();
    expect((await page.goto(`/destinations/${tag}-dest-draft`))?.status()).toBe(404);
  });
});

test.describe.serial("roles and the geography admin", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("setup: register a user", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Geography");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/verify-email/);
  });

  test("content editor cannot manage districts, approve or publish", async ({ page }) => {
    setRole("editor");
    await login(page);
    await page.goto("/admin/administrative-areas");
    await page.waitForURL(/\/admin\/dashboard/);                                // bounced to the admin home
    await page.waitForLoadState("load");
    await page.goto("/admin/attractions");
    await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
  });

  test("regional editor adds a district and publishes content into it", async ({ page }) => {
    setRole("regional_editor");
    await login(page);
    const name = `E2E ${tag} added district`;
    await page.goto("/admin/administrative-areas/new");
    await page.getByLabel("Name (as named by the official source)").fill(name);
    await page.getByLabel("Region").selectOption({ label: "Ashanti Region" });
    await page.getByLabel("Type").selectOption("district");
    await page.getByLabel("Source of this record").fill("End-to-end test fixture");
    await page.getByRole("button", { name: /Create administrative area/ }).click();
    await expect(page).toHaveURL(/administrative-areas\?saved=1/);
    expect(sql(`select count(*) from administrative_areas where name='${name}'`)).toBe("1");

    // publishing without a district is refused with a clear message
    await page.goto("/admin/attractions/new");
    await page.getByLabel("Name", { exact: true }).fill(`NoArea ${tag}`);
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await page.getByLabel("Verification status").selectOption("verified_secondary");
    await page.getByRole("button", { name: /Create attraction/ }).click();
    await expect(page.getByText(/Choose a district, municipality or metropolis/)).toBeVisible();

    // with a district it publishes
    await page.getByLabel("District / municipality / metropolis").selectOption({ label: name });
    await page.getByRole("button", { name: /Create attraction/ }).click();
    await expect(page).toHaveURL(/\/admin\/attractions\?saved=1/);
    expect(sql(`select status from attractions where name='NoArea ${tag}'`)).toBe("published");
  });

  test("the database refuses to publish without a district even when the interface is bypassed", async () => {
    let refused = false;
    try { sql(`insert into attractions (slug,name,status,verification_status) values ('${tag}-bypass','Bypass ${tag}','published','verified_secondary')`); } catch { refused = true; }
    expect(refused).toBe(true);
  });

  test("media manager sees the media library only", async ({ page }) => {
    setRole("media_manager");
    await login(page);
    await page.goto("/admin/media");
    await expect(page.getByRole("heading", { name: "Media library" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link")).toHaveCount(2);   // Media library + View website
    await page.goto("/admin/attractions");
    await expect(page).not.toHaveURL(/\/admin\/attractions/);
    await page.goto("/admin/enquiries");
    await expect(page).not.toHaveURL(/\/admin\/enquiries/);
  });

  test("revision history appears on an edited item", async ({ page }) => {
    setRole("regional_editor");
    await login(page);
    const id = sql(`select id from attractions where name='NoArea ${tag}'`);
    await page.goto(`/admin/attractions/${id}`);
    await page.getByLabel("Short summary").fill("Edited once.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/saved=1/);
    await page.goto(`/admin/attractions/${id}`);
    await expect(page.getByRole("heading", { name: "Revision history" })).toBeVisible();
    await expect(page.getByText(/was “NoArea/)).toBeVisible();
  });
});
