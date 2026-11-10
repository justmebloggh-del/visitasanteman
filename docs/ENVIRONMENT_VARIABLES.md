# Environment variables

Set locally in `.env.local` (git-ignored) and in production in Vercel → Project → Settings → Environment Variables. `NEXT_PUBLIC_*` values are visible in the browser; everything else is server only.

| Variable | Required | Visible to browser | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Yes | Yes | Public key. Safe because RLS limits it |
| `NEXT_PUBLIC_CONSENT_REASK_MONTHS` | No | Yes | How long a cookie-consent choice is kept before visitors are asked again (default 12) |
| `RESEND_BASE_URL` | No | Yes | Test only: points the email sender at a mock server. Leave unset in production |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes | Canonical origin, e.g. `https://www.example.com` (the VisitAsanteman domain is not confirmed yet; never hard-code it). Used in sitemap, emails, canonical tags |
| `NEXT_PUBLIC_GA_ID` | No | Yes | Google Analytics `G-…` ID. Analytics is off if blank |
| `NEXT_PUBLIC_GSC_VERIFICATION` | No | Yes | Search Console meta-tag token |
| `RESEND_API_KEY` | No | **No** | Enables enquiry emails |
| `EMAIL_FROM` | With Resend | No | Verified sender address |
| `ENQUIRY_NOTIFY_EMAIL` | With Resend | No | Inbox that receives new enquiries |
| `DISABLE_RATE_LIMIT` | No | No | **Tests only.** `true` turns off the in-app limiter for Playwright runs. Ignored when `VERCEL` is set. Never set in production |
| `AI_ASSISTANT_ENABLED` | No | No | `true` turns on AI itinerary suggestions (also needs `ANTHROPIC_API_KEY`) |
| `ANTHROPIC_API_KEY` | With AI | **No** | Claude API key. Server only |
| `ANTHROPIC_MODEL` | No | No | Defaults to `claude-sonnet-5-5` |
| `ANTHROPIC_BASE_URL` | No | No | **Tests only** (mock model). Leave unset in production |
| `PAYMENTS_ENABLED` | No | No | `true` switches on online payment. Leave unset until tested (see PAYMENTS.md) |
| `PAYSTACK_SECRET_KEY` | With payments | **No** | Paystack secret key (use the **test** key first) |
| `SUPABASE_SERVICE_ROLE_KEY` | With payments | **No** | Used only by `lib/payments` to record gateway-verified payments. Bypasses RLS: never expose |
| `PAYSTACK_BASE_URL` | No | No | **Tests only.** Points the app at a mock gateway. Leave unset in production |

## Rules
- The Supabase **service-role key** is used **only** by the payment module (`lib/payments`, via `lib/supabase/admin.ts`). Keep it server-only, never in a `NEXT_PUBLIC_` variable, and do not import the admin client anywhere else.
- Never put secrets in the database (`site_settings` is publicly readable) or in documentation.
