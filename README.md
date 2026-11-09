# Visit Lake Bosomtwe

Destination tourism platform for Lake Bosomtwe (Bosomtwe District, Ashanti Region, Ghana): public website, built-in CMS/admin, and a data model ready for the business portal, bookings and payments.

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

## Scripts
`npm run dev` · `build` · `lint` · `typecheck` · `test` (unit) · `test:e2e` (Playwright)

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

## Content rule
Nothing in this repo invents facts. Attractions, communities, businesses, prices, coordinates and history are entered by administrators and published only when verified.
