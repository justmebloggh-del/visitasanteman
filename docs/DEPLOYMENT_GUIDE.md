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

## 2. Vercel
1. Import the GitHub repo. Framework: Next.js.
2. Add environment variables from `docs/ENVIRONMENT_VARIABLES.md` for Production and Preview.
3. Deploy. Check `/`, `/sitemap.xml`, `/robots.txt`, `/login`, and `/admin` (redirects to login when signed out).
4. Add rate limiting: Vercel Firewall rules for `POST` to `/login`, `/register`, `/contact`, `/forgot-password` (the in-app limiter is per instance only).

## 3. Domain, DNS, SSL
Add the domain in Vercel, set the DNS records it shows (at your registrar or Cloudflare). If using Cloudflare, set records to **DNS only** at first, or SSL mode to *Full (strict)*, to avoid redirect loops. Vercel issues SSL automatically. Update `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL to the final domain, then redeploy.

## 4. Search and analytics
Create a GA4 property → `NEXT_PUBLIC_GA_ID`. Add the site in Search Console, verify with the meta tag (`NEXT_PUBLIC_GSC_VERIFICATION`), submit `/sitemap.xml`.

## 5. Pre-launch checklist
- [ ] Real content published (photos, verified facts, contact details). Empty sections hide themselves, but a nearly empty site should not launch
- [ ] Privacy and Terms pages written and **legally reviewed** (they start empty)
- [ ] Email delivery tested (register, reset, enquiry notification)
- [ ] OSM tile usage reviewed, or a tile provider configured, for expected traffic
- [ ] Test accounts for each role used to confirm permissions
- [ ] Backup restore tested
