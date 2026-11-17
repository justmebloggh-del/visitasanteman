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

## Banner collection and image layout (local, not pushed)
- The homepage has no banner: it keeps its original hero with the video background (editable in Admin, Homepage). 15 banners (config/banners.ts; "Discover the History of Asanteman" is on /culture/history and "Discover the Districts of Asanteman" on /districts; the Manhyia Palace banner is on /manhyia), no photographs: a real green and gold kente cloth texture (`public/brand/kente-texture.jpg`, cut from `public/Asante/green kente.jpg`, mirrored; 3 variants shift which part shows), heritage gold, real HTML text, and the owner's Sika Dwa artwork (`public/Asante/sika dwa.jpeg`, white background removed into `public/brand/sika-dwa-emblem.png`) at the far right in its own grid column. Every page's top is the same banner (`components/banners/BannerShell.tsx`, also used by the plain title block): same height and same type as About (45.6 px serif on desktop and tablet, 28.5 px on phones; 5% smaller than first set), fixed height, no buttons; only the weave (3), the words and the entrance differ. Every banner opens its page right under the menu (`components/banners/PageTop.tsx`): its headline is the h1 and the breadcrumb sits inside it; if the banner is switched off the plain title block is shown instead. Each banner appears on exactly one page (`bannerPlacement`; heritage is on /culture), never links to its own page, and is editable in Admin, Banners. The expo banner is off by default.
- Page title band (`PageHeader`): plain kente strip, title and rule; no photo, no emblem.
- Page photographs sit at the top-right of the content area (first on phones): `DetailTop` on 10 detail templates and articles, and the CMS page layout. One 4:3 rounded frame everywhere; no frame when there is no photo.
- The emblem artwork's accuracy and the right to use it must be confirmed with the custodians (Manhyia Palace). The tagline stays "Discover Asanteman".
- Main menu shortened (Stay & Dine, About groups). Lint ignores the generated MapLibre worker.

## Decisions
- Cookie consent is stored in a first-party cookie (`vasa_consent`), not localStorage. Optional categories: Functional, Analytics, Advertising. The site currently uses no functional or advertising cookies; sponsored placements are first-party and cookie-free. GA loads only after Analytics consent (needs `NEXT_PUBLIC_GA_ID` at build time).
- The cookie policy page is an empty CMS draft: wording must be written and reviewed by someone qualified (Ghana Data Protection Act, 2012, Act 843).
- Quick-link and theme descriptions are blank: administrators write them.

## Blockers and open items (need the owner)
- Real content and photographs; verified district list; cultural and legal review; domain and accounts (see `LAUNCH_READINESS.md`).
- Written confirmation before Part B starts.

## Next
Part B only on confirmation; otherwise deployment preparation once accounts exist.

- **Manhyia Palace page** (`/manhyia`, `app/manhyia/page.tsx`): banner, an introduction, the museum, the king in session, royal mausoleums, "Before you visit" (opening times, fees and rules are deliberately not given until verified), the photograph slideshow (`config/manhyia.ts`, shared with the homepage) and links onward. Wording comes only from sources already recorded in the site (GTA listing, touringghana.com notes, the owner's welcome address). Listed in the Culture & Heritage menu and the sitemap. An administrator can replace the introduction by writing a body for the `manhyia` page in Admin, Pages.

- **History and districts:** `/culture/history` now carries a long article, "The rise of the Asante Empire, 1680 to 1750" (`components/culture/AsanteRise.tsx`), written in our own words from Nick Richwagen's Seventh Coalition article (10 Sept 2017), labelled as a secondary source awaiting custodian review. The Districts banner now reads "Discover the History of Asanteman" and its button goes to the History page. `/districts` shows the 43 assemblies (`config/districts.ts`, unverified, labelled) under "Districts are being added" until districts are activated in Admin; the menu item is now "Districts".
- **Homepage sections moved to Attractions:** "Explore the region", "Explore by type", the featured attractions row, "Discover our communities", "Education and learning", "Sports and recreation" and "Getting around" no longer appear on the homepage. Except for the featured row, they now follow the attractions list on `/attractions` (`components/attractions/AttractionsShowcase.tsx`), shown only on the first, unfiltered page. The `Block` section helper now lives in `components/layout/blocks.tsx`.
- **Legal pages:** Cookie policy, Privacy policy and Terms and conditions are written in `config/legal.ts` (plain language, based only on what the code does today; marked as a draft awaiting legal review; no company details or retention periods invented). Our mission has a matching built-in text. All show when the page has no body in Admin, Pages, and are replaced by one.
