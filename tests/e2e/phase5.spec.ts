import { expect, test, type Page } from "@playwright/test";
import { hydrated, sql, unique } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const pw = "E2e-password-123";
const admin = `${unique("p5admin")}@example.com`, editor = `${unique("p5ed")}@example.com`;
const title = unique("Eco Lodge Concept ");
const adTitle = unique("Sponsor ");
let slug = "", adId = "";
const utc = (offsetHours: number) => new Date(Date.now() + offsetHours * 36e5).toISOString().slice(0, 16);

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("P5 Tester");
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

test("setup users", async ({ page }) => {
  await register(page, admin); await register(page, editor);
  sql(`update user_roles set role='admin' where user_id=(select id from auth.users where email='${admin}')`);
  sql(`update user_roles set role='editor' where user_id=(select id from auth.users where email='${editor}')`);
});

test("investment: a concept cannot be saved as approved without a source, and estimates need a basis", async ({ page }) => {
  await login(page, admin);
  await page.goto("/admin/investments/new");
  await hydrated(page);
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Project stage").selectOption("approved");
  await page.getByRole("button", { name: /Create investment opportunity/ }).click();
  await expect(page.getByText(/Name the source before marking a project approved/)).toBeVisible();

  await page.getByLabel("Project stage").selectOption("proposed");
  await page.getByLabel("Estimated investment: minimum").fill("500000");
  await page.getByRole("button", { name: /Create investment opportunity/ }).click();
  await expect(page.getByText("Say where the estimate comes from")).toBeVisible();
});

test("investment: a proposed project is published with a clear 'concept only' notice", async ({ page }) => {
  await login(page, admin);
  await page.goto("/admin/investments/new");
  await hydrated(page);
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Project stage").selectOption("proposed");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByLabel("Short summary").fill("A concept for a small lakeside eco-lodge.");
  await page.getByRole("button", { name: /Create investment opportunity/ }).click();
  await expect(page).toHaveURL(/saved=1/);
  slug = sql(`select slug from investment_opportunities where title='${title}'`);
  expect(sql(`select stage from investment_opportunities where slug='${slug}'`)).toBe("proposed");

  const anon = await (await page.context().browser()!.newContext()).newPage();
  await expect.poll(async () => (await anon.goto(`/investment/${slug}`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(anon.getByText("Proposed development concept").first()).toBeVisible();
  await expect(anon.getByText(/concept only\. It has not been approved, funded or scheduled/)).toBeVisible();
  await expect(anon.getByText(/Approved project/)).toHaveCount(0);
  await anon.goto("/investment?stage=approved");
  await expect(anon.getByText(title)).toHaveCount(0);                 // filter by real stage
  await anon.goto("/investment?stage=proposed");
  await expect(anon.getByText(title)).toBeVisible();
});

test("investor enquiry is linked to the project and visible to staff", async ({ page, browser }) => {
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/investment/${slug}`);
  await hydrated(anon, "#enquire form");
  await anon.locator("#enquire").getByLabel("Your name").fill("Ama Investor");
  await anon.locator("#enquire").getByLabel("Email", { exact: true }).fill("investor@example.com");
  await anon.locator("#enquire").getByLabel("Organisation (optional)").fill("Lake Capital");
  await anon.locator("#enquire").getByRole("button", { name: "Send message" }).click();
  await expect(anon.getByText("Your message has been sent")).toBeVisible();
  expect(sql(`select kind||'|'||(investment_id is not null)||'|'||(details->>'organisation') from enquiries where email='investor@example.com' order by created_at desc limit 1`)).toBe("investment|true|Lake Capital");

  await login(page, admin);
  await page.goto("/admin/enquiries?kind=investment");
  await expect(page.getByText(`About: ${title}`)).toBeVisible();
  await expect(page.getByText("Lake Capital")).toBeVisible();
});

test("ads: only active, dated, published ads show, always labelled Sponsored; clicks are counted", async ({ page, browser }) => {
  await login(page, admin);
  await page.goto("/admin/advertisements/new");
  await hydrated(page);
  await page.getByLabel("Internal title").fill(adTitle);
  await page.getByLabel("Advertiser name shown publicly").fill("Lakeside Co");
  await page.getByLabel("Placement").selectOption("homepage_banner");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByLabel("Headline").fill("Stay by the lake");
  await page.getByLabel("Link").fill("javascript:alert(1)");
  await page.getByLabel("Starts (Ghana time)").fill(utc(-1));
  await page.getByLabel("Ends (Ghana time)").fill(utc(24));
  await page.getByRole("button", { name: /Create advertisement/ }).click();
  await expect(page.getByText(/must start with http/)).toBeVisible();

  await page.getByLabel("Link").fill("https://example.com/offer");
  await page.getByLabel("Ends (Ghana time)").fill(utc(-2));
  await page.getByRole("button", { name: /Create advertisement/ }).click();
  await expect(page.getByText("End must be after the start")).toBeVisible();

  await page.getByLabel("Ends (Ghana time)").fill(utc(24));
  await page.getByRole("button", { name: /Create advertisement/ }).click();
  await expect(page).toHaveURL(/saved=1/);
  adId = sql(`select id from advertisements where title='${adTitle}'`);

  // an expired ad and a future ad must not appear
  sql(`insert into advertisements(title,advertiser_name,placement,headline,link_url,starts_at,ends_at,status) values
    ('Expired ${adTitle}','Old Co','homepage_banner','EXPIRED HEADLINE','https://example.com',now()-interval '3 day',now()-interval '1 day','published'),
    ('Future ${adTitle}','Soon Co','homepage_banner','FUTURE HEADLINE','https://example.com',now()+interval '1 day',now()+interval '3 day','published'),
    ('Draft ${adTitle}','Draft Co','homepage_banner','DRAFT HEADLINE','https://example.com',now()-interval '1 day',now()+interval '1 day','draft')`);

  const anon = await (await browser.newContext()).newPage();
  await expect.poll(async () => { await anon.goto("/"); return await anon.getByText("Stay by the lake").count(); }, { timeout: 90_000, intervals: [3000] }).toBe(1);
  await expect(anon.getByText(/Sponsored · Lakeside Co/)).toBeVisible();
  await expect(anon.getByText("EXPIRED HEADLINE")).toHaveCount(0);
  await expect(anon.getByText("FUTURE HEADLINE")).toHaveCount(0);
  await expect(anon.getByText("DRAFT HEADLINE")).toHaveCount(0);
  await expect.poll(() => sql(`select impressions from advertisements where id='${adId}'`)).not.toBe("0");

  // click route counts and redirects to the advertiser (http/https only)
  const res = await anon.request.get(`/api/ads/${adId}/click`, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toBe("https://example.com/offer");
  expect(sql(`select clicks from advertisements where id='${adId}'`)).toBe("1");
  // expired ads do not redirect or count
  const expired = sql(`select id from advertisements where title='Expired ${adTitle}'`);
  const r2 = await anon.request.get(`/api/ads/${expired}/click`, { maxRedirects: 0 });
  expect(new URL(r2.headers()["location"]).pathname).toBe("/");
  expect(sql(`select clicks from advertisements where id='${expired}'`)).toBe("0");
});

test("editors cannot manage advertisements", async ({ page }) => {
  await login(page, editor);
  await page.goto("/admin/advertisements/new");
  await hydrated(page);
  await page.getByLabel("Internal title").fill("Editor ad");
  await page.getByLabel("Advertiser name shown publicly").fill("X");
  await page.getByLabel("Placement").selectOption("directory_top");
  await page.getByLabel("Link").fill("https://example.com");
  await page.getByLabel("Starts (Ghana time)").fill(utc(-1));
  await page.getByLabel("Ends (Ghana time)").fill(utc(2));
  await page.getByRole("button", { name: /Create advertisement/ }).click();
  await expect(page.getByText("You do not have permission to do that.")).toBeVisible();
  expect(sql(`select count(*) from advertisements where title='Editor ad'`)).toBe("0");
});
