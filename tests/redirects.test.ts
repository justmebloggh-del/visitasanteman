import { describe, expect, it } from "vitest";
import { redirectRules } from "@/config/redirects";

describe("redirect map", () => {
  it("only uses site paths (no hard-coded domain)", () => {
    for (const r of redirectRules) {
      expect(r.source.startsWith("/")).toBe(true);
      expect(r.destination.startsWith("/")).toBe(true);
    }
  });
  it("has no duplicate sources, no self-redirects and no chains", () => {
    const sources = redirectRules.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
    for (const r of redirectRules) {
      expect(r.source).not.toBe(r.destination);
      expect(sources).not.toContain(r.destination);
    }
  });
  it("never sends everything to the homepage", () => {
    expect(redirectRules.filter((r) => r.destination === "/").length).toBe(0);
  });
});
