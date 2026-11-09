import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { sql, unique, hydrated } from "./helpers";
import { startMockPaystack } from "./mock-paystack";

// Needs local Supabase + the app started with PAYMENTS_ENABLED=true, PAYSTACK_SECRET_KEY=sk_test_mock,
// PAYSTACK_BASE_URL=http://127.0.0.1:4010 and SUPABASE_SERVICE_ROLE_KEY (see playwright.config.ts).
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const pw = "E2e-password-123";
const iso = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const ownerEmail = `${unique("bo")}@example.com`, otherEmail = `${unique("bx")}@example.com`, adminEmail = `${unique("ba")}@example.com`;
const guest = `${unique("guest")}@example.com`;
const slug = unique("book-lodge-");
let mock: Awaited<ReturnType<typeof startMockPaystack>>;
let listingId = "", ref1 = "", ref2 = "";

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Booking Tester");
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
async function request(page: Page, o: { from: number; to: number; guests?: number; email?: string }) {
  await page.goto(`/accommodation/${slug}`);
  await hydrated(page);
  await page.locator("#room_type_id").selectOption({ index: 1 });
  await page.getByLabel("Check-in").fill(iso(o.from));
  await page.getByLabel("Check-out").fill(iso(o.to));
  await page.getByLabel("Guests").fill(String(o.guests ?? 2));
  await page.locator("#b-name").fill("Guest One");
  await page.locator("#b-email").fill(o.email ?? guest);
  await page.getByRole("button", { name: "Send booking request" }).click();
}
async function lookup(page: Page, ref: string, email: string) {
  await page.goto("/booking");
  await hydrated(page);
  await page.getByLabel("Booking reference").fill(ref);
  await page.getByLabel("Email used for the booking").fill(email);
  await page.getByRole("button", { name: "Find my booking" }).click();
}

test.beforeAll(async () => { mock = await startMockPaystack(); });
test.afterAll(() => mock?.close());

test("setup: partner owner with a published lodge, one room, a 10% plan", async ({ page }) => {
  await register(page, ownerEmail); await register(page, otherEmail); await register(page, adminEmail);
  const uid = (e: string) => sql(`select id from auth.users where email='${e}'`);
  sql(`update user_roles set role='partner' where user_id in ('${uid(ownerEmail)}','${uid(otherEmail)}')`);
  sql(`update profiles set business_account_type='accommodation' where id in ('${uid(ownerEmail)}','${uid(otherEmail)}')`);
  sql(`update user_roles set role='admin' where user_id='${uid(adminEmail)}'`);
  sql(`update subscription_plans set commission_percent=10 where slug='free'`);
  listingId = sql(`insert into listings(slug,type,name,status,owner_id,summary) values ('${slug}','lodge','Booking Test Lodge','published','${uid(ownerEmail)}','For booking tests') returning id`).split("\n")[0];
  sql(`insert into room_types(listing_id,name,units,max_guests,price_per_night) values ('${listingId}','Double',1,2,300) returning id`);
  expect(listingId).toMatch(/[0-9a-f-]{36}/);
});

test("visitor request: validation, then a pending request with a reference", async ({ page }) => {
  await request(page, { from: -2, to: 3 });
  await expect(page.getByText(/valid check-in and check-out dates/)).toBeVisible();     // past date rejected by the database
  await request(page, { from: 10, to: 12, guests: 5 });
  await expect(page.getByText(/sleeps at most 2 guests/)).toBeVisible();
  await request(page, { from: 10, to: 12 });
  await expect(page.getByText("Request sent")).toBeVisible();
  ref1 = (await page.locator("strong.font-mono").innerText()).trim();
  expect(ref1).toMatch(/^VLB-[0-9A-F]{8}$/);
  expect(sql(`select status||'/'||payment_status||'/'||coalesce(total_amount::text,'none') from bookings where reference='${ref1}'`)).toBe("pending/unpaid/none");   // never auto-confirmed
});

test("guest lookup needs the right email", async ({ page }) => {
  await lookup(page, ref1, "wrong@example.com");
  await expect(page.getByText("We could not find a booking with those details.")).toBeVisible();
  await lookup(page, ref1, guest);
  await expect(page.getByText("Pending confirmation")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pay/ })).toHaveCount(0);
});

test("another partner cannot see or manage the booking", async ({ page }) => {
  await login(page, otherEmail);
  await page.goto("/partner/bookings");
  await expect(page.getByText(ref1)).toHaveCount(0);
});

test("owner confirms with a price, then requests payment", async ({ page }) => {
  await login(page, ownerEmail);
  await page.goto("/partner/bookings");
  const card = page.locator("li", { hasText: ref1 });
  await card.getByLabel("Price (GHS)").fill("450");
  await card.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Booking updated")).toBeVisible();
  expect(sql(`select status||'/'||total_amount from bookings where reference='${ref1}'`)).toBe("confirmed/450.00");
  await page.locator("li", { hasText: ref1 }).getByRole("button", { name: "Request online payment" }).click();
  await expect(page.getByText("Booking updated")).toBeVisible();
  expect(sql(`select status from bookings where reference='${ref1}'`)).toBe("awaiting_payment");
});

test("customer pays online: amount comes from the database and is verified with the gateway", async ({ page }) => {
  mock.setMode("success");
  await lookup(page, ref1, guest);
  await expect(page.getByText("Awaiting payment")).toBeVisible();
  await page.getByRole("button", { name: /Pay .*450/ }).click();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  expect(sql(`select status||'/'||payment_status||'/'||commission_amount from bookings where reference='${ref1}'`)).toBe("paid/paid/45.00");   // 10% of 450
  expect(sql(`select count(*)||'/'||max(amount)||'/'||max(status) from booking_payments where booking_id=(select id from bookings where reference='${ref1}')`)).toBe("1/450.00/paid");
  // reloading the return page is harmless (idempotent)
  await page.reload();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  expect(sql(`select count(*) from booking_status_history where booking_id=(select id from bookings where reference='${ref1}') and to_status='paid'`)).toBe("1");
});

test("a tampered or failed payment never marks a booking paid", async ({ page }) => {
  // second booking, confirmed and awaiting payment (via SQL to keep this test focused)
  await request(page, { from: 20, to: 22, email: guest });
  await expect(page.getByText("Request sent")).toBeVisible();
  ref2 = (await page.locator("strong.font-mono").innerText()).trim();
  sql(`update bookings set status='awaiting_payment', payment_status='pending', total_amount=600 where reference='${ref2}'`);

  mock.setMode("wrong_amount");
  await lookup(page, ref2, guest);
  await page.getByRole("button", { name: /Pay .*600/ }).click();
  await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  expect(sql(`select status from bookings where reference='${ref2}'`)).toBe("awaiting_payment");
  expect(sql(`select status from booking_payments where booking_id=(select id from bookings where reference='${ref2}')`)).toBe("failed");

  mock.setMode("failed");
  await lookup(page, ref2, guest);
  await page.getByRole("button", { name: /Pay .*600/ }).click();
  await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  expect(sql(`select status from bookings where reference='${ref2}'`)).toBe("awaiting_payment");

  // forged return URL for an unknown reference
  await page.goto("/booking/payment-return?reference=VLBP-DOESNOTEXIST");
  await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
});

test("webhook: rejects bad signatures; settles with a good one; is idempotent", async ({ request: api }) => {
  const url = "/api/webhooks/paystack";
  const bad = await api.post(url, { data: { event: "charge.success", data: { reference: "x" } }, headers: { "x-paystack-signature": "deadbeef" }, failOnStatusCode: false });
  expect(bad.status()).toBe(401);
  const none = await api.post(url, { data: {}, failOnStatusCode: false });
  expect(none.status()).toBe(401);

  // create a pending payment for ref2 and let the gateway say success
  mock.setMode("success");
  const payRef = "VLBP-WEBHOOKTEST0001";
  sql(`insert into booking_payments(booking_id,reference,amount,currency,status) select id,'${payRef}',600,'GHS','pending' from bookings where reference='${ref2}'`);
  // Make the mock aware of the reference by initialising through its API
  await api.post("http://127.0.0.1:4010/transaction/initialize", { headers: { Authorization: "Bearer sk_test_mock", "Content-Type": "application/json" }, data: { reference: payRef, amount: 60000, currency: "GHS", callback_url: "http://localhost/x", email: "a@b.co" } });

  const body = JSON.stringify({ event: "charge.success", data: { reference: payRef } });
  const sig = createHmac("sha512", "sk_test_mock").update(body).digest("hex");
  const ok = await api.post(url, { data: body, headers: { "x-paystack-signature": sig, "Content-Type": "application/json" } });
  expect(ok.status()).toBe(200);
  expect(sql(`select status from bookings where reference='${ref2}'`)).toBe("paid");
  const again = await api.post(url, { data: body, headers: { "x-paystack-signature": sig, "Content-Type": "application/json" } });
  expect(again.status()).toBe(200);
  expect(sql(`select count(*) from booking_status_history where booking_id=(select id from bookings where reference='${ref2}') and to_status='paid'`)).toBe("1");
});

test("completion unlocks a verified review; admin moderates; it appears publicly with a rating", async ({ page, browser }) => {
  await login(page, ownerEmail);
  await page.goto("/partner/bookings");
  await page.locator("li", { hasText: ref1 }).getByRole("button", { name: "Mark completed" }).click();
  await expect(page.getByText("Booking updated")).toBeVisible();

  const guestPage = await (await browser.newContext()).newPage();
  await lookup(guestPage, ref1, guest);
  await guestPage.getByLabel("Comment (optional)").fill("Wonderful stay by the lake.");
  await guestPage.getByRole("button", { name: "Submit review" }).click();
  await expect(guestPage.getByText(/Thank you\. Your review will appear after/)).toBeVisible();

  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/accommodation/${slug}`);
  await expect(anon.getByText("Wonderful stay by the lake.")).toHaveCount(0);          // pending reviews are not public

  await login(page, adminEmail);
  await page.goto("/admin/reviews");
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await expect.poll(async () => { await anon.goto(`/accommodation/${slug}`); return await anon.getByText("Wonderful stay by the lake.").count(); }, { timeout: 90_000, intervals: [3000] }).toBe(1);
  await expect(anon.getByText(/5 out of 5 from 1 verified guest/)).toBeVisible();
  expect(await anon.locator('script[type="application/ld+json"]').allInnerTexts()).toEqual(expect.arrayContaining([expect.stringContaining("AggregateRating")]));
});

test("availability: blocked dates and used-up units reject new requests", async ({ page }) => {
  await login(page, ownerEmail);
  await page.goto(`/partner/listings/${listingId}`);
  await hydrated(page);
  await page.locator("#av-from").fill(iso(40));
  await page.locator("#av-to").fill(iso(43));
  await page.getByRole("button", { name: "Block dates" }).click();
  await expect(page.getByText("Availability updated.")).toBeVisible();

  const guestPage = await (await page.context().browser()!.newContext()).newPage();
  await guestPage.goto(`/accommodation/${slug}`);
  await hydrated(guestPage);
  await guestPage.locator("#room_type_id").selectOption({ index: 1 });
  await guestPage.getByLabel("Check-in").fill(iso(41));
  await guestPage.getByLabel("Check-out").fill(iso(42));
  await guestPage.locator("#b-name").fill("G"); await guestPage.locator("#b-email").fill(guest);
  await guestPage.getByRole("button", { name: "Send booking request" }).click();
  await expect(guestPage.getByText("That room is not available for those dates")).toBeVisible();

  // the single unit is held by an active (paid) booking (ref1: +10..+12) -> overlapping request rejected
  sql(`update bookings set status='paid' where reference='${ref1}'`);
  await guestPage.goto(`/accommodation/${slug}`);
  await hydrated(guestPage);
  await guestPage.locator("#room_type_id").selectOption({ index: 1 });
  await guestPage.getByLabel("Check-in").fill(iso(11));
  await guestPage.getByLabel("Check-out").fill(iso(13));
  await guestPage.locator("#b-name").fill("G"); await guestPage.locator("#b-email").fill(guest);
  await guestPage.getByRole("button", { name: "Send booking request" }).click();
  await expect(guestPage.getByText("That room is not available for those dates")).toBeVisible();
});

test("customer can cancel a pending request but not a paid one online", async ({ page }) => {
  await request(page, { from: 60, to: 61, email: guest });
  const ref = (await page.locator("strong.font-mono").innerText()).trim();
  await lookup(page, ref, guest);
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await expect(page.getByText("Your booking has been cancelled.")).toBeVisible();
  expect(sql(`select status||'/'||cancelled_by from bookings where reference='${ref}'`)).toBe("cancelled/customer");
  await lookup(page, ref2, guest);
  await expect(page.getByRole("button", { name: "Cancel booking" })).toHaveCount(0);
});

test("admin sees all bookings, revenue and can record a refund only for paid bookings", async ({ page }) => {
  await login(page, adminEmail);
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Online revenue (GHS, paid)")).toBeVisible();
  await page.goto("/admin/bookings?status=paid");
  const card = page.locator("li", { hasText: ref2 });
  await card.getByRole("button", { name: "Record refund" }).click();
  await expect(page.getByText("Booking updated")).toBeVisible();
  expect(sql(`select status||'/'||payment_status from bookings where reference='${ref2}'`)).toBe("refunded/refunded");
});
