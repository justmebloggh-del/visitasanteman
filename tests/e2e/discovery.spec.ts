import { expect, test, type Page } from "@playwright/test";
import { sql, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only. Search, map, experiences, curated itineraries, coordinate picker.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);   // some steps wait for page caches (up to 90 s) to refresh

const password = "E2e-password-123";
const staff = `${unique("stf")}@example.com`;
const visitor = `${unique("vis")}@example.com`;
const tag = unique("dsc").toLowerCase();
const word = `zorbax${tag.slice(-6)}`;   // a made-up word so searches only find this test's records
const wait = { timeout: 90_000, intervals: [3000] };
let planId = "";

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Discovery");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
}
async function loginAs(page: Page, email: string, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("site-wide search finds every kind of published record, filters, and hides drafts", async ({ page, request }) => {
  const a = testAreaId();
  const v = `'published','${a}','verified_secondary'`;
  sql(`insert into attractions (slug,name,summary,status,administrative_area_id,verification_status,alt_names) values ('${tag}-attr','Attraction ${word}','A place.',${v},'{"Spelling ${word}x"}'),('${tag}-attr-draft','Draft ${word}',null,'draft','${a}','awaiting_verification','{}')`);
  sql(`insert into institutions (slug,name,kind,status,administrative_area_id,verification_status) values ('${tag}-inst','School ${word}','senior_high',${v})`);
  sql(`insert into ceremonies (slug,name,status,administrative_area_id,verification_status,authority_approved) values ('${tag}-cer','Ceremony ${word}',${v},true)`);
  sql(`insert into listings (slug,type,name,status,administrative_area_id) values ('${tag}-cafe','cafe','Cafe ${word}','published','${a}')`);
  sql(`insert into transport_providers (slug,name,kind,status,administrative_area_id,verification_status) values ('${tag}-trn','Transport ${word}','taxi',${v})`);

  await page.goto(`/search?q=${word}`);
  for (const t of ["Attraction", "School", "Ceremony", "Cafe", "Transport"]) await expect(page.getByRole("link", { name: new RegExp(`^${t} ${word}`) })).toBeVisible();
  await expect(page.getByText(`Draft ${word}`)).toHaveCount(0);
  await expect(page.getByText("5 results")).toBeVisible();
  await expect(page.getByText("Ceremony or festival").first()).toBeVisible();     // record types are labelled

  await page.goto(`/search?q=${word}&kind=institution`);
  await expect(page.getByText("1 result")).toBeVisible();
  await page.goto(`/search?q=${word}x`);                                             // alternative spelling
  await expect(page.getByRole("link", { name: new RegExp(`^Attraction ${word}`) })).toBeVisible();
  await page.goto(`/search?q=${word}&area=no-such-district`);
  await expect(page.getByText(/No results for/)).toBeVisible();
  await page.goto("/search?q=qqqzzzxxx");
  await expect(page.getByText(/No results for/)).toBeVisible();
  await page.goto("/search?q=%25");                                                  // a lone % is text, not "match everything"
  await expect(page.getByText(/No results for/)).toBeVisible();

  const ok = await request.get(`/api/search/suggest?q=${word}`);
  const body = await ok.json();
  expect(body.suggestions.length).toBe(5);
  expect(JSON.stringify(body)).not.toContain("Draft");
  expect((await (await request.get("/api/search/suggest?q=a")).json()).suggestions).toEqual([]);   // too short
});

test("the home search box offers suggestions as you type", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").first().fill(word);
  await expect(page.getByRole("listbox", { name: "Suggestions" })).toBeVisible();
  await expect(page.getByRole("option").first()).toContainText(word);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox", { name: "Suggestions" })).toHaveCount(0);
});

test("the map includes education, sports and transport places and offers a list view", async ({ page }) => {
  const a = testAreaId();
  sql(`insert into institutions (slug,name,kind,status,administrative_area_id,verification_status,latitude,longitude) values ('${tag}-mapinst','Mapped school ${tag}','senior_high','published','${a}','verified_secondary',6.7,-1.6)`);
  await expect.poll(async () => { await page.goto("/map"); await page.getByRole("group", { name: "Map categories" }).waitFor({ timeout: 15_000 }).catch(() => undefined); return await page.getByRole("button", { name: "Education" }).count(); }, wait).toBeGreaterThan(0);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.getByRole("link", { name: `Mapped school ${tag}` })).toBeVisible();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("region", { name: "Interactive map" })).toBeVisible();
});

test("new experience categories and price on request", async ({ page }) => {
  const a = testAreaId();
  sql(`insert into experiences (slug,title,category,status,administrative_area_id,price_on_request,min_age) values ('${tag}-exp','Craft day ${tag}','craft_workshop','published','${a}',true,12)`);
  await expect.poll(async () => (await page.goto(`/experiences/${tag}-exp`))?.status(), wait).toBe(200);
  await expect(page.getByText("Price on request")).toBeVisible();
  await expect(page.getByText("Minimum age: 12")).toBeVisible();
  await page.goto("/experiences");
  await expect(page.getByLabel("Type").locator("option", { hasText: "Craft workshops" })).toHaveCount(1);
  await expect(page.getByLabel("Type").locator("option", { hasText: "Waterfall visits" })).toHaveCount(1);
});

test("setup: register staff and a visitor", async ({ page }) => {
  await register(page, staff);
  await register(page, visitor);
  const uid = sql(`select id from auth.users where email='${staff}'`);
  planId = sql(`insert into travel_itineraries (user_id,title,days) values ('${uid}','Plan ${tag}',2) returning id`).split("\n")[0];
  sql(`insert into itinerary_items (itinerary_id,day,item_type,item_id) select '${planId}',1,'attraction',id from attractions where slug='${tag}-attr'`);
  sql(`insert into itinerary_items (itinerary_id,day,item_type,item_id) select '${planId}',2,'attraction',id from attractions where slug='${tag}-attr-draft'`);
  sql(`insert into itinerary_items (itinerary_id,day,item_type,custom_title) values ('${planId}',2,'custom','Lunch ${tag}')`);
});

test("staff publish a plan as a curated itinerary; visitors see it and copy it", async ({ page }) => {
  await loginAs(page, staff, "regional_editor");
  await page.goto(`/travel-planner/${planId}`);
  await page.getByText("Publish as a curated itinerary (staff)").click();
  await page.getByLabel("Title", { exact: true }).fill(`Itinerary ${tag}`);
  await page.getByLabel("Theme").fill("Heritage");
  await page.getByRole("button", { name: "Create curated draft" }).click();
  await expect(page).toHaveURL(/\/admin\/curated-itineraries\/[0-9a-f-]{36}\?saved=1/);
  expect(sql(`select status||'|'||(itinerary_id is not null) from curated_itineraries where title='Itinerary ${tag}'`)).toBe("draft|true");

  // draft: not public; the nine brief titles are empty placeholders and not public either
  const anon = await (await page.context().browser()!.newContext()).newPage();
  expect((await anon.goto(`/travel-planner/itineraries/itinerary-${tag}`))?.status()).toBe(404);
  expect(sql(`select count(*) from curated_itineraries where itinerary_id is null and status='draft'`)).toBe("9");   // the brief's itinerary titles are empty placeholders

  // publish from the admin list
  await page.goto(`/admin/curated-itineraries`);
  await page.getByRole("row", { name: new RegExp(`Itinerary ${tag}`) }).getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await expect.poll(async () => (await anon.goto(`/travel-planner/itineraries/itinerary-${tag}`))?.status(), wait).toBe(200);
  await expect(anon.getByText(`Attraction ${word}`).first()).toBeVisible();
  await expect(anon.getByText(`Lunch ${tag}`)).toBeVisible();
  await expect(anon.getByText("No longer available").first()).toBeVisible();                      // the draft place is not leaked
  await expect(anon.getByText(`Draft ${word}`)).toHaveCount(0);
  await expect(anon.getByText(/suggestion, not a booking/)).toBeVisible();
  await expect.poll(async () => { await anon.goto("/travel-planner/itineraries"); return await anon.getByText(`Itinerary ${tag}`).count(); }, wait).toBeGreaterThan(0);
  await expect(anon.getByText("Lake Bosomtwe weekend")).toHaveCount(0);

  // a signed-in visitor copies it into their own plans
  await loginAs(page, visitor, "visitor");
  await page.goto(`/travel-planner/itineraries/itinerary-${tag}`);
  await page.getByRole("button", { name: "Use as a starting point" }).click();
  await expect(page).toHaveURL(/\/travel-planner\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: `Itinerary ${tag}` })).toBeVisible();
  expect(sql(`select count(*) from itinerary_items i join travel_itineraries t on t.id=i.itinerary_id where t.title='Itinerary ${tag}' and t.user_id=(select id from auth.users where email='${visitor}')`)).toBe("2");   // the draft place was left out
  await anon.context().close();
});

test("the admin location form has a map that fills in latitude and longitude", async ({ page }) => {
  await loginAs(page, staff, "regional_editor");
  await page.goto("/admin/attractions/new");
  const map = page.getByRole("region", { name: "Map for choosing coordinates" });
  await expect(map).toBeVisible();
  await map.click({ position: { x: 150, y: 100 } });
  await expect(page.getByLabel("Latitude")).toHaveValue(/^-?\d+\.\d{6}$/);
  await expect(page.getByLabel("Longitude")).toHaveValue(/^-?\d+\.\d{6}$/);
});
