import { execFileSync } from "node:child_process";
import path from "node:path";

/** Clears leftover test data from the LOCAL database before and after the suite. Skipped when testing a remote site. */
export default async function globalCleanup() {
  if (process.env.E2E_BASE_URL || process.env.E2E_SKIP_CLEANUP) return;
  const url = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  if (!/127\.0\.0\.1|localhost/.test(url)) return;
  try {
    execFileSync(process.env.PSQL ?? "psql", [url, "-q", "-v", "ON_ERROR_STOP=1", "-f", path.join(__dirname, "cleanup.sql")], { stdio: "ignore" });
  } catch {
    console.warn("E2E cleanup skipped (psql unavailable or database not running).");
  }
}
