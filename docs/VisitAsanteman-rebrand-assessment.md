# VisitAsanteman: Rebranding and Migration Assessment

Date: 2026-11-09 | Status: assessment only. No application code or database has been changed.
Covers brief tasks 1 to 7 (inspect, preserve, audit, assess, geography, schema, routes).

## 1. Summary

The existing project is not a prototype. It is a substantial, structured Next.js and Supabase platform, and it already matches most of the architecture the new brief asks for (custom CMS on Supabase, shared `listings` and `media` tables, partner portal, bookings, planner, investment, advertising, RLS). The rebrand is therefore mostly **additive**:

- the genuinely new work is the **regional geography layer**, a **culture and heritage module**, **new routes and navigation**, and the **rename**;
- the large rebuild risk is in changing the one assumption that runs through everything: "everything belongs to Lake Bosomtwe".

Recommendation: evolve this codebase. Do not restart.

## 2. What exists today (audit)

| Area | Finding |
|---|---|
| Stack | Next.js 16.4.5 (App Router), React 19.3, TypeScript, Tailwind 4, Supabase (`@supabase/ssr`), MapLibre + OSM, Zod 4, React Hook Form, Framer Motion, Vitest, Playwright. No shadcn/ui or Resend packages (Resend used via config). |
| Repository | Folder `Desktop/visitbosomtwe`. **Not a git repository**, so there is no history or rollback. `package.json` name is still `scaf`. |
| Database | 6 migrations (about 1,300 lines), 32 tables, seed file. Core: profiles, user_roles, media, media_links, communities, attraction_categories, attractions, listings, room_types, menu_items, experiences, events, article(s), testimonials, newsletter, enquiries, pages, site_settings, homepage_sections, audit_logs, subscription_plans, listing_views, bookings (+history, payments, blocked dates), reviews, travel_itineraries, itinerary_items, investment_opportunities, advertisements. |
| Roles | Enum `app_role`: super_admin, admin, editor, partner, visitor. |
| Content status | Enum `content_status`: draft, pending_review, published, archived. Scheduling via future `published_at` on articles. |
| Routes | About 90 route files: public site, `/admin` (config-driven CRUD for all resources), `/partner` portal, `/account`, auth, booking, planner (share and print), ads click API, Paystack webhook, sitemap, robots, manifest, PWA service worker. |
| Docs | 9 docs (architecture, schema, auth, env vars, deployment, payments, admin guide, partner guide, roadmap, content plan). |
| Tests | 5 unit test files and 8 Playwright specs exist. |
| Verified by me today | `tsc --noEmit` produced no errors. I could **not** run Vitest here because `node_modules` was installed on macOS and my shell is Linux (missing native binding). The roadmap's claims of "18 unit and 96 e2e tests passing" are therefore **unverified by me**; please run `npm test` and `npm run test:e2e` on your Mac to confirm the baseline before we change anything. |
| Not checked | `.env.local` (contains secrets; deliberately not opened), live deployment, production data, existing domain. |

## 3. Preserve, change, add

### Preserve (no structural change)
Auth and role helpers, RLS framework, `media` and `media_links`, `listings` (hotels, restaurants, operators), `room_types`, `menu_items`, bookings and payments, reviews, planner, investment (stage and source rules), advertising, enquiries, newsletter, admin framework (`config/admin-resources.ts`), partner portal, SEO helpers, PWA, tests.

### Change
1. **Brand and copy**: 83 occurrences of "Bosomtwe/Bosomtwi" across about 40 files. Key ones: `config/site.ts`, `app/layout.tsx`, `app/manifest.ts`, `public/sw.js`, header and footer, every list-page title, `lib/ai/assistant.ts` prompt, `supabase/config.toml`, seed rows, `README`, docs, two tests. Logo: `public/brand/logo.png` and root `Visit Lake Bosomtwe Logo.png`.
2. **Homepage and navigation**: rebuild around the region (brief section 5); 11-item menu plus "Plan Your Visit".
3. **Copy in `homepage_sections`, `site_settings`, `pages`** (stored in the database, so the seed change alone will not update an existing database; a new migration is needed).
4. **Map default**: `site_settings.map` centre is Lake Bosomtwe; it should become a regional view.
5. **Taxonomy**: `experience_category` enum is lake-specific (boat_cruise, fishing, etc.); extend with heritage tours, craft workshops, food experiences, city tours, festival experiences. `attraction_categories` need regional categories (palaces, museums, waterfalls, forests...).
6. **Roles**: add `regional_editor` and `media_manager`; `is_staff()` and policies must be reviewed.
7. **Workflow**: add an `approved` content status (draft, in review, approved, scheduled, published, archived).

### Add (new)
Geography module, culture and heritage module, destinations, travel-guide detail pages, content revisions, verification metadata, `/advertise` and `/partner-with-us`, redirect map.

## 4. Proposed geographical hierarchy

`Ghana → Region (Ashanti) → Administrative area (MMDA) → Community → Locality (optional) → Attraction / Listing / Event venue`, with **traditional areas** as a separate, optional, many-to-many overlay (traditional boundaries do not nest cleanly inside MMDAs).

### New tables (sketch)
```sql
regions            (id, slug, name, country_code default 'GH', is_active, ...)
administrative_areas (id, region_id fk, slug, name,
                     kind enum('metropolitan','municipal','district'),
                     capital_name, is_active, source, verified_at, ...)
traditional_areas  (id, slug, name, summary, source, verified_at, status, ...)
community_traditional_areas (community_id, traditional_area_id)
localities         (id, community_id fk, name, ...)          -- optional neighbourhoods
destinations       (id, slug, name, administrative_area_id fk, summary, cover_media_id,
                    status, seo fields, ...)                   -- e.g. Lake Bosomtwe, Kumasi heritage core
```
### Changes to existing tables
- `communities.administrative_area_id` (fk). Existing 10 communities are Bosomtwe-area drafts.
- `administrative_area_id` (fk) on `attractions`, `listings`, `events`, `experiences` (derived from community when set; overridable).
- Optional `destination_id` on attractions, listings, experiences, events, articles.
- A **publish guard** (DB trigger, same pattern already used elsewhere): content cannot move to `published` without a valid administrative area.
- Verification metadata on content tables: `last_verified_at`, `verification_notes` (`content_verified` and `sources` already exist).

### Rules
- **The MMDA list is loaded from an official source** (Local Government Service, Ghana Statistical Service or the Ministry of Local Government), recorded with source and date, and managed in admin. I have **not** typed in a list from memory: the number and names of Ashanti MMDAs have changed over time and must be verified.
- Backfill: the existing Lake Bosomtwe content links to the Bosomtwe District area record, to be confirmed against the official list at load time.
- Lake Bosomtwe becomes a `destination` record under VisitAsanteman and keeps its identity there (brief 17.3).

## 5. Route changes

| Brief route | Today | Action |
|---|---|---|
| `/districts`, `/districts/[slug]` | none | **New** (MMDA landing pages) |
| `/destinations`, `/destinations/[slug]` | none | **New** (`/destinations/lake-bosomtwe`) |
| `/culture`, `/culture/history`, `/traditions`, `/festivals`, `/crafts`, `/food` | none | **New** |
| `/travel-guide/[slug]`, `/gallery/[slug]` | list pages only | **Add detail pages** |
| `/about/our-mission`, `/about/partners`, `/advertise`, `/partner-with-us` | `/about` only | **New** |
| `/explore`, `/attractions`, `/communities`, `/experiences`, `/accommodation`, `/restaurants`, `/events`, `/map`, `/business-directory`, `/business/[slug]`, `/articles`, `/investment`, `/travel-planner`, `/contact`, `/privacy`, `/terms` | exist | **Keep**, add region/district filters |
| `/partner`, `/admin` | exist | **Keep** |

Existing URLs stay valid, so only the domain change (if any) needs a redirect map.

## 6. Risks and constraints

1. **No version control.** Initialise git and take a full baseline (code, plus `pg_dump` of any real database) before any change. I have not done this unprompted.
2. **Applied migrations must not be edited.** All changes go in new migrations (`20261113...`), including data updates to homepage, settings and pages rows.
3. **Content is still the launch blocker.** The roadmap confirms no verified real content yet. Regional scope multiplies this: the content plan must be extended from one lake to the region, with district-by-district verification.
4. **Cultural sensitivity.** Asante traditional institutions, Adinkra and festival content need review by appropriate custodians before publication, as the brief states.
5. **Payments, AI and PWA** remain untested with live services (per roadmap). Not affected by the rebrand but still pre-launch items.
6. **Rename blast radius:** service worker cache names, manifest, e2e assertions that match the old name, and the AI prompt must be changed together.

## 7. Proposed Phase 1 sequence

1. Baseline: git init, backup, confirm tests pass on your machine.
2. Migration A: geography tables, community and content links, publish guard, new roles and status, RLS and tests.
3. Admin: manage regions, administrative areas, traditional areas, destinations; wire into `admin-resources.ts`.
4. Load official MMDA list (needs your source or approval to use one); backfill Lake Bosomtwe.
5. Rebrand: config, copy, manifest, logo slots, SEO metadata, seed and data migration.
6. Navigation, homepage rebuild, `/districts` and `/destinations`.
7. Redirect map and sitemap; documentation updated; tests extended; phase report.

Culture module, new experience categories and travel-guide detail pages follow in Phase 2 of the brief.

## 8. Decisions needed from you

1. **Domain:** what is the VisitAsanteman domain, and is the old Lake Bosomtwe site already live anywhere (domain, Vercel, Supabase project)? This decides whether redirects and a production data migration are needed or whether this is still pre-launch.
2. **Real data:** does any Supabase database contain data you have entered that must be preserved, or is everything still local and seed-level?
3. **Logo:** do you have the VisitAsanteman logo, or should the first pass use a clean text wordmark in the new palette until the brand kit is designed?
4. **MMDA source:** may I use the official Ghana government list, once I have found and cited it, as the geography baseline?
5. **Git:** may I initialise a repository in this folder and make a baseline commit?
