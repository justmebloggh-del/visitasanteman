> **Status (2026-11-09): partly superseded.** The project is being rebranded to VisitAsanteman (see VisitAsanteman-rebrand-assessment.md). The Payload CMS recommendation below is withdrawn: the existing custom Supabase CMS is built and working, and the new brief specifies a custom Supabase CMS. The schema-consolidation advice was already adopted in the codebase.

# Visit Lake Bosomtwe: Architecture Review of Blueprint v1.0

Date: 2026-11-08

## Overall verdict
The direction is sound: one platform, CMS first, mobile-first, phased rollout, and a stack (Next.js, Supabase, Vercel) that suits the team. Six changes are recommended before development starts.

## Recommended changes

1. **Shrink the MVP.** Phase 1 is really Phases 1-2 combined. Launch with: attractions, communities, one combined listings directory (hotels and restaurants), events, articles, enquiry forms, admin CMS. Defer the travel planner, investment portal and partner dashboards until there is traffic.

2. **Simplify the schema.** `accommodations`, `restaurants` and `businesses` store mostly the same data. Use one `listings` table with a `type` field, plus small child tables for type-specific data (room types, menus). Use one shared `media` table linked to any entity (replaces business_images, accommodation_images, community_media). This halves CRUD code and makes Row Level Security (RLS) easier.

3. **Do not hand-build the CMS.** Options:
   - **Payload CMS 3 (recommended):** runs inside Next.js, can use the Supabase Postgres database, gives admin, roles, drafts and media almost for free.
   - Custom admin on Supabase: full control, roughly 3-4x the effort.

4. **Maps.** Use MapLibre with OpenStreetMap tiles for the MVP (free). Google Maps bills by usage past the free tier.

5. **Plan content collection.** Each attraction needs verified GPS points, fees, hours, photos and history, gathered on the ground and checked with the Bosomtwe District Assembly and traditional authorities. The lake has customary rules and sacred status, so cultural content must be verified locally before publishing. Run a content plan alongside the build.

6. **Defer commissions.** Booking payments with operator payouts need Paystack split payments, refund handling and likely operator licensing checks. Keep in Phase 3. Until then monetise via featured listings and WhatsApp enquiries.

## Minor fixes
- Section 13 is numbered twice in the blueprint.
- Check availability of www.visitlakebosomtwe.com.

## Open decisions
- [ ] Payload CMS acceptable? (shapes everything after)
- [ ] Next deliverable: (a) revised schema and architecture document, (b) Next.js scaffold, or (c) homepage design for review

## Proposed first step
Phase 1 technical foundation: repo structure, revised schema with RLS policies as Supabase migrations, Payload or custom admin, homepage in the brand palette (#174B35, #287D9B, #D5A642, #FFFFFF, #8B6845, #F5F7F3).
