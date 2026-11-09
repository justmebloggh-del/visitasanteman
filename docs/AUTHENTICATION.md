# Authentication and access control

## Sign-in
Supabase Auth, email + password, email verification, password reset.
- `/register` → verification email → `/auth/callback` exchanges the code → session cookie.
- `/forgot-password` → email → `/auth/callback?next=/reset-password` → `/reset-password`.
- Login and reset responses do not reveal whether an email has an account.
- Redirect targets (`?next=`) must be same-site relative paths (open-redirect guard).

## Roles
`super_admin`, `admin`, `regional_editor` (Regional Tourism Editor), `editor` (Content Editor), `media_manager`, `partner`, `visitor` (stored in `user_roles`). Anonymous browsing is the "public visitor".

**Self-registration always creates a `visitor`.** A database trigger assigns the role; no role value is accepted from the browser. Elevation is done by a super administrator in `/admin/users` (or SQL for the very first one, see README).

### Who can do what
| Capability | Super admin | Admin | Regional editor | Content editor | Media manager |
|---|:-:|:-:|:-:|:-:|:-:|
| Enter `/admin` | yes | yes | yes | yes | media library only |
| Create and edit content drafts, send for review | yes | yes | yes | yes | no |
| **Approve and publish** content | yes | yes | yes | no | no |
| Mark content verified, set "last verified" | yes | yes | yes | no | no |
| Manage regions, districts (administrative areas) | yes | yes | yes | no | no |
| Upload and edit media | yes | yes | yes | yes | yes |
| Read enquiries, bookings, user list | yes | yes | yes | yes | no |
| Delete content or media | yes | yes | no | no | no |
| Listing verified badge, featured, plan, owner | yes | yes | no | no | no |
| Subscription plans, advertisements, site settings | yes | yes | no | no | no |
| Refunds, audit log | yes | yes | no | no | no |
| Change user roles | yes | no | no | no | no |

Editorial workflow: Draft, In review (`pending_review`), Approved, Published, Archived. A database trigger (`guard_editorial_workflow`) refuses `approved` or `published` unless the caller is a super admin, admin or regional editor. Timed publishing for articles still uses a future `published_at`; there is no separate "scheduled" status.

Publishing also requires an active administrative area (district): trigger `guard_publish_requires_area` on communities, attractions, listings, events, experiences and destinations. The area is filled automatically from the community or destination when left blank.

Helper functions (all `security definer`, read `user_roles`): `is_staff()` (super admin, admin, regional editor, editor), `is_admin()`, `is_super_admin()`, `can_approve()`, `can_manage_geography()`, `can_manage_media()`. Permissions are checked by `supabase/tests/geography_rls.sql` (93 checks).

## Business (partner) accounts
Registration at `/partner/register` creates a normal visitor account. After email verification, `/partner/activate` calls the database function `become_partner(type)`, the only path to the `partner` role. The function checks the email is verified, only moves `visitor → partner`, and sets the account type once. Partners can manage only listings where `owner_id = auth.uid()`, and the database refuses any attempt to publish, verify, feature or change plan/owner.

## Enforcement layers
1. **Database RLS and triggers** (authoritative). Role helpers read `user_roles`.
2. **Server code**: `requireStaff()`, `requireApprover()`, `requireMediaAccess()`, `requireAdmin()`, `requireSuperAdmin()` in `lib/auth/session.ts` re-read the role from the database on every admin page and every server action.
3. **`proxy.ts`**: refreshes the session and redirects signed-out users from `/admin`. Convenience only.
4. **UI**: hides controls a role cannot use. Never relied on.

## Rate limiting
Login, registration, reset, enquiry and newsletter actions are throttled with an in-memory limiter. On serverless this is per instance, so it only slows casual abuse. Add Vercel Firewall rate limits or Upstash Redis before launch (see deployment guide).
