# Prompt for Claude Code in VS Code: VisitAsanteman Phase 1

Paste everything below the line into Claude Code, with the project root (`visitbosomtwe`) open as the workspace.

---

You are the lead full-stack engineer taking over an existing tourism platform that was built as **Visit Lake Bosomtwe**. It is being rebranded to **VisitAsanteman** and widened from one lake to the **entire Ashanti Region of Ghana**. Your job in this session is **Phase 1 only**: rebrand and regional foundation. Work carefully, in small verified steps, and stop at the checkpoints below.

## 0. Read first (in this order, before writing any code)

1. `AGENTS.md`. This project uses a very new Next.js (16.x). Before writing Next.js code, read the relevant guides in `node_modules/next/dist/docs/`. Do not rely on older conventions from memory.
2. `docs/VisitAsanteman-brief-v1.md`: the full product brief. It is the source of truth for scope, tone and rules.
3. `docs/VisitAsanteman-rebrand-assessment.md`: my audit of the current code, what to preserve and change, the proposed geography model, route changes and risks. Verify its claims against the code rather than trusting them blindly. If something is wrong, say so and correct it.
4. `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/AUTHENTICATION.md`, `docs/DEVELOPMENT_ROADMAP.md`, `config/admin-resources.ts`, `config/site.ts`, and every file in `supabase/migrations/`.

Ignore `docs/VLB-blueprint-v1.0.md` except as history. `docs/VLB-architecture-review.md` is partly superseded.

## 1. Non-negotiable rules

- **Preserve, do not rewrite.** The codebase already works: custom Supabase CMS, RLS, partner portal, bookings, planner, investment, advertising, PWA. Extend it. Do not replace the stack, do not introduce Payload, Sanity or any new CMS, and do not add dependencies unless clearly necessary (explain each one).
- **Migrations are append-only.** Never edit an already-applied migration. Create new timestamped files in `supabase/migrations/` that sort after `20261112000001`. Data updates (homepage text, settings, pages) also go in migrations, because seed files do not update an existing database.
- **No invented facts.** Never fabricate attractions, coordinates, history, prices, opening hours, MMDA names, traditional-area names, statistics or contact details. Unknown means empty, or draft with a "needs verification" state.
- **Secrets.** Do not open, print, copy or commit `.env.local` or any real key. Work from `.env.example`. Never expose the service-role key to the browser.
- **Security is enforced in the database and on the server.** Hiding a button is not a control. Every new table needs RLS, and every new permission needs a test.
- **Every visible control must work.** No dummy buttons, fake success messages or placeholder functionality.
- **British English** in all user-facing copy and docs. Tone: welcoming, proud of Asante heritage, culturally respectful, free of exaggerated claims.
- **Cultural care.** Do not write Asante history, Adinkra meanings or traditional-institution content from your own knowledge for publication. Build the structure and leave content for verified entry, with a "verification required" workflow.
- **Do not build ahead.** Culture module content pages, new experience categories beyond what Phase 1 needs, and Phase 2+ features are out of scope except where the schema must be ready.

## 2. Step 0: baseline and safety (do this before any change)

1. If the folder is not a git repository, run `git init`, make sure `.gitignore` excludes `.env*` (except `.env.example`), `node_modules`, `.next`, `test-results`, and make one baseline commit named `Baseline: Visit Lake Bosomtwe before VisitAsanteman rebrand`. Then create a branch `rebrand/visitasanteman` and work there.
2. Run `npm install` if needed, then `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e` (the e2e suite needs a local Supabase: `npx supabase start`, then `npx supabase db reset`). Record exactly what passes and fails. **This is the baseline.** Do not claim any test passed unless you ran it and saw it pass. If something cannot run, say why.
3. Take a database backup note: confirm whether any hosted Supabase project exists. If I tell you real data exists, produce a `pg_dump` procedure first and do not touch production.

**Checkpoint A:** report the baseline results and any pre-existing failures. Then continue unless the baseline is badly broken.

## 3. Step 1: geography foundation (database)

Create a new migration for the regional geography model. Adapt the proposal in the assessment (section 4) after reading the real schema:

- `regions`, `administrative_areas` (kind: metropolitan, municipal, district), `traditional_areas`, a link table between communities and traditional areas, optional `localities`, and `destinations`.
- Add `administrative_area_id` to `communities`, `attractions`, `listings`, `events` and `experiences`. Add optional `destination_id` where sensible. Add `last_verified_at` and `verification_notes` to content tables that lack them.
- Add a database-level **publish guard**, using the same trigger style already used in the project: attractions, listings, events and experiences cannot be published without a valid administrative area. Communities need one too.
- Extend roles with `regional_editor` and `media_manager`, and extend `content_status` with `approved` (workflow: draft, in review, approved, scheduled, published, archived). Review `is_staff()`, the other helper functions and every RLS policy that checks roles. Decide who can do what and document it in `docs/AUTHENTICATION.md`. Regional and content editors must not be able to change roles, verification badges, subscription plans or payments.
- Add `content_revisions` for revision history on the main content types, if it can be done without major disruption. If it needs a larger change, propose it and defer.
- Seed: create the Ashanti `regions` row only. **Do not hardcode a list of MMDAs.**

Write SQL tests or checks for the new RLS rules in the style the project already uses, and run them against a real local Postgres via `npx supabase db reset`.

## 4. Step 2: administrative area data (needs sourcing)

The list of Ashanti metropolitan, municipal and district assemblies must come from an **official source** (for example the Local Government Service, Ghana Statistical Service, or the Ministry of Local Government). Use web search to find the current official list, record the source URL and retrieval date in `administrative_areas.source` and `verified_at`, and load it through a **separate data migration or an admin import**, not hidden inside application code. If you cannot find an authoritative current list, stop and ask me rather than guessing. Cite the source in your report.

Then backfill the existing Lake Bosomtwe content (the ten community drafts and anything linked to them) to the correct administrative area, and create `destinations/lake-bosomtwe`. Confirm the district name against the official list before linking.

**Checkpoint B:** report what was created, the source used for the MMDA list, and the number of records loaded. Wait for my confirmation if the source was uncertain.

## 5. Step 3: admin (CMS) for the new entities

Using the existing config-driven pattern in `config/admin-resources.ts`, add admin management for regions, administrative areas, traditional areas, destinations and localities, with filters. Add administrative area (and destination where relevant) pickers to the attraction, community, listing, event and experience forms, with validation. Add the new roles to user management. Add editorial status transitions and show verification fields. Keep the admin consistent with the existing look and behaviour.

## 6. Step 4: rebrand

- Brand name **VisitAsanteman** (written exactly this way; display name "Visit Asanteman"). Tagline: **Discover Ashanti. Experience Our Heritage.**
- Replace the Lake Bosomtwe identity across `config/site.ts`, `app/layout.tsx`, `app/manifest.ts`, `public/sw.js` (including cache names), header, footer, page titles and descriptions, `lib/ai/assistant.ts` prompt, `supabase/config.toml` project id, README, docs and tests. Search for `bosomtwe`, `bosomtwi` and `lake` case-insensitively and decide each occurrence deliberately. Keep Lake Bosomtwe wherever it correctly refers to the destination.
- Update stored copy (homepage sections, site settings, pages, map centre to a regional view) through a **new migration**, and also update `seed.sql` for fresh databases.
- Design tokens: keep the palette (#174B35 forest green, #D5A642 heritage gold, #287D9B blue, #8B6845 brown, #FFFFFF, #F5F7F3). I have not supplied a VisitAsanteman logo: use a clean text wordmark in the brand colours behind a single replaceable component and file path, so the real logo drops in later. Do not invent or imitate Adinkra or other protected or sacred symbols.
- Rename `package.json` name from `scaf` to `visitasanteman`.

## 7. Step 5: navigation, homepage and new routes

- Main menu: Home, Explore Ashanti, Attractions, Culture & Heritage, Experiences, Where to Stay, Food & Dining, Events, Travel Guide, Business Directory, About Us, plus a prominent **Plan Your Visit** action. It must work well on mobile, with search easily reachable.
- Rebuild the homepage around the whole region (brief section 5, sections A to M). Sections must hide cleanly when there is no published content. Do not show placeholder or invented content.
- Add `/districts` and `/districts/[slug]` (MMDA landing pages with their attractions, communities, accommodation, restaurants, events and experiences, a map, and only published, verified data) and `/destinations` and `/destinations/[slug]`. Add region and district filters to the existing directories. Add minimal `/culture` hub pages that clearly show "being prepared" until verified content exists, plus `/advertise`, `/partner-with-us`, `/about/our-mission` and `/about/partners`.
- Keep all existing routes working.

## 8. Step 6: SEO, redirects, sitemap

- Update metadata, Open Graph, canonical URLs, structured data (only where the page really supports the claim), breadcrumbs and `app/sitemap.ts`/`robots.ts` for the new brand and routes.
- Implement redirects as a **config-driven old-to-new map** (for example in `next.config.ts` or a dedicated file), using permanent redirects, mapping page-to-page and never everything to the homepage. I have not yet confirmed the new domain or whether the old site is live: read the site URL from `NEXT_PUBLIC_SITE_URL`, do not hardcode a domain, and document how to finish the redirect setup when the domain is known.

## 9. Step 7: tests and documentation

- Add or update unit tests, SQL RLS checks and Playwright tests for: geography admin, the publish guard, role permissions, district and destination pages, navigation on desktop and mobile, and redirects. Fix any existing e2e assertions that depend on the old brand name.
- Update `README.md`, `docs/SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `AUTHENTICATION.md`, `ENVIRONMENT_VARIABLES.md`, `ADMIN_USER_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `CONTENT_PLAN.md` (extend from one lake to a district-by-district regional plan) and `DEVELOPMENT_ROADMAP.md`.

## 10. Working method

- Create a task list and work through it in order. Commit after each logical step on the `rebrand/visitasanteman` branch with a clear message. Do not push and do not touch any hosted or production service without asking.
- After each step run typecheck, lint and the relevant tests. Fix root causes; never delete or weaken a test to make it pass, and never silence an error to get a green result.
- If a decision truly needs business information, credentials, legal approval or official data, ask me. Otherwise make a sensible choice, record it in the docs, and move on.
- If you find a bug or risk outside scope, list it in the report instead of silently changing it.

## 11. Definition of done for Phase 1

All of the following are true and demonstrated:
1. The site presents as VisitAsanteman, covering the whole Ashanti Region, with no stray Lake Bosomtwe branding.
2. Administrative areas are loaded from a cited official source and managed in admin; existing content is correctly linked; Lake Bosomtwe exists as a destination.
3. Content cannot be published without an administrative area; role permissions are enforced by RLS and tested.
4. District and destination pages, the new navigation, homepage and region filters work on mobile and desktop.
5. Redirect map, sitemap and metadata are in place.
6. Typecheck, lint, unit, SQL and e2e tests all pass, or each failure is listed with its cause.
7. Nothing was invented, no secret was exposed, and no applied migration was edited.

## 12. Final report format

End with a report containing: what was completed; what was migrated; what is working; exactly which tests and commands you ran and their results; outstanding defects; decisions or credentials still needed from me; and the next recommended tasks (Phase 2 of the brief).
