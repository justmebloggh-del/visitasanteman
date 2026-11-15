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

## Phase 4 (first part, local, not pushed)
| Item | Status |
|---|---|
| Award programmes (`award_programmes`), public `/awards` and `/awards/[slug]`, public nominations with Row Level Security (open programme, own category only), staff review at `/admin/nominations`, shortlist view `award_shortlist` (nominee name only; nominator details never public); only regional editors and administrators can shortlist or name winners | done, tested (`supabase/tests/awards_rls.sql`, 31 checks) |
| Free event registration with optional capacity (`events.registration_enabled`, `capacity`, `event_registrations`, `register_for_event()`), form on the event page, staff list at `/admin/registrations` | done, tested |
| Not built: ticketing and payments, QR check-in, exhibitor and booth applications, sponsor management and dashboards, judging scores, public voting, digital certificates, event revenue tracking, speaker registration, international currencies | open |

## Images and videos (local, not pushed)
- Event videos: the admin event form has a Videos uploader (MP4 or WebM, up to 50 MB, description required); videos are media rows linked to the event and play on the event page. The media library accepts videos too. Migration 20261122000023 widens the storage bucket.
- Built-in photographs from `public/Asante` are catalogued in `config/images.ts` with plain descriptions, and used only where nothing was uploaded: index-page banners, CMS page banners, themes and attraction categories on the homepage, the Lake Bosomtwe destination, the districts map, the Adinkra chart on Traditions, and the Gallery. Uploaded pictures always win.
- None of the Asante photographs is described as the Golden Stool. Photo credits and rights are not recorded and must be confirmed.

## Banner collection (local, not pushed)
- 14 banners (config/banners.ts) share one design (components/banners/Banner.tsx): animated green-and-gold kente background, words left, photograph centre, gold emblem at the far right (own grid column, so nothing overlaps it; phones keep it at the far right, smaller). Named components in components/banners/index.tsx; homepage rotator with controls; slow animations off under reduced motion.
- Words, links and on/off are editable in Admin, Banners (stored in site_settings "banners"). Banner 14 (expo) is off by default: no expo exists yet.
- The emblem is the owner's painted artwork `public/Asante/sika dwa.jpg` (components/banners/SikaDwaEmblem.tsx), shown in a gold-ringed circle. It is not an official depiction of the Golden Stool: confirm accuracy and rights with the custodians before launch.
- The main menu was shortened (Stay & Dine, About groups) because 13 items overflowed at 1440 px.

## Decisions
- Cookie consent is stored in a first-party cookie (`vasa_consent`), not localStorage. Optional categories: Functional, Analytics, Advertising. The site currently uses no functional or advertising cookies; sponsored placements are first-party and cookie-free. GA loads only after Analytics consent (needs `NEXT_PUBLIC_GA_ID` at build time).
- The cookie policy page is an empty CMS draft: wording must be written and reviewed by someone qualified (Ghana Data Protection Act, 2012, Act 843).
- Quick-link and theme descriptions are blank: administrators write them.

## Blockers and open items (need the owner)
- Real content and photographs; verified district list; cultural and legal review; domain and accounts (see `LAUNCH_READINESS.md`).
- Written confirmation before Part B starts.

## Next
Part B only on confirmation; otherwise deployment preparation once accounts exist.
