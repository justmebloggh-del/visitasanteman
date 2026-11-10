# Prompt for Claude Code in VS Code: visitghana.com-inspired features for VisitAsanteman

Paste everything below the line into Claude Code with the `visitbosomtwe` project root open. Run it **after** the Phase 1 rebrand and geography work is committed. If Phase 1 is not done, the prompt tells Claude to stop and report.

---

You are the lead full-stack engineer on **VisitAsanteman**, the Ashanti Region tourism platform (rebranded from Visit Lake Bosomtwe). The codebase is a working Next.js 16, React 19, TypeScript, Tailwind 4 and Supabase application with a custom config-driven admin. This session adds a set of homepage, navigation, compliance and engagement features that were identified by reviewing the structure of the Ghana Tourism Authority site, visitghana.com. Everything must be built as **original VisitAsanteman work**: take the *idea* only. Do not copy any text, images, icons, layout code or branding from visitghana.com or any other site.

## 0. Read first, then check prerequisites

1. `AGENTS.md`. This Next.js version has breaking changes: read the relevant guides in `node_modules/next/dist/docs/` before writing Next.js code.
2. `docs/PROGRESS.md` (if present), `docs/VisitAsanteman-rebrand-assessment.md`, `docs/VisitAsanteman-master-prompt-ADDENDUM.md`, `docs/DATABASE_SCHEMA.md`, `docs/AUTHENTICATION.md`, `config/site.ts`, `config/admin-resources.ts`, the header, footer and homepage components, and every migration in `supabase/migrations/`.
3. Run `git log --oneline -20` and `git status`. **Prerequisite check:** the `administrative_areas` table, the VisitAsanteman branding and the new roles from Phase 1 should exist. If they do not, stop and tell me what is missing. Do not implement the geography-dependent items (feature 8) without them.
4. Create a branch `feature/regional-experience` from the current Phase 1 branch. Run typecheck, lint, unit and e2e tests and record the true baseline. Never say a test passed unless you ran it and saw it pass.

## 1. Non-negotiable rules

- **Extend, do not rewrite.** Reuse the existing admin framework, `homepage_sections`, `site_settings`, `pages`, `media`, RLS helpers and UI components. Add no dependency without a one-line justification in the commit message.
- **Migrations are append-only**, dated after the latest existing one. Never edit an applied migration. Data changes also go in migrations.
- **No invented facts.** No made-up visa rules, emergency numbers, fares, opening hours, event dates, coordinates, prices or statistics. Unknown means empty, and empty sections must hide cleanly instead of showing placeholders.
- **Secrets:** do not open, print or commit `.env.local`. Never expose the service-role key to the browser.
- **Permissions in the database and on the server.** Every new table has RLS and a test. Hiding a button is not a control.
- **Every visible control must work.** No dummy buttons or fake success messages.
- **Accessibility and performance:** keyboard operable, visible focus, adequate contrast, `prefers-reduced-motion` respected, no layout shift, mobile first. Do not add heavy client-side JavaScript for decoration.
- **British English** in all user-facing copy. Tone: welcoming, proud of Asante heritage, free of exaggerated claims.
- **Cultural care:** do not write Asante history or the meanings of Adinkra symbols from your own knowledge. Build structure; leave content for verified entry.

## 2. PART A: build these features now

Work through them in order. Commit after each one with a clear message, run typecheck, lint and the relevant tests, and keep `docs/PROGRESS.md` current.

### A1. Navigation grouped by visitor intent
Restructure the main menu in `config/site.ts` and the header into intent groups with dropdowns (desktop) and an accessible expandable menu (mobile): **Explore Ashanti** (Destinations, Districts, Attractions, Map), **Culture & Heritage**, **Experiences**, **Where to Stay**, **Food & Dining**, **Events**, **Plan Your Visit** (Why Ashanti, Getting Around, Travel Information, Travel Planner, Travel Guide), **Media** (News and Articles, Gallery), **Business Directory**, **About Us**, **Contact**. Keep a prominent "Plan Your Visit" call to action and a reachable search entry on mobile. Link only to pages that exist; for planned pages create CMS-managed `pages` entries that show the existing "being prepared" state until an administrator publishes them. All existing URLs must keep working. Keyboard navigation and screen-reader labels are required.

### A2. "Plan Your Visit" content pages (CMS-managed)
Create managed static pages for **Why Ashanti**, **Getting Around Ashanti**, **Travel Information** and **Visa and Entry** using the existing `pages` mechanism (draft, "being prepared" until published). Do not write visa, immigration, health, safety or transport facts yourself. For Visa and Entry, the page should link to the official Ghana government sources once an administrator supplies and verifies them. Add a "last verified" date and a source field on these pages, shown publicly.

### A3. Homepage quick-link strip
Add a CMS-managed strip near the top of the homepage with up to six links (default set: Getting Around, Travel Information, Visa and Entry, Events, Map, Plan Your Visit). Store it using the existing `homepage_sections` config or a small table, editable in admin, with icon, label, URL and order. Hide any link whose target page is unpublished.

### A4. Experience themes: Eat, Wear, See, Feel, and tour categories
Add a `themes` taxonomy with a `kind` of `experience_theme` (Eat, Wear, See, Feel) or `tour_category` (Nature, Culture, Lifestyle, Heritage), plus a link table that can attach a theme to attractions, listings, experiences, events and articles (follow the pattern used by `media_links`; enforce valid entity types with a constraint or trigger). Seed only the eight theme names, with no descriptions. Add admin management and theme pickers on the relevant forms. Public pages: `/themes/[slug]` showing published items of any type with that theme, and a homepage block presenting the four experience themes with a count of published items. Hide themes that have no published content. The meaning of "Wear" and similar copy is written by an administrator, not by you.

### A5. Homepage category card grid
Add an "Explore by type" grid driven by `attraction_categories` (cover image, name, count of published attractions, link to the filtered directory). Add a cover media field to categories if missing. Hide empty categories. Include admin controls to feature and order cards. Do not create attractions to fill the grid.

### A6. Browse by district (depends on Phase 1)
Add a homepage "Browse by district" section using `administrative_areas` that have published content, with counts and a link to `/districts/[slug]` and to the map. Provide a compact list view and an accessible fallback that does not rely on a map. If districts have no published content yet, hide the section.

### A7. Upcoming events strip
Add a homepage strip with the next published events (title, date, district, link) and an "All events" link. Use only published, administrator-verified dates. Do not assume that traditional festivals fall on fixed Gregorian dates. If the events table lacks a per-occurrence "date verified" flag, add one and show unverified dates as "Date to be confirmed".

### A8. Cookie consent and analytics gating
Implement a consent banner with **Accept all**, **Reject all** and **Customise**, with categories: Necessary (always on, for example Supabase auth and the consent record itself), Functional, Analytics, Advertising. Requirements:
- Nothing in the Analytics or Advertising categories loads or sets cookies before consent. Google Analytics (`NEXT_PUBLIC_GA_ID`) loads only after Analytics consent, and stops if consent is withdrawn.
- Rejecting is as easy as accepting, with equal prominence.
- Store the choice and its date in a first-party cookie (wrap any `localStorage` use in try/catch). Re-ask after a configurable period or when categories change.
- A "Cookie settings" link in the footer reopens the panel.
- Add a short Cookie Policy page (CMS-managed, draft until an administrator publishes it) listing categories; do not invent legal wording. Mark it as needing review by someone qualified under Ghana's Data Protection Act, 2012 (Act 843).
- Add unit tests for the consent logic and an e2e test proving GA does not load before consent, loads after Accept, and is absent after Reject.
- Gate any third-party embeds you add later (video, live stream) behind the Functional or Advertising consent.

### A9. WhatsApp contact button
Add a floating "Chat on WhatsApp" button using a plain `https://wa.me/<digits>` link, no third-party widget or script. The number comes from `site_settings.contact.whatsapp` (international format digits). Hide the button if no number is set. Optional prefilled text such as "Hello VisitAsanteman, I would like help planning a visit." Make it keyboard accessible, positioned so it never covers the mobile navigation or form buttons, and add a footer or contact page link too. Do not collect or send any visitor data from the button.

### A10. Footer: social links, newsletter and hashtag ticker
Ensure the footer shows social links only for networks that have a URL in `site_settings.social`, the existing newsletter form, and a slow, pausable text ticker for the campaign hashtag `#VisitAsanteman` (text editable in settings). Respect `prefers-reduced-motion` by showing static text. The ticker must not hurt performance or accessibility (decorative text hidden from screen readers where appropriate).

### A11. Keep news on the same domain
Create a **Media** menu group pointing to `/articles` (News and Articles) and `/gallery`. Make sure article and gallery pages are in the sitemap, have structured data only where accurate, and are internally linked from the homepage and district pages. Do not link out to an external news site.

## 3. PART B: do NOT start until Part A is merged and I confirm in writing

Prepare design notes only (add `docs/PART-B-DESIGN.md`) for:
- **B1. "Welcome to Ashanti" visitor guide:** a printable and downloadable guide generated from CMS pages. Emergency numbers and practical advice appear only after an administrator verifies them against official sources.
- **B2. GTA-licensed operator signal:** fields `gta_licence_number` and `gta_licence_verified_at` on operator listings, writable only by staff (follow the existing trigger pattern that stops partners setting `is_verified`), with a public "Licensed by the Ghana Tourism Authority" badge only when verified.
- **B3. Downloads library:** a `documents` table and a PDF-capable storage bucket (the current bucket accepts images only), staff-only upload, file type and size validation, public listing page for reports and policy documents.
- **B4. Craft-village experiences:** workshop and "buy direct" options on experiences for kente, adinkra, wood-carving and metal-craft communities, with provider consent for published contacts.
- **B5. Live-stream and video embeds on event pages:** URL allowlist (YouTube and Facebook), privacy-enhanced embed domains, consent-gated by A8.
- **B6. "Suggest a place" form:** public, rate-limited, honeypot-protected submissions that arrive as drafts with status "awaiting verification", with an admin review queue. Nothing is published automatically.

## 4. Working method

- Create a task list. After each feature run typecheck, lint and the relevant tests, and fix root causes. Never weaken or delete a test to get a green result, and never silence an error.
- Add or update unit, SQL (RLS) and Playwright tests for: navigation on desktop and mobile, quick links hiding, themes, category grid, events strip, cookie consent and GA gating, the WhatsApp button, and the footer.
- Check mobile layouts, keyboard navigation and the browser console for errors on every new page.
- Update `docs/ADMIN_USER_GUIDE.md`, `docs/DATABASE_SCHEMA.md`, `docs/ENVIRONMENT_VARIABLES.md` and `docs/PROGRESS.md`.
- Do not push, and do not touch any hosted or production service, without asking. Ask me only for credentials, domain decisions, official data or material business choices.

## 5. Checkpoints and definition of done

Stop and report after A4 (taxonomy migration and admin), after A8 (consent and analytics) and at the end of Part A.

Part A is done when: the new navigation, quick links, themes, category grid, district block, events strip, consent banner, WhatsApp button and footer all work on mobile and desktop; sections hide cleanly when empty; analytics are provably blocked before consent; RLS is tested for every new table; no content was invented; all tests pass or each failure is listed with its cause.

## 6. Final report format

What was completed; migrations added; what is working; exact commands run and their results; outstanding defects; decisions, content or credentials needed from me; and recommended next tasks (Part B).
