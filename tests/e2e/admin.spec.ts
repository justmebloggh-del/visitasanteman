import { expect, test } from "@playwright/test";
import { sql, TEST_AREA_NAME, testAreaId, unique } from "./helpers";

// Needs a LOCAL Supabase (npx supabase start) with email confirmation off. Desktop project only.
test.describe.configure({ mode: "serial" });

const email = `${unique("admin")}@example.com`;
const password = "E2e-password-123";
const title = unique("E2E Attraction ");

test.describe("auth, roles and CMS publishing", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("register creates a visitor who cannot enter /admin", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Admin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/verify-email/);
    expect(sql(`select role from user_roles where user_id=(select id from auth.users where email='${email}')`)).toBe("visitor");

    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/");
    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin/);   // visitor is bounced
  });

  test("wrong password shows a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Incorrect email or password")).toBeVisible();
  });

  test("super admin creates, publishes and the public sees it", async ({ page }) => {
    sql(`update user_roles set role='super_admin' where user_id=(select id from auth.users where email='${email}')`);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/");

    testAreaId();
    await page.goto("/admin/attractions/new");
    await page.getByLabel("Name", { exact: true }).fill(title);
    await page.getByLabel("Short summary").fill("An automated test attraction.");
    await page.getByLabel("District / municipality / metropolis").selectOption({ label: TEST_AREA_NAME });
    await page.getByLabel("Verification status").selectOption("verified_secondary");
    await page.getByRole("button", { name: /Create attraction/ }).click();
    await expect(page).toHaveURL(/\/admin\/attractions\?saved=1/);

    const slug = sql(`select slug from attractions where name='${title}'`);
    expect(slug).toMatch(/^e2e-attraction-/);

    // Draft is invisible to the public (RLS), published is visible
    const anon = await page.context().browser()!.newContext();
    const pub = await anon.newPage();
    expect((await pub.goto(`/attractions/${slug}`))?.status()).toBe(404);

    await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await expect.poll(async () => (await pub.goto(`/attractions/${slug}`))?.status(), { timeout: 90_000, intervals: [3000] }).toBe(200);
    await expect(pub.getByRole("heading", { name: title })).toBeVisible();
    await anon.close();
  });

  test("invalid coordinates are rejected with a message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/");
    await page.goto("/admin/attractions/new");
    await page.getByLabel("Name", { exact: true }).fill(unique("Bad coords "));
    await page.getByLabel("Latitude").fill("123");
    await page.getByLabel("Longitude").fill("-1.4");
    await page.getByRole("button", { name: /Create attraction/ }).click();
    await expect(page.getByText(/Latitude must be between/)).toBeVisible();
  });

  test("an editor cannot delete or verify", async ({ page }) => {
    sql(`update user_roles set role='editor' where user_id=(select id from auth.users where email='${email}')`);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/");
    await page.goto("/admin/attractions");
    await expect(page.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
    await page.goto("/admin/settings");
    await page.waitForURL(/\/admin\/dashboard/);   // editors are redirected away from settings
    await page.goto("/admin/users");
    await expect(page.getByText("only a super administrator can change roles")).toBeVisible();
  });

  test("submitted enquiry is visible to staff", async ({ page }) => {
    sql(`insert into enquiries(name,email,message) values ('E2E Tester','e2e@example.com','Seeded by the admin test so it does not depend on other specs')`);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/");
    await page.goto("/admin/enquiries");
    await expect(page.getByText("E2E Tester").first()).toBeVisible();
  });
});
