# VisitAsanteman

**Discover Ashanti. Experience Our Heritage.**

VisitAsanteman is a digital tourism, heritage, business and employment platform for the whole Ashanti Region of Ghana. It combines a public website, a built-in content management system, a business partner portal, bookings, a travel planner, a jobs board, and investment and advertising tools. Content is organised by district (metropolitan, municipal and district assemblies). Lake Bosomtwe is one destination within the region.

> **Nothing here is live yet.** The site is not deployed, the district list is unverified, and there is no real content. Read [Status](#status) before relying on any of it.

## What it does
| For | Features |
|---|---|
| Visitors | Destinations, districts, attractions, culture and ceremonies, accommodation, food, experiences, events, markets, education, sports and transport directories; site-wide search; interactive map; travel planner with curated itineraries; AI itinerary assistant (optional); installable PWA with an offline page |
| Plan your visit | Why Ashanti, Getting Around, Travel Information and Visa and Entry pages, each with a public "last verified" date and source |
| Themes | Eat, Wear, See and Feel, plus tour categories, shown only when they hold published content |
| Businesses | Partner portal: listings, photos, enquiries, bookings, reviews, subscription plans. Payment never verifies a business |
| Jobs and careers | Employer profiles with admin-only verification, vacancies that are reviewed before publishing, free applications with private CV upload, saved jobs, reports of suspicious vacancies, JobPosting structured data |
| Staff | Config-driven admin: workflow (draft, in review, approved, published), roles, revisions, verification, media library, CSV import, jobs moderation, launch-readiness checklist |
| Privacy | Cookie consent with analytics blocked until accepted, first-party consent cookie, draft cookie policy page |

## Status
- **Built:** the eight phases of the master plan, the regional-experience features (Part A of the visitghana-inspired brief) and Jobs & Careers. See [docs/PROGRESS.md](docs/PROGRESS.md) and [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md).
- **Not built yet:** the Expo mobile app, Excel import, Hubtel payments, audio and QR guides, diaspora portal, event ticketing and awards tooling, logo concepts, and Part B ([docs/PART-B-DESIGN.md](docs/PART-B-DESIGN.md) is design notes only). Jobs also lacks full candidate profiles, job alerts and recruitment payments.
- **Needed before launch:** verified district list, real content and photographs, cultural and legal review (including the cookie policy under Ghana's Data Protection Act, 2012, Act 843), domain and accounts. See [docs/LAUNCH_READINESS.md](docs/LAUNCH_READINESS.md).
- **Tests:** typecheck, lint and unit tests pass. Database permission checks pass (`geography_rls.sql`, `jobs_rls.sql`). The full Playwright suite needs a local Supabase and `psql`; a recent run had 5 failing tests that are being investigated (likely leftover data from repeated runs).
- **Payments** stay off until tested with real Paystack keys.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · MapLibre + OpenStreetMap · Zod · Vitest · Playwright

This Next.js version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code (see [AGENTS.md](AGENTS.md)).

## Quick start
```bash
npm install
cp .env.example .env.local        # fill in Supabase values (never commit this file)
npx supabase start                # local Postgres/Auth/Storage (needs Docker), prints URL + keys
npx supabase db reset             # applies supabase/migrations + supabase/seed.sql
npm run dev
```
Create an account at `/register`, then promote it to super administrator (once):
```sql
update user_roles set role = 'super_admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```
The admin lives at `/admin`. Employers use `/employer`, businesses use `/partner`.

**Districts.** The list of Ashanti metropolitan, municipal and district assemblies is not hard-coded. The migrations load 43 Ashanti districts as **inactive and unverified** (from a secondary source); a regional editor must check each against the official list and activate it (see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)). Content cannot be published until it belongs to an active district.

## Scripts
`npm run dev` · `build` · `lint` · `typecheck` · `test` (unit) · `test:e2e` (Playwright; needs a production build, a local Supabase and `psql`)

If `psql` is not on your path, point the tests at it: `PSQL=/path/to/psql npm run test:e2e`.

Database permission checks (each runs in one rolled-back transaction and prints PASS or FAIL per check):
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/geography_rls.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/jobs_rls.sql
```

## Branches
`main` · `rebrand/visitasanteman` (regional foundation and phases 1 to 8) · `feature/regional-experience` (Part A and Jobs & Careers, the most current work).

## Documentation
| Doc | Purpose |
|---|---|
| [PROGRESS](docs/PROGRESS.md) | Current state; a fresh session can resume from here |
| [SYSTEM_ARCHITECTURE](docs/SYSTEM_ARCHITECTURE.md) | Modules, data flow, key decisions |
| [DATABASE_SCHEMA](docs/DATABASE_SCHEMA.md) | Tables, relationships, RLS rules |
| [AUTHENTICATION](docs/AUTHENTICATION.md) | Roles and access control |
| [ENVIRONMENT_VARIABLES](docs/ENVIRONMENT_VARIABLES.md) | Every setting and where it goes |
| [DEPLOYMENT_GUIDE](docs/DEPLOYMENT_GUIDE.md) | Supabase + Vercel + domain go-live steps |
| [ADMIN_USER_GUIDE](docs/ADMIN_USER_GUIDE.md) | Running the CMS day to day, including jobs moderation |
| [PAYMENTS](docs/PAYMENTS.md) | Booking lifecycle, payment security, go-live steps |
| [BUSINESS_PARTNER_GUIDE](docs/BUSINESS_PARTNER_GUIDE.md) | Listing a business, review flow, plans |
| [DEVELOPMENT_ROADMAP](docs/DEVELOPMENT_ROADMAP.md) | Phases, status, open items |
| [LAUNCH_READINESS](docs/LAUNCH_READINESS.md) | Audit results and what is left before launch |
| [CONTENT_PLAN](docs/CONTENT_PLAN.md) | District-by-district content and verification plan |
| [PART-B-DESIGN](docs/PART-B-DESIGN.md) | Designs for items not yet built |
| [VisitAsanteman-brief-v1](docs/VisitAsanteman-brief-v1.md) | Product brief |

## Security notes
- Permissions are enforced in the database (Row Level Security) and re-checked on the server. Hiding a button is never the control.
- Only the publishable key belongs in the browser. `SUPABASE_SERVICE_ROLE_KEY` is server-only, must never have a `NEXT_PUBLIC_` prefix, and must never be committed or pasted into chat, issues or pull requests.
- `.env*` files (except `.env.example`) are gitignored. This repository is public: do not add real keys, personal data, applicant data or private documents.

## Content rule
Nothing in this repo invents facts. Attractions, communities, businesses, prices, coordinates, visa rules, emergency numbers and history are entered by administrators and published only when verified. Asante cultural content, including Adinkra meanings and traditional-institution material, is left for verified entry and custodian review.
