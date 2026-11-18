# Security audit (18 November 2026)

Scope: the code in this repository, the local database, the live site's public responses (headers, scripts, redirects) and the live
Supabase authentication endpoint (with made-up accounts only). Not done: a penetration test, a review of the Supabase and Vercel
dashboards (no access), or any change to the hosted database.

## Checked and sound
- **Row Level Security** is on for every table in the public schema; every SECURITY DEFINER function pins its search_path; the views
  that expose data are limited (security barrier or published-only).
- **Anonymous access**: anonymous visitors can read only published content, and can write only the three public forms (enquiries,
  newsletter, nominations), each limited by a policy and length/format checks. Sensitive tables (enquiries, profiles, applications)
  return nothing to anonymous users.
- **Files**: CVs are in a private bucket (5 MB, PDF/DOCX only, file signature checked, short-lived signed links); the media bucket
  accepts only images and MP4/WebM, up to 50 MB; no SVG, so no scriptable uploads.
- **Authentication**: roles are read from the database, never from the browser; role changes need a super administrator; redirects after
  sign-in and in the email callback accept only same-site paths; password reset and sign-up answer the same way whether or not an
  account exists.
- **Payments**: the Paystack webhook checks an HMAC with a constant-time comparison, then re-verifies with Paystack.
- **Output**: no raw HTML from editors (Markdown without HTML); JSON-LD is escaped; external links use rel="noopener noreferrer";
  CSV exports neutralise spreadsheet formulas.
- **Browser protections** (live): HSTS (2 years), CSP, frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy, COOP; no
  X-Powered-By; no source maps (403); no secrets, service-role key or JWT in any public script; /admin responses are no-store.
- **Dependencies**: `npm audit --omit=dev` found 0 known vulnerabilities. No secret-shaped strings in the git history (the only database
  URL is the local development one).
- **Database permission tests**: geography, jobs and awards suites pass.

## Fixed in this change
1. **Review moderation and reply actions** now check the caller in the application as well as in the database rules, and a tampered return
   address cannot send someone to another website.
2. **Markdown links** beginning with `//` (a link to another site) are no longer treated as site paths.
3. **Passwords** must be at least 10 characters when chosen (sign-up, partner sign-up, reset).
4. **CAPTCHA support** (Cloudflare Turnstile) for sign-in, sign-up and password reset, off until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set.
   Sign-in used to fail with "Incorrect email or password" whenever Supabase CAPTCHA was on; it now says what happened, and a token is sent when configured.
5. **Headers**: sign-in and account pages are `no-store`; `X-Permitted-Cross-Domain-Policies: none`; CSP allows Turnstile only when it is configured.
6. **Upload size**: the server-action request limit is 6 MB so a permitted 5 MB CV is not refused, while Next.js origin (CSRF) checking stays on.
7. Two database tests that had drifted with the content data (Q59, S09) were corrected; the wildcard search itself already treated `%` as text.

## Needs you (cannot be fixed from the code)
1. **Rotate the Supabase service-role key.** It was exposed earlier in conversation. Supabase, Project Settings, API Keys; then update
   `SUPABASE_SERVICE_ROLE_KEY` in Vercel and your local environment file. This is the most important item.
2. **Brute-force protection is thinner now that CAPTCHA is off.** Either keep it off and rely on Supabase's own sign-in rate limits, or
   create a Turnstile site in Cloudflare, switch CAPTCHA on in Supabase (provider Turnstile, secret key there), and set
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel (Production), then redeploy. The site code is ready for it. Not tested against the hosted project.
3. **Turn on multi-factor sign-in for the admin account** (Supabase supports authenticator-app codes) and use a long, unique password.
4. **Rate limiting is per server instance** (in memory), so it only slows casual abuse on a serverless host. Add a Vercel Firewall rate-limit rule
   for the sign-in, contact, newsletter and registration routes. The public forms can also be posted to the database directly with the
   public key; the database limits field sizes, but cannot stop volume. A Turnstile check on those forms is the next step if spam appears.
5. **Leaked-password protection** (blocks known breached passwords) is a Supabase setting on paid plans.
6. **Test rows on the live database** from an earlier test (`visitor-test@example.com`, `newsletter-test@example.com`) should be deleted.
7. **Local development uses the live Supabase project** (its address resolved to the hosted project). Point your local environment at the
   local Supabase (`npx supabase status`) so tests and experiments never write to live data.
8. **Supabase auth URLs**: set the Site URL and redirect URL to the live domain.

## Accepted and noted
- The CSP allows inline scripts and styles (`'unsafe-inline'`) because Next.js inlines hydration code; removing it needs per-request
  nonces, which would turn off static caching and slow every page. The rest of the policy is tight.
- Supabase session cookies are readable by the site's own scripts (the browser client needs them), as is standard for this library.
- The media bucket's objects can be listed by anyone; the bucket is public by design and holds only published media.
