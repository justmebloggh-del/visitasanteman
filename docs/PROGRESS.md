# Progress

_Last updated: 2026-11-09._ A fresh session can resume from this file.

## State
- Branch `rebrand/visitasanteman`: all eight phases of the VisitAsanteman master plan are built and committed (see `DEVELOPMENT_ROADMAP.md`, `LAUNCH_READINESS.md`). Nothing is deployed or pushed.
- Branch `feature/regional-experience` (from the above): Part A of `CLAUDE-CODE-PROMPT-visitghana-inspired-features.md`.

## Part A (this branch)
| Item | Status |
|---|---|
| A1 Navigation grouped by visitor intent (desktop disclosure menus, mobile accordion) | done |
| A2 Plan Your Visit CMS pages (Why Ashanti, Getting Around, Travel Information, Visa and Entry) with public last-verified date and source | done |
| A3 Homepage quick links (managed, max six, hidden while their page is unpublished) | done |
| A4 Themes (Eat, Wear, See, Feel; tour categories), admin pickers, `/themes/[slug]`, homepage block | done |
| A5 "Explore by type" category grid (cover, featured, order) | done |
| A6 "Browse by district" | done |
| A7 Upcoming events strip, per-occurrence `date_verified`, "Date to be confirmed" | done |
| A8 Cookie consent, GA gated by consent, cookie policy page (draft) | done |
| A9 WhatsApp button | done |
| A10 Footer: social links, newsletter, hashtag ticker | done |
| A11 Media menu group; articles and gallery in sitemap and internal links | done |
| Part B | design notes only: `PART-B-DESIGN.md` |

## Beyond Part A (this branch, uncommitted)
| Item | Status |
|---|---|
| Jobs & Careers: employers, vacancies, applications, private CVs, saved jobs, reports, moderation, `/jobs`, employer portal, JobPosting data | built and tested locally (SQL 50 checks, unit tests, e2e) |
| Jobs not yet built: full candidate profiles (education, experience, skills), job alerts, interview scheduling beyond a date field, recruitment packages and payments, employer verification document upload, per-district job landing pages (use the `/jobs?area=` filter) | open |
| Not built: mobile app, Excel import, Hubtel, audio and QR guides, diaspora portal, event ticketing and awards tooling, logo concepts, Part B (B1 to B6), strategy documents | open |

## Decisions
- Cookie consent is stored in a first-party cookie (`vasa_consent`), not localStorage. Optional categories: Functional, Analytics, Advertising. The site currently uses no functional or advertising cookies; sponsored placements are first-party and cookie-free. GA loads only after Analytics consent (needs `NEXT_PUBLIC_GA_ID` at build time).
- The cookie policy page is an empty CMS draft: wording must be written and reviewed by someone qualified (Ghana Data Protection Act, 2012, Act 843).
- Quick-link and theme descriptions are blank: administrators write them.

## Blockers and open items (need the owner)
- Real content and photographs; verified district list; cultural and legal review; domain and accounts (see `LAUNCH_READINESS.md`).
- Written confirmation before Part B starts.

## Next
Part B only on confirmation; otherwise deployment preparation once accounts exist.
