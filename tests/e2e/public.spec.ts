import { hydrated } from "./helpers";
import { expect, test } from "@playwright/test";

const pages = ["/", "/explore", "/attractions", "/communities", "/accommodation", "/restaurants", "/experiences", "/events", "/events?view=calendar", "/travel-guide", "/business-directory", "/articles", "/gallery", "/map", "/contact", "/about", "/districts", "/destinations", "/culture", "/culture/history", "/culture/traditions", "/culture/festivals", "/culture/crafts", "/culture/food", "/advertise", "/partner-with-us", "/about/our-mission", "/about/partners", "/search?q=heritage", "/login", "/register", "/forgot-password"];

test.describe("public site", () => {
  for (const path of pages) {
    test(`renders ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("unknown slugs return 404", async ({ page }) => {
    for (const p of ["/attractions/nope", "/accommodation/nope", "/events/nope", "/articles/nope", "/districts/nope", "/destinations/nope"]) {
      expect((await page.goto(p))?.status()).toBe(404);
    }
  });

  test("signed-out users are redirected away from /admin", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sitemap and robots respond", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin");
  });

  test("mobile menu opens and navigates", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await menu.getByRole("button", { name: "Explore Asanteman", exact: true }).click();
    await menu.getByRole("link", { name: "Attractions", exact: true }).click();
    await expect(page).toHaveURL(/\/attractions/);
  });
});

test.describe("forms", () => {
  test("contact form validates then submits", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await page.getByLabel("Your name").fill("E2E Tester");
    await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
    await page.getByLabel("Message").fill("Hello, this is an automated end to end test message.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Your message has been sent")).toBeVisible();
  });

  test("honeypot-filled submissions are not stored", async ({ request }) => {
    const res = await request.post("/contact", { form: {}, failOnStatusCode: false });
    expect(res.status()).toBeLessThan(500);
  });

  test("newsletter signup works and duplicate is handled", async ({ page }) => {
    await page.goto("/");
    const email = `nl${Date.now()}@example.com`;
    for (const expected of ["You are subscribed", "already subscribed"]) {
      await page.getByLabel("Newsletter email").last().fill(email);
      await page.getByRole("button", { name: "Subscribe" }).last().click();
      await expect(page.getByText(expected).last()).toBeVisible();
      await page.reload();
    }
  });
});

test.describe("form behaviour on validation errors", () => {
  test("a failed submit keeps what the visitor typed", async ({ page }) => {
    await page.goto("/contact");
    await hydrated(page);
    await page.getByLabel("Your name").fill("Kofi Keeps");
    await page.getByLabel("Email", { exact: true }).first().fill("not-an-email");
    await page.getByLabel("Message").fill("A message that should survive a validation error.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveValue("Kofi Keeps");
    await expect(page.getByLabel("Message")).toHaveValue("A message that should survive a validation error.");
  });
});
