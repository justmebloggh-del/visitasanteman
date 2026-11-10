import { expect, test, type Page } from "@playwright/test";
import { sql, unique } from "./helpers";

// Needs a LOCAL Supabase. Desktop only. The launch readiness checklist.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const email = `${unique("lch")}@example.com`;
const password = "E2e-password-123";

async function loginAs(page: Page, role: string) {
  sql(`update user_roles set role='${role}' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

test("setup: register a user", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Launch");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
});

test("administrators see an honest launch checklist that never prints secrets", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/admin/readiness");
  await expect(page.getByRole("heading", { name: "Launch readiness" })).toBeVisible();
  for (const s of ["Hosting and services", "Districts and geography", "Content", "Pages and legal", "Businesses"]) await expect(page.getByRole("region", { name: s })).toBeVisible();
  // the local test site is not production: the checklist must say so
  await expect(page.getByRole("region", { name: "Hosting and services" })).toContainText("To do");
  await expect(page.getByRole("region", { name: "Pages and legal" })).toContainText("Privacy policy");
  await expect(page.getByRole("region", { name: "Pages and legal" })).toContainText("lawyer");
  const text = await page.locator("main").innerText();
  for (const secret of ["sk_test_mock", "re_test_mock", "test-ai-key"]) expect(text).not.toContain(secret);   // values are never shown
  await expect(page.getByText(/things to do/)).toBeVisible();
});

test("only administrators can open it", async ({ page }) => {
  await loginAs(page, "regional_editor");
  await page.goto("/admin/readiness");
  await page.waitForURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: "Launch readiness" })).toHaveCount(0);
});
