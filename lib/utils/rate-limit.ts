import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory limiter. On serverless each instance has its own memory, so this
 * only slows casual abuse. For production-grade limits add Vercel Firewall rate limiting
 * or an Upstash Redis limiter (see docs/deployment).
 */
const hits = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  // Test-only bypass for the automated browser tests. Ignored on Vercel, so it cannot disable limits in production.
  if (process.env.DISABLE_RATE_LIMIT === "true" && !process.env.VERCEL) return true;
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
