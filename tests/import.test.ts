import { describe, expect, it } from "vitest";
import { buildPreview, importable, parseCsv, templates, toCsv, type Lookups } from "@/lib/import/csv";

const lookups: Lookups = {
  areas: [{ id: "a1", slug: "adansi-north", name: "Adansi North" }],
  communities: [],
  categories: [{ id: "c1", slug: "natural", name: "Natural attractions" }],
  existing: [{ slug: "existing-falls", name: "Existing Falls", alt_names: ["Old Spelling Falls"], latitude: 6.5, longitude: -1.5 }],
};
const head = templates.attractions.columns.join(",");
const line = (o: Record<string, string>) => templates.attractions.columns.map((c) => (/[",]/.test(o[c] ?? "") ? `"${(o[c] ?? "").replace(/"/g, '""')}"` : o[c] ?? "")).join(",");

describe("csv parser", () => {
  it("handles quotes, commas, escaped quotes, CRLF and embedded newlines", () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n"line1\nline2",z\r\n');
    expect(rows).toEqual([["a", "b"], ["x, y", 'say "hi"'], ["line1\nline2", "z"]]);
  });
  it("round-trips through toCsv", () => {
    const rows = [["a", "b,c"], ['q"q', "n\nl"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("attraction import preview", () => {
  it("accepts a valid research row as a draft that is never verified or published", () => {
    const csv = `${head}\n${line({ name: "Test Falls", category: "natural", district: "Adansi North", source_organisation: "Some source", access_status: "unknown" })}`;
    const p = buildPreview("attractions", csv, lookups);
    expect(p.rows[0].errors).toEqual([]);
    expect(p.rows[0].values).toMatchObject({ slug: "test-falls", administrative_area_id: "a1", category_id: "c1", status: "draft", verification_status: "research_identified" });
    expect(importable(p)).toHaveLength(1);
  });
  it("ignores any status or verification columns supplied by the file", () => {
    const csv = `${head},status,verification_status\n${line({ name: "Sneaky", source_organisation: "x" })},published,officially_confirmed`;
    const p = buildPreview("attractions", csv, lookups);
    expect(p.unknownColumns).toEqual(["status", "verification_status"]);
    expect(p.rows[0].values).toMatchObject({ status: "draft", verification_status: "research_identified" });
  });
  it("requires a source and a name", () => {
    const p = buildPreview("attractions", `${head}\n${line({ name: "No Source" })}\n${line({ source_organisation: "x" })}`, lookups);
    expect(p.rows[0].errors.join()).toMatch(/source organisation is required/);
    expect(p.rows[1].errors).toContain("Name is required");
  });
  it("reports missing required columns", () => {
    expect(buildPreview("attractions", "name\nFoo", lookups).missingColumns).toEqual(["source_organisation"]);
  });
  it("flags duplicates by name, alternative spelling, and repeats within the file", () => {
    const csv = [head, line({ name: "Existing Falls", source_organisation: "x" }), line({ name: "old spelling falls", source_organisation: "x" }), line({ name: "Twice", source_organisation: "x" }), line({ name: "Twice", source_organisation: "x" })].join("\n");
    const p = buildPreview("attractions", csv, lookups);
    expect(p.rows.map((r) => !!r.duplicate)).toEqual([true, true, false, true]);
    expect(importable(p)).toHaveLength(1);
  });
  it("warns about unknown districts and nearby existing places, and rejects bad coordinates", () => {
    const near = buildPreview("attractions", `${head}\n${line({ name: "Near", source_organisation: "x", latitude: "6.5005", longitude: "-1.5", district: "Nowhere" })}`, lookups);
    expect(near.rows[0].warnings.join()).toMatch(/District "Nowhere" was not found/);
    expect(near.rows[0].warnings.join()).toMatch(/Within 200 m/);
    const bad = buildPreview("attractions", `${head}\n${line({ name: "Bad", source_organisation: "x", latitude: "123", longitude: "-1" })}`, lookups);
    expect(bad.rows[0].errors.join()).toMatch(/out of range/);
    const half = buildPreview("attractions", `${head}\n${line({ name: "Half", source_organisation: "x", latitude: "6" })}`, lookups);
    expect(half.rows[0].errors.join()).toMatch(/both latitude and longitude/);
  });
  it("rejects the template example row and bad access status or URLs", () => {
    const ex = buildPreview("attractions", `${head}\n${toCsv([templates.attractions.example]).trim()}`, lookups);
    expect(ex.rows[0].errors.join()).toMatch(/example row/);
    const bad = buildPreview("attractions", `${head}\n${line({ name: "X", source_organisation: "x", access_status: "open", source_url: "javascript:alert(1)" })}`, lookups);
    expect(bad.rows[0].errors.join()).toMatch(/access_status must be one of/);
    expect(bad.rows[0].errors.join()).toMatch(/source_url must start with http/);
  });
});
