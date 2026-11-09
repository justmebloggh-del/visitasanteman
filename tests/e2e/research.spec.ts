import { expect, test } from "@playwright/test";
import { sql, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only. Covers the research inventory, the import tool and public access notices.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);   // some tests wait for page caches (up to 90 s) to refresh

const email = `${unique("res")}@example.com`;
const password = "E2e-password-123";
const tag = unique("res").toLowerCase();

async function loginAs(page: import("@playwright/test").Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("setup: register a user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Research");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
});

test("the researched inventory is loaded as unpublished research records and nothing is public", async ({ page }) => {
  expect(Number(sql(`select count(*) from attractions where verification_status='research_identified' and status='draft' and source_organisation like 'Ashanti Regional Coordinating Council%'`))).toBeGreaterThanOrEqual(50);
  expect(sql(`select count(*) from attractions where verification_status in ('research_identified') and status='published'`)).toBe("0");
  // none of the loaded records carries invented detail
  expect(sql(`select count(*) from attractions where verification_status='research_identified' and (latitude is not null or description is not null or opening_hours is not null or entrance_fee is not null or contact_phone is not null)`)).toBe("0");
  expect((await page.goto("/attractions/manhyia-palace-museum"))?.status()).toBe(404);

  await loginAs(page, "regional_editor");
  await page.goto("/admin/attractions?filter=research_identified");
  await expect(page.getByRole("link", { name: "Manhyia Palace Museum" })).toBeVisible();
});

test("an unverified record cannot be published from the admin", async ({ page }) => {
  await loginAs(page, "regional_editor");
  testAreaId();
  sql(`update attractions set administrative_area_id='${testAreaId()}' where slug='manhyia-palace-museum'`);
  await page.goto("/admin/attractions?filter=research_identified&q=Manhyia+Palace");
  await page.getByRole("row", { name: /Manhyia Palace Museum/ }).getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/error=1/);
  expect(sql(`select status from attractions where slug='manhyia-palace-museum'`)).toBe("draft");
});

test("CSV import previews, skips duplicates and bad rows, and only creates unpublished research drafts", async ({ page }) => {
  await loginAs(page, "editor");
  const good = `Import Falls ${tag}`;
  const csv = [
    "name,category,district,source_organisation,source_url,researched_at,status,verification_status",
    `${good},waterfalls-forests,Adansi North,Test source,https://example.org/s,2026-11-09,published,officially_confirmed`,
    "Manhyia Palace Museum,,,Test source,,,,",
    `No Source ${tag},,,,,,,`,
  ].join("\n");
  await page.goto("/admin/import");
  await page.locator("#file").setInputFiles({ name: "test.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByRole("button", { name: "Check the file" }).click();
  await expect(page.getByText("1 can be imported")).toBeVisible();
  await expect(page.getByText(/Skipped: Already exists as "Manhyia Palace Museum"/)).toBeVisible();
  await expect(page.getByText(/source organisation is required/)).toBeVisible();
  await expect(page.getByText(/Ignored columns: status, verification_status/)).toBeVisible();

  await page.getByRole("button", { name: /Import 1 record as drafts/ }).click();
  await expect(page.getByText(/Imported 1 attractions and heritage sites as unpublished drafts/)).toBeVisible();
  expect(sql(`select status||'|'||verification_status||'|'||access_status||'|'||(administrative_area_id is not null)||'|'||(category_id is not null) from attractions where name='${good}'`)).toBe("draft|research_identified|unknown|true|true");
  expect(sql(`select count(*) from attractions where name='No Source ${tag}'`)).toBe("0");
});

test("template download works for staff and is refused to the public", async ({ page, request }) => {
  expect((await request.get("/admin/import/template/attractions", { failOnStatusCode: false, maxRedirects: 0 })).status()).not.toBe(200);
  await loginAs(page, "editor");
  const res = await page.request.get("/admin/import/template/attractions");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect((await res.text()).split("\n")[0]).toContain("source_organisation");
  expect((await page.request.get("/admin/import/template/nope", { failOnStatusCode: false })).status()).toBe(404);
});

test("public pages state access and source honestly", async ({ page }) => {
  const a = testAreaId();
  sql(`insert into attractions (slug,name,status,administrative_area_id,verification_status,access_status,access_notes,managing_institution,source_organisation,source_url)
       values ('${tag}-restricted','Restricted ${tag}','published','${a}','verified_secondary','restricted_access','Ask the traditional authority first.','Test Council','Test Source','https://example.org/src'),
              ('${tag}-open','Open ${tag}','published','${a}','verified_secondary','open_to_visitors',null,null,null,null),
              ('${tag}-proposed','Proposed ${tag}','published','${a}','verified_secondary','proposed',null,null,null,null)`);
  await expect.poll(async () => (await page.goto(`/attractions/${tag}-restricted`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByLabel("Visitor access")).toContainText("Restricted access");
  await expect(page.getByLabel("Visitor access")).toContainText("Ask the traditional authority first.");
  await expect(page.getByText("Managed by: Test Council")).toBeVisible();
  await expect(page.getByText("Source: Test Source")).toBeVisible();

  await expect.poll(async () => (await page.goto(`/attractions/${tag}-open`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByLabel("Visitor access")).toHaveCount(0);

  await expect.poll(async () => (await page.goto(`/attractions/${tag}-proposed`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByLabel("Visitor access")).toContainText("not an existing visitor facility");
});
