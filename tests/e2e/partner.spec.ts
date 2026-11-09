import { expect, test, type Page } from "@playwright/test";
import { sql, unique, hydrated, testAreaId } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const pw = "E2e-password-123";
const owner = `${unique("owner")}@example.com`;
const other = `${unique("other")}@example.com`;
const admin = `${unique("padmin")}@example.com`;
const bizName = unique("E2E Lodge ");
let slug = "";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}
async function registerBusiness(page: Page, email: string, type: string) {
  await page.goto("/partner/register");
  await hydrated(page);
  await page.getByLabel("Your full name").fill("E2E Owner");
  await page.getByLabel("Business name").fill("E2E Biz");
  await page.getByLabel("Business type").selectOption(type);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Create business account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  await login(page, email);
  await page.goto("/partner/activate");
  await hydrated(page);
  await expect(page.getByLabel("Business type")).toHaveValue(type);   // pre-filled from registration
  await page.getByRole("button", { name: "Activate business account" }).click();
  await expect(page).toHaveURL(/partner\/dashboard/);
}

test("a visitor cannot open the portal", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Plain Visitor");
  await page.getByLabel("Email", { exact: true }).fill(`v${Date.now()}@example.com`);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  await page.goto("/partner/dashboard");
  await expect(page).not.toHaveURL(/partner\/dashboard/);
});

test("business registers, activates, creates and submits a listing", async ({ page }) => {
  await registerBusiness(page, owner, "accommodation");
  expect(sql(`select role from user_roles where user_id=(select id from auth.users where email='${owner}')`)).toBe("partner");

  await page.goto("/partner/listings/new");
  await hydrated(page);
  // only accommodation types are offered, and admin-only controls are absent
  await expect(page.getByLabel("Type", { exact: true }).locator("option", { hasText: "Restaurant" })).toHaveCount(0);
  await expect(page.getByLabel("Verified badge")).toHaveCount(0);
  await expect(page.getByLabel("Subscription plan")).toHaveCount(0);
  await page.getByLabel("Name", { exact: true }).fill(bizName);
  await page.getByLabel("Type", { exact: true }).selectOption("lodge");
  await page.getByLabel("Short summary").fill("An automated test lodge.");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/Submitted\. Our team will review/)).toBeVisible();

  slug = sql(`select slug from listings where name='${bizName}'`);
  expect(sql(`select status from listings where slug='${slug}'`)).toBe("pending_review");
  expect(sql(`select owner_id is not null and is_verified=false and is_featured=false and plan_id is null from listings where slug='${slug}'`)).toBe("t");

  const anon = await (await page.context().browser()!.newContext()).newPage();
  expect((await anon.goto(`/accommodation/${slug}`))?.status()).toBe(404);   // not public until approved
});

test("another business cannot see or edit it", async ({ page }) => {
  await registerBusiness(page, other, "restaurant");
  const id = sql(`select id from listings where slug='${slug}'`);
  expect((await page.goto(`/partner/listings/${id}`))?.status()).toBe(404);
  await page.goto("/partner/listings");
  await expect(page.getByText(bizName)).toHaveCount(0);
});

test("admin approves; listing goes public; partner cannot self-verify", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Admin");
  await page.getByLabel("Email", { exact: true }).fill(admin);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  sql(`update user_roles set role='admin' where user_id=(select id from auth.users where email='${admin}')`);
  await login(page, admin);
  await page.goto("/admin/accommodation?status=pending_review");
  // Partners do not choose a district; staff assign one before publishing (the database requires it).
  await page.getByRole("row", { name: new RegExp(bizName) }).getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/error=1/);
  sql(`update listings set administrative_area_id='${testAreaId()}' where slug='${slug}'`);
  await page.goto("/admin/accommodation?status=pending_review");
  await page.getByRole("row", { name: new RegExp(bizName) }).getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  // admin assigns a plan and verifies
  await page.goto(`/admin/accommodation/${sql(`select id from listings where slug='${slug}'`)}`);
  await hydrated(page);
  await page.getByLabel("Subscription plan").selectOption({ label: "Standard Listing" });
  await page.getByLabel("Verified badge").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/saved=1/);
  expect(sql(`select is_verified from listings where slug='${slug}'`)).toBe("t");
  expect(sql(`select p.slug from listings l join subscription_plans p on p.id=l.plan_id where l.slug='${slug}'`)).toBe("standard");

  const anon = await (await page.context().browser()!.newContext()).newPage();
  await expect.poll(async () => (await anon.goto(`/accommodation/${slug}`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
  await expect(anon.getByText("Verified by VisitAsanteman")).toBeVisible();

  // a visitor enquires on the listing; the view is counted
  await anon.getByText("Just have a question?").click();
  const q = anon.locator("details");
  await q.getByLabel("Your name").fill("Guest One");
  await q.getByLabel("Email", { exact: true }).fill("guest@example.com");
  await q.getByLabel("Message").fill("Is a room free next weekend please?");
  await q.getByRole("button", { name: "Send message" }).click();
  await expect(anon.getByText("Your message has been sent")).toBeVisible();
  await expect.poll(() => sql(`select coalesce(sum(views),0) from listing_views where listing_id=(select id from listings where slug='${slug}')`)).not.toBe("0");
});

test("owner sees the enquiry and edit-after-publish returns it to review", async ({ page }) => {
  await login(page, owner);
  await page.goto("/partner/enquiries");
  await expect(page.getByText("Guest One")).toBeVisible();
  await page.getByRole("button", { name: "Mark replied" }).click();
  await expect(page.getByText("Updated.")).toBeVisible();

  await page.goto(`/partner/listings/${sql(`select id from listings where slug='${slug}'`)}`);
  await hydrated(page);
  await expect(page.getByText(/this listing is live/i)).toBeVisible();
  await page.getByLabel("Short summary").fill("Edited summary.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/partner\/listings\?submitted=1/);
  expect(sql(`select status from listings where slug='${slug}'`)).toBe("pending_review");
  expect(sql(`select is_verified from listings where slug='${slug}'`)).toBe("t");   // verification not lost by edit
  await page.goto("/partner/subscription");
  await expect(page.getByText("Standard Listing")).toBeVisible();
});

test("admin can edit subscription plans without code", async ({ page }) => {
  await login(page, admin);
  await page.goto("/admin/subscription-plans");
  await page.getByRole("link", { name: "Premium Listing" }).click();
  await hydrated(page);
  await page.getByLabel("Price per month (GHS)").fill("150");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/saved=1/);
  expect(sql(`select price_monthly from subscription_plans where slug='premium'`)).toBe("150.00");
  sql(`update subscription_plans set price_monthly=null where slug='premium'`);
});
