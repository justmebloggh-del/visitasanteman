import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Cookie consent and analytics gating. Starts with NO stored choice.
// Google Analytics only exists when the app was built with NEXT_PUBLIC_GA_ID, e.g.:  NEXT_PUBLIC_GA_ID=G-VASATEST01 npm run build
test.use({ storageState: { cookies: [], origins: [] } });
test.skip(({ isMobile }) => isMobile, "desktop only");

const GA = /googletagmanager\.com|google-analytics\.com/;

async function watch(context: BrowserContext) {
  const hits: string[] = [];
  await context.route(GA, (route) => { hits.push(route.request().url()); return route.fulfill({ status: 200, contentType: "application/javascript", body: "" }); });
  return hits;
}
async function configured(page: Page) { return (await page.locator("[data-analytics]").first().getAttribute("data-analytics")) === "on"; }
const cookie = async (context: BrowserContext) => (await context.cookies()).find((c) => c.name === "vasa_consent");

test("the banner appears, offers equal choices, and nothing optional loads before a choice", async ({ page, context }) => {
  const hits = await watch(context);
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Cookies" });
  await expect(dialog).toBeVisible();
  const reject = dialog.getByRole("button", { name: "Reject all" }), accept = dialog.getByRole("button", { name: "Accept all" });
  await expect(dialog.getByRole("button", { name: "Customise" })).toBeVisible();
  const [rb, ab] = [await reject.boundingBox(), await accept.boundingBox()];
  expect(Math.abs(rb!.width - ab!.width)).toBeLessThan(40);          // reject is as prominent as accept
  expect(rb!.height).toBe(ab!.height);
  await page.waitForTimeout(1500);
  await page.goto("/attractions");
  await page.waitForTimeout(1000);
  expect(hits).toEqual([]);                                           // no analytics request, no consent cookie yet
  expect(await cookie(context)).toBeUndefined();
  expect((await context.cookies()).filter((c) => c.name.startsWith("_ga"))).toEqual([]);
});

test("Reject all stores the choice, loads nothing, and the banner stays away", async ({ page, context }) => {
  const hits = await watch(context);
  await page.goto("/");
  await page.getByRole("button", { name: "Reject all" }).click();
  await expect(page.getByRole("dialog", { name: "Cookies" })).toHaveCount(0);
  const c = await cookie(context);
  expect(JSON.parse(decodeURIComponent(c!.value))).toMatchObject({ v: 1, functional: false, analytics: false, advertising: false });
  await page.reload();
  await page.waitForTimeout(1200);
  await expect(page.getByRole("dialog", { name: "Cookies" })).toHaveCount(0);
  expect(hits).toEqual([]);
});

test("Accept all loads analytics (when configured) and keeps the choice", async ({ page, context }) => {
  const hits = await watch(context);
  await page.goto("/");
  test.skip(!(await configured(page)), "the app was built without NEXT_PUBLIC_GA_ID");
  expect(hits).toEqual([]);
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect.poll(() => hits.length).toBeGreaterThan(0);
  expect(hits.some((h) => /googletagmanager\.com\/gtag\/js\?id=G-/.test(h))).toBe(true);
  expect(JSON.parse(decodeURIComponent((await cookie(context))!.value)).analytics).toBe(true);
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Cookies" })).toHaveCount(0);
  await expect.poll(() => hits.length).toBeGreaterThan(1);            // the script loads again, now that consent exists
});

test("Customise lets the visitor choose categories; the footer link reopens it and withdrawing stops analytics", async ({ page, context }) => {
  const hits = await watch(context);
  await page.goto("/");
  await page.getByRole("button", { name: "Customise" }).click();
  const settings = page.getByRole("dialog", { name: "Cookie settings" });
  await expect(settings).toContainText("Necessary");
  await expect(settings.getByRole("checkbox", { name: /Analytics/ })).not.toBeChecked();      // nothing pre-ticked
  await expect(settings.getByRole("checkbox", { name: /Advertising/ })).not.toBeChecked();
  await settings.getByRole("checkbox", { name: /Analytics/ }).check();
  await settings.getByRole("button", { name: "Save choices" }).click();
  expect(JSON.parse(decodeURIComponent((await cookie(context))!.value))).toMatchObject({ analytics: true, advertising: false, functional: false });
  if (await configured(page)) await expect.poll(() => hits.length).toBeGreaterThan(0);

  // reopen from the footer and withdraw
  await page.getByRole("button", { name: "Cookie settings" }).click();
  const again = page.getByRole("dialog", { name: "Cookie settings" });
  await expect(again.getByRole("checkbox", { name: /Analytics/ })).toBeChecked();
  await again.getByRole("button", { name: "Reject all" }).click();
  expect(JSON.parse(decodeURIComponent((await cookie(context))!.value)).analytics).toBe(false);
  const disabled = await page.evaluate(() => Object.keys(window).filter((k) => k.startsWith("ga-disable-")).map((k) => (window as unknown as Record<string, unknown>)[k]));
  if (await configured(page)) expect(disabled).toEqual([true]);                                  // analytics is switched off for this page
  await page.reload();
  const before = hits.length;
  await page.waitForTimeout(1200);
  expect(hits.length).toBe(before);                                                              // and is not loaded again
});

test("the cookie policy page exists as a managed page and the footer links to it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reject all" }).click();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Cookie policy" })).toBeVisible();
  const res = await page.goto("/cookie-policy");
  expect(res?.status()).toBe(200);
  await expect(page.getByText("This page is being prepared")).toBeVisible();     // draft until an administrator publishes reviewed wording
});
