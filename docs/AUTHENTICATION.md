# Authentication and access control

## Sign-in
Supabase Auth, email + password, email verification, password reset.
- `/register` → verification email → `/auth/callback` exchanges the code → session cookie.
- `/forgot-password` → email → `/auth/callback?next=/reset-password` → `/reset-password`.
- Login and reset responses do not reveal whether an email has an account.
- Redirect targets (`?next=`) must be same-site relative paths (open-redirect guard).

## Roles
`super_admin`, `admin`, `editor`, `partner`, `visitor` (stored in `user_roles`). Anonymous browsing is the "public visitor".

**Self-registration always creates a `visitor`.** A database trigger assigns the role; no role value is accepted from the browser. Elevation is done by a super administrator in `/admin/users` (or SQL for the very first one, see README).

## Business (partner) accounts
Registration at `/partner/register` creates a normal visitor account. After email verification, `/partner/activate` calls the database function `become_partner(type)`, the only path to the `partner` role. The function checks the email is verified, only moves `visitor → partner`, and sets the account type once. Partners can manage only listings where `owner_id = auth.uid()`, and the database refuses any attempt to publish, verify, feature or change plan/owner.

## Enforcement layers
1. **Database RLS** (authoritative). Role helpers `is_staff()`, `is_admin()`, `is_super_admin()` read `user_roles`.
2. **Server code**: `requireStaff()`, `requireAdmin()`, `requireSuperAdmin()` in `lib/auth/session.ts` re-read the role from the database on every admin page and every server action.
3. **`proxy.ts`**: refreshes the session and redirects signed-out users from `/admin`. Convenience only.
4. **UI**: hides controls a role cannot use. Never relied on.

## Rate limiting
Login, registration, reset, enquiry and newsletter actions are throttled with an in-memory limiter. On serverless this is per instance, so it only slows casual abuse. Add Vercel Firewall rate limits or Upstash Redis before launch (see deployment guide).
