import { describe, expect, it } from "vitest";
import { resourceMap } from "@/config/admin-resources";
import { parseIdList, parseResourceForm } from "@/lib/admin/parse";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("parseResourceForm", () => {
  const attractions = resourceMap.attractions;

  it("builds a payload and derives the slug from the name", () => {
    const { values, errors } = parseResourceForm(attractions, fd({ name: "Lake Bosomtwe Viewpoint", status: "draft", verification_status: "awaiting_verification", access_status: "unknown", activities: "Hiking, Photography, hiking" }), { isAdmin: false });
    expect(errors).toEqual({});
    expect(values.slug).toBe("lake-bosomtwe-viewpoint");
    expect(values.activities).toEqual(["Hiking", "Photography", "hiking"]);
    expect(values.summary).toBeNull();
  });

  it("requires a name and a valid status", () => {
    const { errors } = parseResourceForm(attractions, fd({ name: "", status: "bogus" }), { isAdmin: true });
    expect(errors.name).toMatch(/required/);
    expect(errors.status).toBeDefined();
  });

  it("rejects out-of-range or half-supplied coordinates", () => {
    expect(parseResourceForm(attractions, fd({ name: "A", status: "draft", verification_status: "awaiting_verification", access_status: "unknown", latitude: "95", longitude: "-1.4" }), { isAdmin: true }).errors.latitude).toMatch(/between -90 and 90/);
    expect(parseResourceForm(attractions, fd({ name: "A", status: "draft", verification_status: "awaiting_verification", access_status: "unknown", latitude: "6.5" }), { isAdmin: true }).errors.longitude).toMatch(/both/);
    expect(parseResourceForm(attractions, fd({ name: "A", status: "draft", verification_status: "awaiting_verification", access_status: "unknown", latitude: "6.5", longitude: "-1.4" }), { isAdmin: true }).errors).toEqual({});
  });

  it("ignores admin-only fields submitted by editors", () => {
    const body = { name: "Hotel A", type: "hotel", status: "draft", is_verified: "on", is_featured: "on" };
    const editor = parseResourceForm(resourceMap.accommodation, fd(body), { isAdmin: false });
    expect(editor.values).not.toHaveProperty("is_verified");
    expect(editor.values).not.toHaveProperty("is_featured");
    const admin = parseResourceForm(resourceMap.accommodation, fd(body), { isAdmin: true });
    expect(admin.values.is_verified).toBe(true);
  });

  it("restricts listing type to the section", () => {
    const { errors } = parseResourceForm(resourceMap.restaurants, fd({ name: "X", type: "hotel", status: "draft" }), { isAdmin: true });
    expect(errors.type).toBeDefined();
  });

  it("rejects javascript: URLs and bad emails", () => {
    const r = parseResourceForm(resourceMap.events, fd({ title: "E", status: "draft", event_status: "scheduled", starts_at: "2027-01-01T10:00", registration_url: "javascript:alert(1)", contact_email: "nope" }), { isAdmin: true });
    expect(r.errors.registration_url).toBeDefined();
    expect(r.errors.contact_email).toBeDefined();
  });

  it("stores Ghana local time as UTC and checks end after start", () => {
    const ok = parseResourceForm(resourceMap.events, fd({ title: "E", status: "draft", event_status: "scheduled", starts_at: "2027-03-06T09:30" }), { isAdmin: true });
    expect(ok.values.starts_at).toBe("2027-03-06T09:30:00.000Z");
    const bad = parseResourceForm(resourceMap.events, fd({ title: "E", status: "draft", event_status: "scheduled", starts_at: "2027-03-06T09:30", ends_at: "2027-03-06T08:00" }), { isAdmin: true });
    expect(bad.errors.ends_at).toBeDefined();
  });

  it("sets published_at when an article is published without one", () => {
    const r = parseResourceForm(resourceMap.articles, fd({ title: "T", status: "published", body: "Hello" }), { isAdmin: false });
    expect(typeof r.values.published_at).toBe("string");
  });

  it("validates SEO fields", () => {
    const r = parseResourceForm(attractions, fd({ name: "A", status: "draft", seo_title: "x".repeat(80), canonical_url: "ftp://x" }), { isAdmin: true });
    expect(r.errors.seo_title).toBeDefined();
    expect(r.errors.canonical_url).toBeDefined();
  });
});

describe("parseIdList", () => {
  it("keeps only valid unique UUIDs", () => {
    const a = "123e4567-e89b-12d3-a456-426614174000";
    expect(parseIdList(`${a}, ${a}, not-a-uuid`)).toEqual([a]);
    expect(parseIdList(null)).toEqual([]);
  });
});

describe("investment and advertising rules", () => {
  const inv = resourceMap.investments;
  const base = { title: "Eco lodge", status: "draft", investment_currency: "GHS" };
  it("allows proposed projects without a source", () => {
    expect(parseResourceForm(inv, fd({ ...base, stage: "proposed" }), { isAdmin: false }).errors).toEqual({});
  });
  it("requires a named source before a project can be approved or existing", () => {
    expect(parseResourceForm(inv, fd({ ...base, stage: "approved" }), { isAdmin: false }).errors.stage_source).toBeDefined();
    expect(parseResourceForm(inv, fd({ ...base, stage: "operational" }), { isAdmin: false }).errors.stage_source).toBeDefined();
    expect(parseResourceForm(inv, fd({ ...base, stage: "approved", stage_source: "Assembly resolution 12/2026" }), { isAdmin: false }).errors).toEqual({});
  });
  it("requires a basis for any investment estimate and min <= max", () => {
    expect(parseResourceForm(inv, fd({ ...base, stage: "proposed", investment_min: "1000" }), { isAdmin: false }).errors.investment_note).toBeDefined();
    expect(parseResourceForm(inv, fd({ ...base, stage: "proposed", investment_min: "5000", investment_max: "1000", investment_note: "Consultant study" }), { isAdmin: false }).errors.investment_max).toBeDefined();
  });
  it("validates ad dates and links", () => {
    const ad = resourceMap.advertisements;
    const ok = { title: "T", advertiser_name: "A", placement: "homepage_banner", status: "draft", link_url: "https://example.com", starts_at: "2027-01-01T00:00", ends_at: "2027-01-02T00:00" };
    expect(parseResourceForm(ad, fd(ok), { isAdmin: true }).errors).toEqual({});
    expect(parseResourceForm(ad, fd({ ...ok, ends_at: "2026-12-31T00:00" }), { isAdmin: true }).errors.ends_at).toBeDefined();
    expect(parseResourceForm(ad, fd({ ...ok, link_url: "javascript:alert(1)" }), { isAdmin: true }).errors.link_url).toBeDefined();
  });
});

describe("sort_order", () => {
  it("defaults to 0 when left blank (the column is NOT NULL)", () => {
    const def = resourceMap["administrative-areas"];
    const { values, errors } = parseResourceForm(def, fd({ name: "Test", region_id: "00000000-0000-0000-0000-000000000001", kind: "district", sort_order: "" }), { isAdmin: false, canApprove: true });
    expect(errors).toEqual({});
    expect(values.sort_order).toBe(0);
  });
  it("ignores approver-only fields for people who cannot approve", () => {
    const def = resourceMap.attractions;
    const { values } = parseResourceForm(def, fd({ name: "A", status: "draft", content_verified: "on" }), { isAdmin: false, canApprove: false });
    expect("content_verified" in values).toBe(false);
    const approver = parseResourceForm(def, fd({ name: "A", status: "draft", content_verified: "on" }), { isAdmin: false, canApprove: true });
    expect(approver.values.content_verified).toBe(true);
  });
  it("asks for a district before publishing content", () => {
    const { errors } = parseResourceForm(resourceMap.attractions, fd({ name: "A", status: "published" }), { isAdmin: true, canApprove: true });
    expect(errors.administrative_area_id).toMatch(/district/i);
    const ok = parseResourceForm(resourceMap.attractions, fd({ name: "A", status: "published", administrative_area_id: "00000000-0000-0000-0000-000000000001" }), { isAdmin: true, canApprove: true });
    expect(ok.errors.administrative_area_id).toBeUndefined();
  });
});

describe("ceremonies", () => {
  const def = resourceMap.ceremonies;
  const base = { name: "C", kind: "ceremony", status: "draft", attendance: "unknown", verification_status: "awaiting_verification" };
  it("will not confirm a date without a start", () => {
    expect(parseResourceForm(def, fd({ ...base, date_confirmed: "on" }), { isAdmin: true, canApprove: true }).errors.starts_at).toMatch(/start date/);
    expect(parseResourceForm(def, fd({ ...base, date_confirmed: "on", starts_at: "2026-12-01T09:00" }), { isAdmin: true, canApprove: true }).errors).toEqual({});
  });
  it("ignores authority approval from people who cannot approve", () => {
    const r = parseResourceForm(def, fd({ ...base, authority_approved: "on" }), { isAdmin: false, canApprove: false });
    expect("authority_approved" in r.values).toBe(false);
  });
});
