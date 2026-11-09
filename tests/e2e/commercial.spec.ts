import { expect, test, type Page } from "@playwright/test";
import { sql, testAreaId, unique } from "./helpers";
import { startMockResend } from "./mock-resend";

// Needs a LOCAL Supabase and the app started with the RESEND_* test settings in playwright.config.ts. Desktop only.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(120_000);

const email = `${unique("com")}@example.com`;
const password = "E2e-password-123";
const tag = unique("com").toLowerCase();
const wait = { timeout: 90_000, intervals: [3000] };
let mail: Awaited<ReturnType<typeof startMockResend>>;
let uid = "";

test.beforeAll(async () => { mail = await startMockResend(); });
test.afterAll(() => mail?.close());

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("an enquiry about a listing is emailed to the business contact address", async ({ page }) => {
  const a = testAreaId();
  const bizMail = `${tag}-biz@example.org`;
  sql(`insert into listings (slug,type,name,status,administrative_area_id,email) values ('${tag}-with','guesthouse','With email ${tag}','published','${a}','${bizMail}'),('${tag}-without','guesthouse','No email ${tag}','published','${a}',null)`);
  await expect.poll(async () => (await page.goto(`/accommodation/${tag}-with`))?.status(), wait).toBe(200);
  await page.getByText("Just have a question?").click();
  const form = page.locator("details");
  await form.getByLabel("Your name").fill("Ama Visitor");
  await form.getByLabel("Email", { exact: true }).fill("ama@example.com");
  await form.getByLabel("Message").fill("Do you have a room free next weekend please?");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message has been sent")).toBeVisible();
  await expect.poll(() => mail.sent().filter((m) => m.to === bizMail).length).toBe(1);
  const m = mail.sent().find((x) => x.to === bizMail)!;
  expect(m.subject).toContain(`With email ${tag}`);
  expect(m.reply_to).toBe("ama@example.com");
  expect(m.text).toContain("Do you have a room free next weekend");

  // a business with no public contact email gets no message, and the enquiry is still saved
  await expect.poll(async () => (await page.goto(`/accommodation/${tag}-without`))?.status(), wait).toBe(200);
  const before = mail.sent().length;
  await page.getByText("Just have a question?").click();
  const f2 = page.locator("details");
  await f2.getByLabel("Your name").fill("Kofi Visitor");
  await f2.getByLabel("Email", { exact: true }).fill("kofi@example.com");
  await f2.getByLabel("Message").fill("Is breakfast included in the price please?");
  await f2.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message has been sent")).toBeVisible();
  expect(mail.sent().length).toBe(before);
  expect(sql(`select count(*) from enquiries where email='kofi@example.com' and listing_id=(select id from listings where slug='${tag}-without')`)).toBe("1");
});

test("setup: register a user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Commercial");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  uid = sql(`select id from auth.users where email='${email}'`);
});

test("advertisers, sponsored placements and performance reporting", async ({ page, request }) => {
  await loginAs(page, "admin");
  const adv = `Advertiser ${tag}`;
  await page.goto("/admin/advertisers/new");
  await page.getByLabel("Advertiser name").fill(adv);
  await page.getByLabel("Contact email").fill("ads@example.org");
  await page.getByLabel("Internal notes").fill("Invoice ref 123");
  await page.getByRole("button", { name: /Create advertiser/ }).click();
  await expect(page).toHaveURL(/\/admin\/advertisers\?saved=1/);
  const advId = sql(`select id from advertisers where name='${adv}'`);

  const adId = sql(`insert into advertisements (title,advertiser_name,advertiser_id,placement,headline,link_url,starts_at,ends_at,status) values
    ('Ad ${tag}','${adv}','${advId}','search_top','Sponsored headline ${tag}','https://example.org/landing',now() - interval '1 day',now() + interval '1 day','published') returning id`).split("\n")[0];

  const anon = await (await page.context().browser()!.newContext()).newPage();
  await anon.goto(`/search?q=${tag}`);
  const slot = anon.getByLabel("Sponsored");
  await expect(slot).toContainText(`Sponsored headline ${tag}`);
  await expect(slot).toContainText("Sponsored");                                     // always labelled
  await expect.poll(() => Number(sql(`select impressions from advertisements where id='${adId}'`))).toBeGreaterThan(0);

  const click = await request.get(`/api/ads/${adId}/click`, { maxRedirects: 0 });
  expect(click.status()).toBe(302);
  expect(click.headers().location).toBe("https://example.org/landing");
  expect(sql(`select clicks from advertisements where id='${adId}'`)).toBe("1");
  expect(sql(`select clicks||'|'||(impressions > 0) from ad_stats_daily where ad_id='${adId}'`)).toBe("1|true");

  await page.goto("/admin/advertising");
  const row = page.getByRole("row", { name: new RegExp(`Ad ${tag}`) });
  await expect(row).toContainText("live");
  await expect(row).toContainText("search top");
  await expect(row.getByRole("cell").nth(5)).toHaveText("1");                         // clicks

  // an ad outside its dates is never shown
  sql(`update advertisements set ends_at = now() - interval '1 hour', starts_at = now() - interval '2 day' where id='${adId}'`);
  await anon.goto(`/search?q=${tag}`);
  await expect(anon.getByText(`Sponsored headline ${tag}`)).toHaveCount(0);
  await anon.context().close();
});

test("subscriptions: assign a plan, set an end date, end overdue plans; nothing is verified", async ({ page }) => {
  await loginAs(page, "admin");
  const a = testAreaId();
  const listingId = sql(`insert into listings (slug,type,name,status,administrative_area_id) values ('${tag}-sub','guesthouse','Sub ${tag}','published','${a}') returning id`).split("\n")[0];
  await page.goto("/admin/subscriptions");
  await page.getByLabel("Business listing").selectOption({ label: `Sub ${tag}` });
  await page.getByLabel("Plan", { exact: true }).selectOption({ label: "Premium Listing" });
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  expect(sql(`select count(*) from business_subscriptions where listing_id='${listingId}' and status='active'`)).toBe("1");
  expect(sql(`select is_verified from listings where id='${listingId}'`)).toBe("f");        // a paid plan never verifies

  const row = page.getByRole("row", { name: new RegExp(`Sub ${tag}`) });
  await row.getByLabel(`End date for Sub ${tag}`).fill("2020-01-01");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.getByRole("button", { name: /End overdue plans \(\d+\)/ }).click();
  await expect(page.getByText(/overdue plan\(s\) ended/)).toBeVisible();
  expect(sql(`select (plan_id is null)||'|'||(select status from business_subscriptions where listing_id='${listingId}' order by created_at desc limit 1) from listings where id='${listingId}'`)).toBe("true|ended");
});

test("the partner dashboard shows what visitors did, per listing", async ({ page }) => {
  sql(`update profiles set business_account_type='accommodation' where id='${uid}'`);
  const listingId = sql(`insert into listings (slug,type,name,status,owner_id) values ('${tag}-mine','guesthouse','Mine ${tag}','pending_review','${uid}') returning id`).split("\n")[0];
  sql(`insert into enquiries (kind,name,email,message,listing_id) values ('general','A','a@example.com','Hello, a question about rooms.','${listingId}'),('general','B','b@example.com','Hello, another question here.','${listingId}')`);
  sql(`insert into listing_views (listing_id,day,views) values ('${listingId}',current_date,7)`);
  await loginAs(page, "partner");
  await page.goto("/partner/dashboard");
  const row = page.getByRole("row", { name: new RegExp(`Mine ${tag}`) });
  await expect(row.getByRole("cell").nth(1)).toHaveText("7");      // page views
  await expect(row.getByRole("cell").nth(2)).toHaveText("2");      // enquiries
  await expect(row.getByRole("cell").nth(3)).toHaveText("0");      // booking requests
  await expect(page.getByText(/not confirmed sales/)).toBeVisible();
});
