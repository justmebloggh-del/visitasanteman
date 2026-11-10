# Deployment guide

## 1. Supabase (production project)
1. Create a project (choose a region close to Ghana users, e.g. `eu-west`/`eu-central`).
2. Link and push the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`. (The seed is for local; run `supabase/seed.sql` once in the SQL editor for categories, homepage sections and draft community names.)
3. Authentication → URL configuration: **Site URL** = production origin; **Redirect URLs** include `https://<domain>/auth/callback`.
4. Authentication → Providers → Email: keep **Confirm email** ON. Configure custom SMTP (Resend) so verification and reset emails come from your domain and are not rate-limited.
5. Authentication → Password: set minimum length 8+ and enable leaked-password protection if your plan has it.
6. Storage: confirm bucket `media` exists (created by the migration), public read, 5 MB limit, images only.
7. Backups: enable daily backups (Pro plan) or schedule `pg_dump`. Test a restore before launch.
8. Create the first super administrator (see README SQL).
9. **Check and activate the districts.** Migration `20261113000004` loads 43 Ashanti entries as **inactive and unverified**, taken from a secondary source (citypopulation.de, crediting Ghana Statistical Service, retrieved 2026-11-09). Before launch, a regional editor compares each with the official Local Government Service list in Admin → Districts, corrects the name or type, replaces the source text, sets *Source checked on* and ticks *Active*. Add or remove any assemblies that differ (assemblies have been created and renamed over time). Nothing can be published into an inactive district.
10. Supabase local project id is `visitasanteman` (`supabase/config.toml`). After pulling this change, run `npx supabase stop --project-id visitbosomtwe` once to stop the old local stack, then `npx supabase start`.

## 2. Vercel
1. Import the GitHub repo. Framework: Next.js.
2. Add environment variables from `docs/ENVIRONMENT_VARIABLES.md` for Production and Preview.
3. Deploy. Check `/`, `/sitemap.xml`, `/robots.txt`, `/login`, and `/admin` (redirects to login when signed out).
4. Add rate limiting: Vercel Firewall rules for `POST` to `/login`, `/register`, `/contact`, `/forgot-password` (the in-app limiter is per instance only).

## 3. Domain, DNS, SSL
Add the domain in Vercel, set the DNS records it shows (at your registrar or Cloudflare). If using Cloudflare, set records to **DNS only** at first, or SSL mode to *Full (strict)*, to avoid redirect loops. Vercel issues SSL automatically. Update `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL to the final domain, then redeploy.

### Redirects from an old address
Path redirects live in `config/redirects.ts` (permanent, page to page, applied by `next.config.ts`). The Lake Bosomtwe site never launched on a public address, so the list only holds menu-name aliases. If an old domain existed: add each old path and its closest new page to that file, and configure the old-domain to new-domain redirect in the Vercel dashboard (Domains, redirect to the new domain, 308). Always read the canonical origin from `NEXT_PUBLIC_SITE_URL`.

## 4. Search and analytics
Create a GA4 property → `NEXT_PUBLIC_GA_ID`. Add the site in Search Console, verify with the meta tag (`NEXT_PUBLIC_GSC_VERIFICATION`), submit `/sitemap.xml`.

## 4b. Security headers and rate limits
`next.config.ts` sets a Content Security Policy (production only), HSTS, `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy. The CSP is built from `NEXT_PUBLIC_SUPABASE_URL` and allows OpenStreetMap tiles and Google Analytics; if you change map or analytics providers, update it there. Check the deployed site's response headers after deploying. Add Vercel Firewall rate limits for `/login`, `/register`, `/forgot-password`, `/contact`, `/search`, `/api/search/suggest` and `/api/ads/*`.

## 5. Pre-launch checklist
See [LAUNCH_READINESS.md](LAUNCH_READINESS.md) for the audit results and the full open-items list, and use **Admin → Launch readiness** for the live checklist.

- [ ] Real content published (photos, verified facts, contact details). Empty sections hide themselves, but a nearly empty site should not launch
- [ ] Privacy and Terms pages written and **legally reviewed** (they start empty)
- [ ] Email delivery tested (register, reset, enquiry notification)
- [ ] OSM tile usage reviewed, or a tile provider configured, for expected traffic
- [ ] Test accounts for each role used to confirm permissions
- [ ] Backup restore tested
- [ ] Districts loaded from a cited official source and checked by a person
- [ ] Run `supabase/tests/geography_rls.sql` against a staging copy of the schema
- [ ] Cultural and traditional content reviewed by the appropriate custodians
- [ ] Real VisitAsanteman logo supplied (replace the body of `components/brand/Wordmark.tsx`)
