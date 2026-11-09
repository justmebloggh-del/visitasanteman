import { expect, test, type Page } from "@playwright/test";
import { sql, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);   // some steps wait for page caches (up to 90 s) to refresh

const email = `${unique("hos")}@example.com`;
const password = "E2e-password-123";
const tag = unique("hos").toLowerCase();
let listingId = "";

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("new hospitality and business types, price range, capacity and facility filters", async ({ page }) => {
  const a = testAreaId();
  const cols = "slug,type,name,status,administrative_area_id,price_range,capacity,amenities";
  sql(`insert into listings (${cols}) values
    ('${tag}-cafe','cafe','Cafe ${tag}','published','${a}','mid_range',20,'{"Free Wi-Fi"}'),
    ('${tag}-boutique','boutique_hotel','Boutique ${tag}','published','${a}','upscale',10,'{"Swimming pool"}'),
    ('${tag}-guest','guesthouse','Guest ${tag}','published','${a}','budget',40,'{"Free Wi-Fi"}'),
    ('${tag}-venue','event_venue','Venue ${tag}','published','${a}',null,300,'{}'),
    ('${tag}-market','market','Market ${tag}','published','${a}',null,null,'{}')`);

  await expect.poll(async () => (await page.goto(`/restaurants`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect.poll(async () => { await page.goto("/restaurants"); return await page.getByText(`Cafe ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);

  await expect.poll(async () => { await page.goto("/accommodation?price=upscale"); return await page.getByText(`Boutique ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);
  await expect(page.getByText(`Guest ${tag}`)).toHaveCount(0);
  await page.goto("/accommodation?guests=30");
  await expect(page.getByText(`Guest ${tag}`).first()).toBeVisible();
  await expect(page.getByText(`Boutique ${tag}`)).toHaveCount(0);
  await page.goto("/accommodation?facility=Swimming+pool");
  await expect(page.getByText(`Boutique ${tag}`).first()).toBeVisible();
  await expect(page.getByLabel("Price range")).toBeVisible();

  await expect.poll(async () => { await page.goto("/venues"); return await page.getByText(`Venue ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);
  await expect.poll(async () => { await page.goto("/markets"); return await page.getByText(`Market ${tag}`).count(); }, { timeout: 90_000, intervals: [3000] }).toBeGreaterThan(0);

  // detail pages use the right action for each type
  await expect.poll(async () => (await page.goto(`/restaurants/${tag}-cafe`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByRole("heading", { name: "Request a table" })).toBeVisible();
  await expect.poll(async () => (await page.goto(`/accommodation/${tag}-boutique`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByRole("heading", { name: "Send a booking request" })).toBeVisible();
  await expect(page.getByText("Price range").first()).toBeVisible();
  await expect.poll(async () => (await page.goto(`/venues/${tag}-venue`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(page.getByRole("heading", { name: "Send an enquiry" })).toBeVisible();
  await expect.poll(async () => (await page.goto(`/markets/${tag}-market`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  // a listing is only served under its own section
  expect((await page.goto(`/markets/${tag}-cafe`))?.status()).toBe(404);
});

test("researched market drafts exist but are not public", async ({ page }) => {
  expect(sql(`select count(*) from listings where type='market' and status='draft' and source_organisation like 'Ashanti Regional Coordinating Council%' and description is null and latitude is null and phone is null and opening_hours is null`)).toBe("5");
  expect((await page.goto("/markets/kumasi-central-market-kejetia"))?.status()).toBe(404);
});

test("setup: register a business user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Hospitality");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  const uid = sql(`select id from auth.users where email='${email}'`);
  sql(`update profiles set business_account_type='accommodation' where id='${uid}'`);
  listingId = sql(`insert into listings (slug,type,name,status,owner_id) values ('${tag}-mine','guesthouse','Mine ${tag}','pending_review','${uid}') returning id`).split("\n")[0];
});

test("verification workflow: request, reject with a reason, request again, verify; the plan point is covered by the database checks", async ({ page }) => {
  await loginAs(page, "partner");
  await page.goto(`/partner/listings/${listingId}`);
  await page.getByRole("button", { name: "Request verification" }).click();
  await expect(page.getByText("Verification requested. Our team will check your details.")).toBeVisible();
  expect(sql(`select verification_decision||'|'||(verification_requested_at is not null)||'|'||is_verified from listings where id='${listingId}'`)).toBe("pending|true|false");

  await loginAs(page, "admin");
  await page.goto("/admin/verification");
  const card = page.getByRole("listitem").filter({ hasText: `Mine ${tag}` });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText(/Give a reason when rejecting or suspending/)).toBeVisible();   // a reason is required
  await card.getByLabel(`Reason for Mine ${tag}`).fill("Phone number could not be reached.");
  await card.getByRole("button", { name: "Reject" }).click();
  expect(sql(`select verification_decision||'|'||verification_reason from listings where id='${listingId}'`)).toBe("rejected|Phone number could not be reached.");

  // (The database test suite covers that a paid plan never verifies a business.)
});

test("the owner sees the reason, asks again, and is verified by an administrator", async ({ page }) => {
  expect(sql(`select is_verified from listings where id='${listingId}'`)).toBe("f");
  await loginAs(page, "partner");
  await page.goto(`/partner/listings/${listingId}`);
  await expect(page.getByText("Phone number could not be reached.")).toBeVisible();
  await page.getByRole("button", { name: "Request verification" }).click();
  await expect(page.getByText("Verification requested. Our team will check your details.")).toBeVisible();

  await loginAs(page, "admin");
  await page.goto("/admin/verification");
  await page.getByRole("listitem").filter({ hasText: `Mine ${tag}` }).getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  expect(sql(`select verification_decision||'|'||is_verified||'|'||coalesce(verification_reason,'none') from listings where id='${listingId}'`)).toBe("verified|true|none");

  await loginAs(page, "partner");
  await page.goto(`/partner/listings/${listingId}`);
  await expect(page.getByText(/Your business is\s+verified/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Request verification" })).toHaveCount(0);
});
