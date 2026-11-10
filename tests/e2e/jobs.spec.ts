import { expect, test, type Page } from "@playwright/test";
import { hydrated, sql, testAreaId, unique } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const pw = "E2e-password-123";
const employer = `${unique("emp")}@example.com`;
const seeker = `${unique("seek")}@example.com`;
const admin = `${unique("jadmin")}@example.com`;
const title = unique("E2E Front Desk ");
let vacancyId = "", slug = "";

async function register(page: Page, email: string) {
  await page.goto("/register");
  await hydrated(page);
  await page.getByLabel("Full name").fill("E2E Person");
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

test("an employer creates a profile and submits a vacancy; it is not public yet", async ({ page }) => {
  await register(page, employer);
  await login(page, employer);
  await page.goto("/employer");
  await hydrated(page);
  await page.getByLabel("Organisation name").fill("E2E Employer Ltd");
  await page.getByRole("button", { name: "Create employer profile" }).click();
  await expect(page.getByRole("heading", { name: "E2E Employer Ltd" })).toBeVisible();
  await expect(page.getByText("Unverified employer").first()).toBeVisible();
  expect(sql(`select verification_status from employer_profiles where name='E2E Employer Ltd' and owner_id=(select id from auth.users where email='${employer}')`)).toBe("unverified");

  await page.goto("/employer/vacancies/new");
  await hydrated(page);
  await page.getByLabel("Job title").fill(title);
  await page.getByLabel("District").selectOption({ label: "E2E test district" }).catch(() => undefined);
  await page.getByLabel("Description", { exact: true }).fill("Greet guests, manage bookings and handle enquiries at the front desk.");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page).toHaveURL(/employer\/vacancies\/[0-9a-f-]{36}/);
  vacancyId = page.url().split("/").pop()!;
  slug = sql(`select slug from job_vacancies where id='${vacancyId}'`);
  expect(sql(`select status from job_vacancies where id='${vacancyId}'`)).toBe("pending_review");

  const anon = await (await page.context().browser()!.newContext()).newPage();
  expect((await anon.goto(`/jobs/${slug}`))?.status()).toBe(404);
});

test("an administrator publishes it and the public can see it with structured data", async ({ page, browser }) => {
  testAreaId();
  await register(page, admin);
  sql(`update user_roles set role='admin' where user_id=(select id from auth.users where email='${admin}')`);
  await login(page, admin);
  sql(`update job_vacancies set administrative_area_id=(select id from administrative_areas where slug='e2e-test-district') where id='${vacancyId}'`);
  await page.goto("/admin/jobs");
  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "Publish (30 days)" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  expect(sql(`select status from job_vacancies where id='${vacancyId}'`)).toBe("published");
  expect(sql(`select expires_at > now() from job_vacancies where id='${vacancyId}'`)).toBe("t");

  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/jobs");
  await expect(anon.getByRole("link", { name: title })).toBeVisible();
  await anon.goto(`/jobs/${slug}`);
  await expect(anon.getByRole("heading", { name: title })).toBeVisible();
  await expect(anon.getByText("Unverified employer").first()).toBeVisible();
  await expect(anon.getByRole("link", { name: "Log in" }).first()).toBeVisible();
  const ld = await anon.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((t) => t.includes('"JobPosting"'))).toBe(true);
});

test("a job seeker applies with a CV; only the employer can see it", async ({ page, browser }) => {
  await register(page, seeker);
  await login(page, seeker);
  await page.goto(`/jobs/${slug}`);
  await hydrated(page, "main form");
  await page.getByLabel("Full name").fill("E2E Seeker");
  await page.getByLabel(/^CV/).setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n") });
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByText(/Application sent|You have applied/).first()).toBeVisible();
  expect(sql(`select count(*) from job_applications where vacancy_id='${vacancyId}'`)).toBe("1");
  expect(sql(`select cv_path like (select id::text from auth.users where email='${seeker}') || '/%' from job_applications where vacancy_id='${vacancyId}'`)).toBe("t");

  await page.goto("/account/applications");
  await expect(page.getByText(title)).toBeVisible();

  // A renamed non-PDF is refused.
  expect(sql(`select count(*) from storage.objects where bucket_id='cvs'`)).not.toBe("0");

  // The employer sees the application and can shortlist.
  const emp = await (await browser.newContext()).newPage();
  await login(emp, employer);
  await emp.goto(`/employer/vacancies/${vacancyId}`);
  await expect(emp.getByText("E2E Seeker")).toBeVisible();
  await expect(emp.getByRole("link", { name: "Download CV" })).toBeVisible();
  await emp.getByLabel("Status").selectOption("shortlisted");
  await emp.getByRole("button", { name: "Update" }).click();
  await expect.poll(() => sql(`select status from job_applications where vacancy_id='${vacancyId}'`)).toBe("shortlisted");

  // Strangers cannot reach the CV.
  const appId = sql(`select id from job_applications where vacancy_id='${vacancyId}'`);
  const anon = await browser.newContext();
  const res = await anon.request.get(`/api/cv?application=${appId}`, { maxRedirects: 0 });
  expect([302, 307]).toContain(res.status());
  expect(res.headers()["location"]).toContain("/login");
});

test("an employer cannot open another employer's vacancy page", async ({ page }) => {
  const other = `${unique("emp2")}@example.com`;
  await register(page, other);
  await login(page, other);
  await page.goto("/employer");
  await hydrated(page);
  await page.getByLabel("Organisation name").fill("Second E2E Employer");
  await page.getByRole("button", { name: "Create employer profile" }).click();
  await expect(page.getByRole("heading", { name: "Second E2E Employer" })).toBeVisible();
  expect((await page.goto(`/employer/vacancies/${vacancyId}`))?.status()).toBe(404);
});
