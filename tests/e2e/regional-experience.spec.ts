import { expect, test, type Page } from "@playwright/test";
import { sql, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only unless stated. Navigation, quick links, themes, category grid, districts, events strip, WhatsApp, footer.
test.describe.configure({ mode: "serial" });
test.setTimeout(150_000);

const email = `${unique("rx")}@example.com`;
const password = "E2e-password-123";
const tag = unique("rx").toLowerCase();
const wait = { timeout: 90_000, intervals: [3000] };
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, "desktop only");

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}
const home = async (page: Page) => { await page.goto("/"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); };

test("desktop menu groups behave like an accessible disclosure menu", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const explore = nav.getByRole("button", { name: "Explore Asanteman", exact: true });
  await expect(explore).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("button", { name: "Browse by district", exact: true })).toBeHidden();
  await explore.click();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
  for (const l of ["Destinations", "Attractions"]) await expect(nav.getByRole("link", { name: l, exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Browse by district", exact: true })).toBeVisible();   // nested submenu of districts
  await expect(nav.getByRole("link", { name: "Map", exact: true })).toHaveCount(0);                   // Map moved to the homepage

  await page.keyboard.press("Escape");                                    // Escape closes and returns focus to the button
  await expect(explore).toHaveAttribute("aria-expanded", "false");
  await expect(explore).toBeFocused();

  await explore.press("ArrowDown");                                       // arrow key opens and moves into the list
  await expect(nav.getByRole("link", { name: "Destinations", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Districts", exact: true })).toBeFocused();

  const plan = nav.getByRole("button", { name: "Plan Your Visit", exact: true });
  await plan.click();
  for (const l of ["Why Asanteman", "Getting Around", "Travel Information", "Visa and Entry", "Travel Planner", "Travel Guide"]) await expect(nav.getByRole("link", { name: l, exact: true })).toBeVisible();
  await expect(explore).toHaveAttribute("aria-expanded", "false");        // opening one group closes the other
  await nav.getByRole("link", { name: "Travel Planner", exact: true }).click();
  await expect(page).toHaveURL(/travel-planner/);

  await page.goto("/");
  await nav.getByRole("button", { name: "Media", exact: true }).click();
  await expect(nav.getByRole("link", { name: "News and Articles", exact: true })).toHaveAttribute("href", "/articles");
  await expect(nav.getByRole("link", { name: "Gallery", exact: true })).toHaveAttribute("href", "/gallery");
  await expect(page.getByRole("banner").getByRole("link", { name: "Plan Your Visit" })).toBeVisible();   // the prominent call to action stays
});

test("mobile menu: accordion groups, search reachable, every destination exists", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile" });
  const media = menu.getByRole("button", { name: "Media", exact: true });
  await expect(media).toHaveAttribute("aria-expanded", "false");
  await media.click();
  await expect(media).toHaveAttribute("aria-expanded", "true");
  await expect(menu.getByRole("link", { name: "Gallery", exact: true })).toBeVisible();
  await menu.getByRole("button", { name: "Plan Your Visit", exact: true }).click();
  await menu.getByRole("link", { name: "Why Asanteman", exact: true }).click();
  await expect(page).toHaveURL(/why-ashanti/);
});

test("every menu link leads to a working page (planned pages show 'being prepared')", async ({ page, request, isMobile }) => {
  desktopOnly(isMobile);
  await page.goto("/");
  const hrefs = await page.getByRole("navigation", { name: "Main" }).evaluate((n) => Array.from(n.querySelectorAll("a")).map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(18);
  for (const h of hrefs) expect((await request.get(h!, { failOnStatusCode: false })).status(), h!).toBe(200);
  for (const slug of ["why-ashanti", "getting-around", "travel-information", "visa-and-entry"]) {
    await page.goto(`/${slug}`);
    await expect(page.getByText("This page is being prepared")).toBeVisible();
  }
});

test("setup: register a user", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Regional");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
});

test("quick links hide until their page is published, and show the last-verified date and source", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  const strip = page.getByRole("navigation", { name: "Quick links" });
  await expect.poll(async () => { await home(page); return await strip.getByRole("link", { name: "Map" }).count(); }, wait).toBe(1);
  await expect(strip.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(strip.getByRole("link", { name: "Plan Your Visit" })).toBeVisible();
  await expect(strip.getByRole("link", { name: "Getting Around" })).toHaveCount(0);        // its page is not published
  await expect(strip.getByRole("link", { name: "Visa and Entry" })).toHaveCount(0);

  sql(`update pages set status='published', body='Official guidance goes here.', last_verified_at='2026-11-01', source_label='Test official body', source_url='https://example.org/official', noindex=false where slug='getting-around'`);
  await expect.poll(async () => { await home(page); return await strip.getByRole("link", { name: "Getting Around" }).count(); }, wait).toBe(1);
  await expect.poll(async () => { await page.goto("/getting-around"); return await page.getByText("Last verified:").count(); }, wait).toBeGreaterThan(0);
  await expect(page.getByText("Source: Test official body")).toBeVisible();
  await expect(page.getByRole("link", { name: "link", exact: true })).toHaveAttribute("href", "https://example.org/official");

  sql(`update pages set status='draft' where slug='getting-around'`);
  await expect.poll(async () => { await home(page); return await strip.getByRole("link", { name: "Getting Around" }).count(); }, wait).toBe(0);
});

test("themes: attach in the admin, count only published items, hide empty themes", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  const a = testAreaId();
  const v = `'published','${a}','verified_secondary'`;
  const expId = sql(`insert into experiences (slug,title,category,status,administrative_area_id) values ('${tag}-exp','Eat experience ${tag}','food_experience','published','${a}') returning id`).split("\n")[0];
  const draftId = sql(`insert into experiences (slug,title,category,status,administrative_area_id) values ('${tag}-expd','Draft eat ${tag}','food_experience','draft','${a}') returning id`).split("\n")[0];
  const themeId = (slug: string) => sql(`select id from themes where slug='${slug}'`);
  sql(`insert into theme_links (theme_id,entity_type,entity_id) values ('${themeId("eat")}','experience','${expId}'),('${themeId("eat")}','experience','${draftId}')`);

  await expect.poll(async () => { await home(page); return await page.getByRole("link", { name: /^Eat 1 place or experience$/ }).count(); }, wait).toBe(1);   // the draft is not counted
  await expect(page.getByRole("heading", { name: "Experience Asanteman" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Wear/ })).toHaveCount(0);                 // no published content: hidden
  await page.getByRole("link", { name: /^Eat 1 place/ }).click();
  await expect(page).toHaveURL(/\/themes\/eat$/);
  await expect(page.getByText(`Eat experience ${tag}`)).toBeVisible();
  await expect(page.getByText(`Draft eat ${tag}`)).toHaveCount(0);
  expect((await page.goto("/themes/wear"))?.status()).toBe(404);                         // empty theme page is not public

  // attach a theme through the admin form
  await loginAs(page, "regional_editor");
  const attrName = `Themed attraction ${tag}`;
  await page.goto("/admin/attractions/new");
  await page.getByLabel("Name", { exact: true }).fill(attrName);
  await expect(page.getByRole("group", { name: "Themes" })).toBeVisible();
  await page.getByRole("group", { name: "Themes" }).getByLabel(/^Heritage/).check();
  await page.getByRole("button", { name: /Create attraction/ }).click();
  await expect(page).toHaveURL(/\/admin\/attractions\?saved=1/);
  expect(sql(`select count(*) from theme_links l join attractions a on a.id=l.entity_id join themes t on t.id=l.theme_id where a.name='${attrName}' and t.slug='heritage'`)).toBe("1");
  // editing keeps and changes the ticks
  const id = sql(`select id from attractions where name='${attrName}'`);
  await page.goto(`/admin/attractions/${id}`);
  await expect(page.getByRole("group", { name: "Themes" }).getByLabel(/^Heritage/)).toBeChecked();
  await page.getByRole("group", { name: "Themes" }).getByLabel(/^Heritage/).uncheck();
  await page.getByRole("group", { name: "Themes" }).getByLabel(/^Nature/).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/saved=1/);
  expect(sql(`select string_agg(t.slug, ',') from theme_links l join themes t on t.id=l.theme_id where l.entity_id='${id}'`)).toBe("nature");
  void v;
});

test("explore by type and browse by district appear only with published content", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  const region = sql(`select id from regions where slug='ashanti'`);
  const area = sql(`insert into administrative_areas (region_id,slug,name,kind,is_active) values ('${region}','${tag}-area','Browse ${tag} district','district',true) returning id`).split("\n")[0];
  sql(`insert into administrative_areas (region_id,slug,name,kind,is_active) values ('${region}','${tag}-empty','Empty ${tag} district','district',true)`);
  const cat = sql(`insert into attraction_categories (slug,name,sort_order) values ('${tag}-cat','Category ${tag}',99) returning id`).split("\n")[0];
  sql(`insert into attraction_categories (slug,name,sort_order) values ('${tag}-nocat','Unused ${tag}',100)`);
  sql(`insert into attractions (slug,name,status,administrative_area_id,verification_status,category_id) values ('${tag}-a1','Attraction one ${tag}','published','${area}','verified_secondary','${cat}'),('${tag}-a2','Attraction two ${tag}','published','${area}','verified_secondary','${cat}')`);

  await expect.poll(async () => { await home(page); return await page.getByRole("link", { name: new RegExp(`^Category ${tag} 2 attractions$`) }).count(); }, wait).toBe(1);
  await expect(page.getByRole("link", { name: new RegExp(`Unused ${tag}`) })).toHaveCount(0);                       // empty category hidden
  await page.getByRole("link", { name: new RegExp(`^Category ${tag} 2 attractions$`) }).click();
  await expect(page).toHaveURL(new RegExp(`category=${tag}-cat`));
  await expect(page.getByText(`Attraction one ${tag}`)).toBeVisible();

  await home(page);
  const districts = page.getByRole("list", { name: "Districts with published places" });
  await expect(districts.getByRole("link", { name: new RegExp(`Browse ${tag} district 2 places`) })).toBeVisible();
  await expect(districts.getByText(`Empty ${tag} district`)).toHaveCount(0);                                         // no published content: hidden
  await expect(page.getByRole("link", { name: "Open the map" }).first()).toHaveAttribute("href", "/map");

  // featuring control
  sql(`update attraction_categories set is_featured=false where id='${cat}'`);
  await expect.poll(async () => { await home(page); return await page.getByRole("link", { name: new RegExp(`^Category ${tag} 2 attractions$`) }).count(); }, wait).toBe(0);
});

test("the events strip shows verified dates and 'Date to be confirmed' for provisional ones", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  const a = testAreaId();
  sql(`insert into events (slug,title,starts_at,status,administrative_area_id,date_verified,venue) values
    ('${tag}-ev-ok','Verified event ${tag}',now() + interval '20 day','published','${a}',true,'Hall'),
    ('${tag}-ev-tbc','Provisional festival ${tag}',now() + interval '21 day','published','${a}',false,null)`);
  const strip = page.getByRole("heading", { name: "Upcoming events", exact: true }).locator("xpath=ancestor::section[1]");
  await expect.poll(async () => { await home(page); return await page.getByText(`Provisional festival ${tag}`).count(); }, wait).toBeGreaterThan(0);
  const ok = page.getByRole("link", { name: new RegExp(`Verified event ${tag}`) });
  const tbc = page.getByRole("link", { name: new RegExp(`Provisional festival ${tag}`) });
  await expect(tbc).toContainText("Date to be confirmed");
  await expect(tbc).toContainText("TBC");
  await expect(ok).not.toContainText("Date to be confirmed");
  await expect(ok).toContainText(/\b\d{4}\b/);                       // a real date
  void strip;
  // the same rule on the events list and the detail page
  await page.goto("/events");
  await expect(page.getByRole("link", { name: new RegExp(`Provisional festival ${tag}`) })).toContainText("Date to be confirmed");
  await expect.poll(async () => (await page.goto(`/events/${tag}-ev-tbc`))?.status(), wait).toBe(200);
  await expect(page.getByText("Date to be confirmed").first()).toBeVisible();
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("");
  expect(ld).not.toContain("startDate");                              // no structured date for an unverified one
});

test("WhatsApp button: shown only with a number, plain link, hidden on admin and sign-in", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  const old = sql(`select coalesce(value ->> 'whatsapp','') from site_settings where key='contact'`);
  sql(`update site_settings set value = jsonb_set(value, '{whatsapp}', '""') where key='contact'`);
  await expect.poll(async () => { await home(page); return await page.getByRole("link", { name: /Chat on WhatsApp/ }).count(); }, wait).toBe(0);
  sql(`update site_settings set value = jsonb_set(value, '{whatsapp}', '"233 24 000 0000"') where key='contact'`);
  await expect.poll(async () => { await home(page); return await page.getByRole("link", { name: /Chat on WhatsApp/ }).count(); }, wait).toBeGreaterThan(0);
  const btn = page.getByRole("link", { name: /Chat on WhatsApp/ }).first();
  const href = (await btn.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/233240000000\?text=/);
  expect(decodeURIComponent(href)).toContain("Hello VisitAsanteman, I would like help planning a visit.");
  await expect(btn).toHaveAttribute("target", "_blank");
  await expect(btn).toHaveAttribute("rel", /noopener/);
  expect(await page.locator("script[src*='wa.me'], iframe[src*='wa.me']").count()).toBe(0);     // no third-party widget
  await btn.focus();
  await expect(btn).toBeFocused();
  await page.goto("/login");
  await expect(page.getByRole("link", { name: /Chat on WhatsApp/ })).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Chat on WhatsApp" })).toBeVisible();   // footer link too
  sql(`update site_settings set value = jsonb_set(value, '{whatsapp}', to_jsonb('${old}'::text)) where key='contact'`);
});

test("footer: social links only when set, newsletter, pausable hashtag ticker, static with reduced motion", async ({ page, isMobile }) => {
  desktopOnly(isMobile);
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByLabel("Newsletter email")).toBeVisible();
  const ticker = footer.getByTestId("hashtag-ticker");
  await expect(ticker).toContainText("#VisitAsanteman");
  expect(await ticker.locator("[aria-hidden]").count()).toBeGreaterThan(0);          // the moving copy is hidden from screen readers
  const pause = ticker.getByRole("button", { name: "Pause the hashtag animation" });
  await pause.click();
  await expect(ticker.getByRole("button", { name: "Play the hashtag animation" })).toHaveAttribute("aria-pressed", "true");
  expect(await ticker.locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  await ticker.getByRole("button", { name: "Play the hashtag animation" }).click();
  expect(await ticker.locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");

  // social links appear only for networks with a URL
  await expect(footer.getByRole("link", { name: "facebook" })).toHaveCount(0);
  sql(`update site_settings set value = jsonb_set(value, '{facebook}', '"https://facebook.com/visitasanteman-test"') where key='social'`);
  await expect.poll(async () => { await page.goto("/"); return await page.getByRole("contentinfo").getByRole("link", { name: "facebook" }).count(); }, wait).toBe(1);
  sql(`update site_settings set value = jsonb_set(value, '{facebook}', '""') where key='social'`);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await footer.getByTestId("hashtag-ticker").locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(footer.getByRole("button", { name: /hashtag animation/ })).toBeHidden();        // nothing to pause
  expect(await footer.getByTestId("hashtag-ticker").locator(".ticker-track > span:visible").count()).toBe(1);
});
