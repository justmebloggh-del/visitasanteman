# VisitAsanteman

Tourism platform for the whole Ashanti Region of Ghana: public website, built-in CMS/admin, business partner portal, bookings, travel planner, investment and advertising. Content is organised by district (metropolitan, municipal and district assemblies). Lake Bosomtwe is one destination within it.

> **Rebrand note.** The project began as *Visit Lake Bosomtwe*. Phase 1 of the VisitAsanteman rebrand (regional geography, roles and workflow, new navigation and pages) is described in [docs/VisitAsanteman-rebrand-assessment.md](docs/VisitAsanteman-rebrand-assessment.md) and [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md). The product brief is [docs/VisitAsanteman-brief-v1.md](docs/VisitAsanteman-brief-v1.md).

**Status:** Phases 1 to 3 implemented (website + CMS, business partner portal, bookings/payments/reviews) most of Phase 4 (travel planner, nearby, recommendations, AI assistant, PWA) and Phase 5 (investment portal, advertising). Payments are off until tested with real Paystack keys. See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) for what is done and what is next.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · MapLibre + OpenStreetMap · Zod · Vitest · Playwright

## Quick start
```bash
npm install
cp .env.example .env.local        # fill in Supabase values
npx supabase start                # local Postgres/Auth/Storage (needs Docker), prints URL + keys
npx supabase db reset             # applies supabase/migrations + supabase/seed.sql
npm run dev
```
Create an account at `/register`, then promote it to super administrator (once):
```sql
update user_roles set role = 'super_admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```
The admin lives at `/admin`.

**Districts.** The list of Ashanti metropolitan, municipal and district assemblies is not hard-coded. The migrations load 43 Ashanti districts as **inactive and unverified** (from a secondary source); a regional editor must check each against the official list and activate it (see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)). Content cannot be published until it belongs to an active district.

## Scripts
`npm run dev` · `build` · `lint` · `typecheck` · `test` (unit) · `test:e2e` (Playwright, needs a production build and local Supabase)

Database permission checks (one rolled-back transaction, prints PASS/FAIL per check):
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/geography_rls.sql
```

## Documentation
| Doc | Purpose |
|---|---|
| [SYSTEM_ARCHITECTURE](docs/SYSTEM_ARCHITECTURE.md) | Modules, data flow, key decisions |
| [DATABASE_SCHEMA](docs/DATABASE_SCHEMA.md) | Tables, relationships, RLS rules |
| [AUTHENTICATION](docs/AUTHENTICATION.md) | Roles and access control |
| [ENVIRONMENT_VARIABLES](docs/ENVIRONMENT_VARIABLES.md) | Every setting and where it goes |
| [DEPLOYMENT_GUIDE](docs/DEPLOYMENT_GUIDE.md) | Supabase + Vercel + domain go-live steps |
| [ADMIN_USER_GUIDE](docs/ADMIN_USER_GUIDE.md) | Running the CMS day to day |
| [PAYMENTS](docs/PAYMENTS.md) | Booking lifecycle, payment security, go-live steps |
| [BUSINESS_PARTNER_GUIDE](docs/BUSINESS_PARTNER_GUIDE.md) | Listing a business, review flow, plans |
| [DEVELOPMENT_ROADMAP](docs/DEVELOPMENT_ROADMAP.md) | Phases, status, open items |
| [CONTENT_PLAN](docs/CONTENT_PLAN.md) | District-by-district content and verification plan |

## Content rule
Nothing in this repo invents facts. Attractions, communities, businesses, prices, coordinates and history are entered by administrators and published only when verified.
