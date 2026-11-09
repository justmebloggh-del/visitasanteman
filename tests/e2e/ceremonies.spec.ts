import { expect, test, type Page } from "@playwright/test";
import { sql, TEST_AREA_NAME, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);   // some steps wait for page caches (up to 90 s)

const email = `${unique("cer")}@example.com`;
const password = "E2e-password-123";
const tag = unique("cer").toLowerCase();
const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 15, 9, 30));
const monthKey = nextMonth.toISOString().slice(0, 7);

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("public ceremony pages: confirmed date, unconfirmed date, restricted, draft", async ({ page, request }) => {
  const a = testAreaId();
  const base = "status,administrative_area_id,authority_approved,verification_status";
  const v = `'published','${a}',true,'verified_secondary'`;
  sql(`insert into ceremonies (slug,name,kind,summary,starts_at,date_confirmed,attendance,etiquette,dress_guidance,photography_rules,organiser,${base}) values
    ('${tag}-confirmed','Confirmed ${tag}','festival','A confirmed festival.','${nextMonth.toISOString()}',true,'public','Greet the elders first.','Wear dark colours.','Ask before photographing.','Test Council',${v}),
    ('${tag}-undated','Undated ${tag}','ceremony','No date this year.',null,false,'public_with_conditions',null,null,null,null,${v}),
    ('${tag}-restricted','Restricted ${tag}','ceremony','A private rite.',null,false,'restricted',null,null,null,null,${v})`);
  sql(`insert into ceremonies (slug,name,status,administrative_area_id) values ('${tag}-draft','Draft ${tag}','draft','${a}')`);

  await expect.poll(async () => (await page.goto(`/culture/ceremonies/${tag}-confirmed`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Confirmed ${tag}`);
  await expect(page.getByLabel("Public attendance")).toContainText("Open to the public");
  await expect(page.getByText("15 ", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Greet the elders first.")).toBeVisible();
  await expect(page.getByText("Wear dark colours.")).toBeVisible();
  await expect(page.getByText("Ask before photographing.")).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').allTextContents().then((t) => t.join(""))).toContain('"@type":"Event"');

  const ics = await request.get(`/culture/ceremonies/${tag}-confirmed/calendar.ics`);
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const body = await ics.text();
  expect(body).toContain(`SUMMARY:Confirmed ${tag}`);
  expect(body).toContain(`DTSTART:${monthKey.replace("-", "")}15T093000Z`);

  await expect.poll(async () => (await page.goto(`/culture/ceremonies/${tag}-undated`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByText(/date for this year has not been confirmed/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Add to my calendar/ })).toHaveCount(0);
  expect((await request.get(`/culture/ceremonies/${tag}-undated/calendar.ics`)).status()).toBe(404);
  expect(await page.locator('script[type="application/ld+json"]').allTextContents().then((t) => t.join(""))).not.toContain('"@type":"Event"');

  await expect.poll(async () => (await page.goto(`/culture/ceremonies/${tag}-restricted`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByLabel("Public attendance")).toContainText("Restricted");
  expect((await page.goto(`/culture/ceremonies/${tag}-draft`))?.status()).toBe(404);

  // directory lists the published ones; calendar lists only confirmed dates in that month
  await expect.poll(async () => { await page.goto("/culture/ceremonies"); return await page.getByText(`Undated ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);
  await expect(page.getByText(`Draft ${tag}`)).toHaveCount(0);
  await expect(page.getByText("Date to be confirmed").first()).toBeVisible();
  await expect.poll(async () => { await page.goto(`/culture/calendar?month=${monthKey}`); return await page.getByText(`Confirmed ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);
  await expect(page.getByText(`Undated ${tag}`)).toHaveCount(0);
  await expect(page.getByText(`Restricted ${tag}`)).toHaveCount(0);
});

test("setup: register a user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Ceremonies");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
});

test("a content editor cannot record authority approval; a regional editor can and then publishes", async ({ page }) => {
  await loginAs(page, "editor");
  await page.goto("/admin/ceremonies/new");
  await expect(page.getByLabel(/Traditional authority or organiser has approved/)).toBeDisabled();

  await loginAs(page, "regional_editor");
  const name = `Admin ceremony ${tag}`;
  await page.goto("/admin/ceremonies/new");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByLabel("District / municipality / metropolis").selectOption({ label: TEST_AREA_NAME });
  await page.getByLabel("Verification status").selectOption("verified_secondary");
  await page.getByRole("button", { name: /Create ceremony/ }).click();
  // refused: authority has not approved
  await expect(page).not.toHaveURL(/saved=1/);
  expect(sql(`select count(*) from ceremonies where name='${name}'`)).toBe("0");

  await page.getByLabel(/Traditional authority or organiser has approved/).check();
  await page.getByRole("button", { name: /Create ceremony/ }).click();
  await expect(page).toHaveURL(/\/admin\/ceremonies\?saved=1/);
  expect(sql(`select status||'|'||authority_approved||'|'||attendance from ceremonies where name='${name}'`)).toBe("published|true|unknown");
});

test("confirming a date needs a start time", async ({ page }) => {
  await loginAs(page, "regional_editor");
  await page.goto("/admin/ceremonies/new");
  await page.getByLabel("Name", { exact: true }).fill(`Dated ${tag}`);
  await page.getByLabel("Date confirmed with the organisers for this occurrence").check();
  await page.getByRole("button", { name: /Create ceremony/ }).click();
  await expect(page.getByText("Enter the start date before confirming it")).toBeVisible();
});
