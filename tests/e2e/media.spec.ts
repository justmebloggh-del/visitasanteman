import { expect, test } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { sql, unique, hydrated } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "desktop only");

const email = `${unique("media")}@example.com`;
const password = "E2e-password-123";

/** Builds a valid 64x48 PNG in memory (no fixture file needed). */
function png(): Buffer {
  const w = 64, h = 48;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = x * 4; raw[o + 1] = 120; raw[o + 2] = y * 5; }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

test("staff can upload an optimised image; it is stored, public and referenced", async ({ page, request }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Media Tester");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  sql(`update user_roles set role='editor' where user_id=(select id from auth.users where email='${email}')`);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");

  // Alt text is required before uploading
  await page.goto("/admin/attractions/new");
  await hydrated(page);
  await page.locator("#cover_media_id-file").setInputFiles({ name: "x.png", mimeType: "image/png", buffer: png() });
  await expect(page.getByText(/Describe the image first/)).toBeVisible();

  // Wrong file type is rejected client-side
  await page.locator("#cover_media_id-alt").fill("A test gradient");
  await page.locator("#cover_media_id-file").setInputFiles({ name: "evil.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>") });
  await expect(page.getByText(/only JPEG, PNG, WebP or AVIF/)).toBeVisible();

  // Valid upload
  await page.locator("#cover_media_id-file").setInputFiles({ name: "x.png", mimeType: "image/png", buffer: png() });
  await expect(page.getByRole("img", { name: "A test gradient" })).toBeVisible();

  const title = unique("Cover test ");
  await page.getByLabel("Name", { exact: true }).fill(title);
  await page.getByRole("button", { name: /Create attraction/ }).click();
  await expect(page).toHaveURL(/saved=1/);

  const row = sql(`select m.path, m.mime_type, m.alt_text from attractions a join media m on m.id=a.cover_media_id where a.name='${title}'`);
  const [path, mime, alt] = row.split("|");
  expect(mime).toBe("image/webp");           // converted in the browser
  expect(alt).toBe("A test gradient");
  const res = await request.get(`http://127.0.0.1:54321/storage/v1/object/public/media/${path}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/webp");

  // Media library: editors may not delete; in-use files are protected anyway
  await page.goto("/admin/media");
  await expect(page.getByRole("button", { name: /Delete/ })).toHaveCount(0);
});

test("storage rejects uploads from anonymous users", async ({ request }) => {
  const res = await request.post("http://127.0.0.1:54321/storage/v1/object/media/anon-test.webp", {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "", "Content-Type": "image/webp" }, data: Buffer.from("x"), failOnStatusCode: false,
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
});
