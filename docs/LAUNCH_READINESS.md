# Launch readiness: audits, results and what is still open

Date of audit: 2026-11-09, on a local production build (`npm run build`) with a local Supabase. Nothing has been deployed.
The live checklist is in the admin: **Admin → Launch readiness**. It shows whether settings exist (never their values).

## What was audited, and how

| Area | Method | Result |
|---|---|---|
| Security headers | e2e test on every kind of response | CSP, HSTS, X-Frame-Options (DENY), nosniff, Referrer-Policy, Permissions-Policy, COOP present; `X-Powered-By` removed. Production only for CSP (the dev server needs eval) |
| CSP does not break the site | e2e on home, map, search, forms, login, planner, districts, capturing `securitypolicyviolation` events and page errors | No violations |
| Secrets in the browser bundle | e2e scans `.next/static` for key shapes (Supabase secret/service-role JWT, Paystack, Resend, Anthropic) | None found |
| Database safety | 164 SQL checks (`supabase/tests/geography_rls.sql`) incl. every public table has RLS, anonymous visitors can write only to the two form tables, only a known list of functions is anonymous-callable, every `security definer` function pins `search_path` | Pass. Fixed along the way: anonymous visitors had unneeded write/TRUNCATE grants (blocked by RLS, now revoked); ad counters were editable by administrators through the API |
| Dependencies | `npm audit` | Production dependencies: 0 vulnerabilities. 8 moderate advisories in the lint toolchain only (`minimatch` via `typescript-eslint`), not shipped |
| SEO | e2e crawl of every URL in the sitemap: 200, unique, one `<h1>`, title, description, canonical, `lang`, Open Graph, valid JSON-LD, not `noindex` | Pass. Fixed: homepage had no canonical; the sitemap listed CMS pages that were `noindex`; empty or filtered-out lists are now `noindex` and sections with no published records are left out of the sitemap |
| Broken links | e2e follows every internal link found on 37 public pages | None |
| Accessibility | axe-core (WCAG 2.0/2.1 A and AA) on 17 key pages, desktop and mobile | Pass after fixes: logo link label now contains its visible text; search suggestions no longer nest links in `option`s; in-text links are underlined; "Sponsored" label contrast raised |
| Mobile layout | e2e at 360 px and 412 px on 37 pages: no horizontal scrolling | Pass |
| Performance | e2e budget on a local production build: LCP < 2.5 s, CLS < 0.1, < 2 MB transferred, < 80 requests (home, attractions, districts, search, map) | Pass locally |

## What these audits cannot tell you
- **Accessibility:** automated tools find only a fraction of problems. Before launch, test by keyboard alone, with a screen reader (VoiceOver, NVDA, TalkBack), at 200% zoom, and with real users.
- **Performance:** the numbers are from a local server with almost no data and no CDN. Run Lighthouse or PageSpeed Insights against the deployed staging site on a mobile profile, and watch Core Web Vitals in Search Console after launch. The site has no real photographs yet; large unoptimised images are the most likely cause of slow pages once content arrives.
- **Security:** this is not a penetration test. The in-memory rate limiter only slows casual abuse on serverless; add Vercel Firewall (or Upstash) rate limits for login, registration, contact, forgot-password, search and the ad click route. CSP allows inline scripts because Next.js injects them; moving to nonces is a later hardening step.
- **Real services:** Paystack, Resend, Anthropic and Google Analytics have been exercised only against mocks or not at all.

## Still open before a public launch (none of this is code)
1. **Accounts and domain:** Supabase project, Vercel project, GitHub repository, the VisitAsanteman domain. Set `NEXT_PUBLIC_SITE_URL` to the real https origin.
2. **Verified districts:** the 43 districts are unverified and inactive. Check each against the Local Government Service list and activate them.
3. **Real content:** verified attractions, communities, businesses, photographs with usage rights, coordinates, descriptions. The platform contains researched *drafts* only (52 attractions, 13 institutions, 2 stadiums, 3 transport records, 5 markets, 4 ceremonies, 9 itinerary titles): none is public.
4. **Cultural review:** ceremony, tradition, Adinkra and festival text must be reviewed by the appropriate custodians before publication.
5. **Legal:** Privacy policy, Terms, cancellation and refund wording, advertising terms and the investment page wording need a lawyer.
6. **Logo:** a text wordmark is used; replace `components/brand/Wordmark.tsx` when the logo exists.
7. **Email:** verify the sending domain in Resend, set `RESEND_API_KEY`, `EMAIL_FROM`, `ENQUIRY_NOTIFY_EMAIL`.
8. **Payments:** test Paystack in test mode with real test keys (init, return page, signed webhook), then decide on live keys and merchant approval. Hubtel is not built.
9. **Backups:** enable daily database backups and test a restore.
10. **Edge rate limits** and an uptime/error monitor (see the deployment guide).
11. **Redirects:** if an older public address exists, add its paths to `config/redirects.ts` and redirect the old domain in the hosting dashboard.
12. **Search Console and analytics:** create the property, set `NEXT_PUBLIC_GSC_VERIFICATION` and `NEXT_PUBLIC_GA_ID`, submit `/sitemap.xml`.

## Re-running the audits
```bash
npx supabase db reset                       # clean local database
npm run build
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/geography_rls.sql
npm test && npm run lint && npm run typecheck
npx playwright test                         # includes the zz-audit.spec.ts audits (needs the production build)
```
