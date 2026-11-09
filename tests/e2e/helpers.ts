import { execFileSync } from "node:child_process";

/** Runs SQL against the LOCAL Supabase database. Test setup only; never point this at production. */
export function sql(query: string): string {
  const psql = process.env.PSQL ?? "psql";
  const url = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("Refusing to run test SQL against a non-local database");
  return execFileSync(psql, [url, "-tA", "-c", query], { encoding: "utf8" }).trim();
}

/**
 * A district for tests that publish content (the database refuses to publish without one).
 * Clearly labelled test data in the local database; the Ashanti region row comes from the seed.
 */
export const TEST_AREA_NAME = "E2E test district";
export function testAreaId(): string {
  return sql(`insert into administrative_areas (region_id, slug, name, kind, is_active, source)
    values ((select id from regions where slug='ashanti'), 'e2e-test-district', '${TEST_AREA_NAME}', 'district', true, 'End-to-end test fixture, not an official record')
    on conflict (slug) do update set is_active = true returning id`).split("\n")[0];
}

export const unique = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Waits until React has attached to the first matching element, so client-side handlers are live. */
export async function hydrated(page: import("@playwright/test").Page, selector = "main form") {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactFiber"));
  }, selector);
}
