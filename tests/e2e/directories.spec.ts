import { expect, test, type Page } from "@playwright/test";
import { sql, TEST_AREA_NAME, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only. Education, sports and transport directories.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);   // some steps wait for page caches (up to 90 s) to refresh

const email = `${unique("dir")}@example.com`;
const password = "E2e-password-123";
const tag = unique("dir").toLowerCase();
const wait = { timeout: 90_000, intervals: [3000] };

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("researched starter records exist as drafts, are not public and hold no invented detail", async ({ page }) => {
  expect(sql(`select count(*) from institutions where status='draft' and verification_status='awaiting_verification'`)).toBe("13");
  expect(sql(`select count(*) from institutions where programmes is not null or contact_phone is not null or latitude is not null or recognition_note is not null`)).toBe("0");
  expect(sql(`select count(*) from sports_venues where status='draft' and capacity is null and facility_status='unknown'`)).toBe("2");
  expect(sql(`select count(*) from transport_providers where fare_info is null and operating_info is null and routes is null`)).toBe("3");
  expect(sql(`select facility_status from transport_providers where slug='boankra-inland-port'`)).toBe("under_development");
  for (const p of ["/education/kwame-nkrumah-university-of-science-and-technology", "/sports/baba-yara-sports-stadium", "/transport/boankra-inland-port"]) {
    expect((await page.goto(p))?.status()).toBe(404);
  }
});

test("published records appear with the right notices, filters and links", async ({ page }) => {
  const a = testAreaId();
  const v = `'published','${a}','verified_secondary'`;
  const venueId = sql(`insert into sports_venues (slug,name,sports,status,administrative_area_id,verification_status,facility_status,capacity) values ('${tag}-venue','Venue ${tag}','{Football}',${v},'under_development',5000) returning id`).split("\n")[0];
  sql(`insert into institutions (slug,name,kind,status,administrative_area_id,verification_status,visitor_access,programmes) values
       ('${tag}-uni','Uni ${tag}','university',${v},'permission_required','Programmes as stated by the institution.'),
       ('${tag}-col','College ${tag}','college_of_education',${v},'unknown',null)`);
  sql(`insert into transport_providers (slug,name,kind,status,administrative_area_id,verification_status,facility_status,fare_info,fare_updated_at) values
       ('${tag}-taxi','Taxi ${tag}','taxi',${v},'operational','Fares as quoted by the operator.','2026-11-01'),
       ('${tag}-port','Port ${tag}','port',${v},'proposed',null,null)`);
  sql(`insert into sports_clubs (slug,name,sport,status,administrative_area_id,verification_status,home_venue_id) values ('${tag}-club','Club ${tag}','Football',${v},'${venueId}')`);
  sql(`insert into events (slug,title,starts_at,status,administrative_area_id,category) values
       ('${tag}-match','Match ${tag}',now() + interval '10 day','published','${a}','sports'),
       ('${tag}-open','Open day ${tag}',now() + interval '11 day','published','${a}','education')`);

  await expect.poll(async () => { await page.goto("/education"); return await page.getByText(`Uni ${tag}`).count(); }, wait).toBeGreaterThan(0);
  await page.goto("/education?kind=college_of_education");
  await expect(page.getByText(`College ${tag}`).first()).toBeVisible();
  await expect(page.getByText(`Uni ${tag}`)).toHaveCount(0);

  await expect.poll(async () => (await page.goto(`/education/${tag}-uni`))?.status(), wait).toBe(200);
  await expect(page.getByLabel("Visitor access")).toContainText("Permission or a permit is required");
  await expect(page.getByText("Programmes as stated by the institution.")).toBeVisible();

  await expect.poll(async () => (await page.goto(`/sports/${tag}-venue`))?.status(), wait).toBe(200);
  await expect(page.getByLabel("Operating status")).toContainText("Under development");
  await expect(page.getByText("5000")).toBeVisible();

  await expect.poll(async () => (await page.goto(`/transport/${tag}-taxi`))?.status(), wait).toBe(200);
  await expect(page.getByText("Fares as quoted by the operator.")).toBeVisible();
  await expect(page.getByText("Fare information last updated")).toBeVisible();
  await expect(page.getByLabel("Operating status")).toHaveCount(0);   // operational: no warning

  await expect.poll(async () => (await page.goto(`/transport/${tag}-port`))?.status(), wait).toBe(200);
  await expect(page.getByLabel("Operating status")).toContainText("Proposed");

  await expect.poll(async () => (await page.goto(`/sports/clubs/${tag}-club`))?.status(), wait).toBe(200);
  await expect(page.getByRole("link", { name: `Venue ${tag}` })).toBeVisible();

  await expect.poll(async () => { await page.goto("/sports/events"); return await page.getByText(`Match ${tag}`).count(); }, wait).toBeGreaterThan(0);
  await expect(page.getByText(`Open day ${tag}`)).toHaveCount(0);
  await expect.poll(async () => { await page.goto("/education/events"); return await page.getByText(`Open day ${tag}`).count(); }, wait).toBeGreaterThan(0);
  await expect(page.getByText(`Match ${tag}`)).toHaveCount(0);

  await page.goto("/transport?kind=taxi");
  await expect(page.getByText(`Taxi ${tag}`).first()).toBeVisible();
  await expect(page.getByText(`Port ${tag}`)).toHaveCount(0);
});

test("setup: register a user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Directories");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
});

test("a regional editor creates and publishes an institution; the database refuses without verification", async ({ page }) => {
  await loginAs(page, "regional_editor");
  const name = `Admin college ${tag}`;
  await page.goto("/admin/institutions/new");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Type", { exact: true }).selectOption("tvet");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByLabel("District / municipality / metropolis").selectOption({ label: TEST_AREA_NAME });
  await page.getByRole("button", { name: /Create institution/ }).click();
  await expect(page).not.toHaveURL(/saved=1/);                       // still "awaiting verification": refused
  expect(sql(`select count(*) from institutions where name='${name}'`)).toBe("0");

  await page.getByLabel("Verification status").selectOption("verified_secondary");
  await page.getByLabel("Source organisation").fill("Test source");
  await page.getByRole("button", { name: /Create institution/ }).click();
  await expect(page).toHaveURL(/\/admin\/institutions\?saved=1/);
  expect(sql(`select status||'|'||kind||'|'||verification_status from institutions where name='${name}'`)).toBe("published|tvet|verified_secondary");
});

test("sports and education event categories can be set in the admin", async ({ page }) => {
  await loginAs(page, "regional_editor");
  await page.goto("/admin/events/new");
  await expect(page.getByLabel("Category")).toBeVisible();
  await expect(page.getByLabel("Category").locator("option")).toHaveText(["General", "Sports", "Education", "Cultural", "Business"]);
});
