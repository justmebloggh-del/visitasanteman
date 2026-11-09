# Development roadmap and status

Legend: ✅ built and checked · 🟡 built, needs live-environment testing · ⬜ not started

## VisitAsanteman rebrand, Phase 1: regional foundation (this branch: `rebrand/visitasanteman`)
| Item | Status | Notes |
|---|---|---|
| Git baseline, branch | ✅ | Baseline commit "Visit Lake Bosomtwe before VisitAsanteman rebrand" |
| Geography schema: regions, administrative areas, traditional areas, localities, destinations | ✅ | Migration `20261113000002`; links added to communities, attractions, listings, events, experiences |
| Publish guard (no publishing without an active district) | ✅ | DB trigger; friendly message in admin |
| Roles `regional_editor`, `media_manager`; status `approved`; approve/publish restricted | ✅ | RLS + triggers; matrix in AUTHENTICATION |
| Revision history (`content_revisions`) | ✅ | Read-only list on edit pages; restore from admin not built |
| Admin for geography, district/destination pickers, verification fields | ✅ | Config-driven |
| Rebrand: name, wordmark, nav (11 items + Plan Your Visit), homepage sections A to M, stored copy migration, PWA names/icons | ✅ | Text wordmark; no official logo yet |
| New routes: districts, destinations, culture hub (+5 sub-pages), advertise, partner-with-us, about/our-mission, about/partners | ✅ | Culture pages are CMS-managed and show "being prepared" |
| District filter on directories; sitemap; redirect map | ✅ | Redirect list holds only menu aliases (no old public URLs exist) |
| Districts (MMDAs) loaded; Lake Bosomtwe backfill and draft `lake-bosomtwe` destination | 🟡 | Migration `20261113000004`. **43 entries (1 metropolitan, 17 municipal, 25 district) from a secondary source** (citypopulation.de, crediting Ghana Statistical Service, retrieved 2026-11-09) because the Local Government Service site was unreachable. **All loaded inactive and flagged unverified**: nothing is public or publishable into them until a regional editor checks each against the official list and activates it. The ten Lake Bosomtwe communities and the draft destination point at `Bosomtwe` |
| Culture module content tables, travel-guide and gallery detail pages, new experience categories | ⬜ | Phase 2 of the brief |
| Scheduled status, per-district editor scoping, revision restore | ⬜ | Not built |

## VisitAsanteman Phase 3: culture, heritage and events (this branch)
| Item | Status | Notes |
|---|---|---|
| Ceremonies and festivals: data model, admin, directory, detail pages | ✅ | Attendance classification; authority-approval publish gate; 74 SQL checks |
| Cultural calendar (month view, type and district filters) | ✅ | Confirmed dates only |
| Share and save | ✅ | WhatsApp/Facebook links; `.ics` download for confirmed dates. Accounts and a saved-places list are not built |
| Homepage block for upcoming confirmed ceremonies | ✅ | Hides when none |
| Ceremony records: Akwasidae, Adae Kese, Papa Nantwi (Papa) Festival, Mmoaninko Festival | 🟡 | Migration `20261115000002`: **unpublished research drafts** from web research (Manhyia Palace, Graphic Online, GNA, Ghana Remembers and others), awaiting verification, no confirmed dates, authority approval not given. Sources disagree on cycle length and festival frequency; these are noted. Dates, meaning and visitor rules must be confirmed with Manhyia Palace, the Kumawu Traditional Council and the Offinso Traditional Council before publishing |
| Culture sub-pages (history, traditions, crafts, food), cultural storytelling | 🟡 | CMS pages exist and say "being prepared"; need verified text |
| Related transport and accommodation on ceremony pages | 🟡 | Links to district accommodation only; transport directory is Phase 5 |
| Event management for general events | ✅ | Existing events module, unchanged |

## VisitAsanteman Phase 2: regional research and destination database (this branch)
| Item | Status | Notes |
|---|---|---|
| Verification status, access status, source tracking on attractions; publish gate | ✅ | 63 SQL checks |
| Public access notice and source attribution on attraction pages | ✅ | |
| Researched inventory loaded (52 records, unpublished) | 🟡 | From the owner's summary; **not checked against the ARCC profile** (site unreachable). Needs research, location, access and photo verification per record |
| CSV import with preview, duplicate detection, templates (attractions, communities) | ✅ | Heading-matched columns; no manual column-mapping screen; images are not imported |
| Research queue (filter by verification status) | ✅ | |
| Alternative spellings stored | 🟡 | Not yet used by public search |
| Community records for the whole region; verified district list | ⬜ | Needs the official MMDA list and local sources |
| Source records for other bodies (GTA, Forestry Commission, GMMB, etc.) | ⬜ | Needs research access; none fetched |
| Hospitality, education, sports, transport, ceremonies modules (brief Phases 3 to 5) | ⬜ | Next |

## Phase 1: Website + CMS
| Item | Status | Notes |
|---|---|---|
| Design system (brand tokens, UI kit) | ✅ | `app/globals.css`, `components/ui` |
| Database, RLS, storage, seed | ✅ | 24 RLS checks pass on a real Postgres |
| Homepage (CMS-driven sections, 5 CTAs, map, contact form) | 🟡 | Sections hide when empty; hero image from CMS |
| Attractions, communities, accommodation, restaurants, businesses, experiences, events (list + calendar), articles | 🟡 | Index + detail, filters, pagination, JSON-LD |
| Explore, About, Travel Guide, Privacy, Terms | 🟡 | Text is CMS-managed; shows "being prepared" until written |
| Interactive map | 🟡 | MapLibre + OSM, category filters, search, directions |
| Contact + enquiries, newsletter | 🟡 | Validated, honeypot, rate limit |
| Auth (register, login, reset, verify) | 🟡 | |
| Admin: dashboard, CRUD for all content, media library, enquiries, newsletter export, users/roles, homepage, settings, analytics | 🟡 | Config-driven |
| SEO: metadata, sitemap, robots, canonical, OG, JSON-LD, breadcrumbs | ✅ | |
| Unit tests | ✅ | 37 passing (parser, schemas, payments, planner, redirects) |
| End-to-end tests | ✅ | 137 passed, 53 skipped by design (desktop-only or mobile-only specs), 0 failed, on a freshly reset local Supabase + mock Paystack/AI. Needs `npx supabase db reset` before each full run (some tests use fixed references) |
| Database permission checks | ✅ | `supabase/tests/geography_rls.sql`: 54 checks |
| Content: real photos, verified facts, coordinates | ⬜ | **Blocking launch.** See content plan below |

## Phase 2: Business ecosystem 🟡 (built, tested locally)
| Item | Status | Notes |
|---|---|---|
| Business registration + email verification | ✅ | `/partner/register`; role granted by DB function `become_partner` only after verified email |
| Partner portal: dashboard, listings, enquiries, subscription, settings | ✅ | Owner-scoped RLS; 23 SQL permission checks + 6 e2e tests |
| Submit-for-review + admin approval | ✅ | Partners can never publish, verify, feature or change plan (RLS + trigger) |
| Accommodation/restaurant/tour/boat/guide management | ✅ | Account type limits listing types; rooms and menu items |
| Subscription plans (admin-editable) | ✅ | Prices blank by default; no online payment |
| Premium listings | 🟡 | Featured flag + plan, set by admins. Auto-placement from plan not built |
| Listing analytics | ✅ | Page views; daily breakdown on plans with analytics |
| Partner email notifications | ⬜ | Partners see enquiries in the portal only |
| Reviews, bookings pages in portal | ⬜ | Phase 3 |

## Phase 3: Bookings and payments 🟡 (built, tested against a mock gateway)
| Item | Status | Notes |
|---|---|---|
| Booking requests (stay, table, experience) with unique reference | ✅ | Validated in the database; never auto-confirmed |
| Provider/admin booking management + history | ✅ | State machine in `set_booking_status` |
| Guest lookup (reference + email), account bookings, cancellation | ✅ | |
| Availability (blocked dates + units) | ✅ | |
| Paystack payment + webhook, server-side verification | 🟡 | Tested with a mock gateway (success, tampered amount, failure, bad signature, replay). **Not yet tested with real Paystack keys** |
| Email notifications | 🟡 | Sent via Resend when configured; untested with a live provider |
| Reviews + ratings (booking-verified, moderated) + owner reply | ✅ | `AggregateRating` JSON-LD only when real reviews exist |
| Commission recording | ✅ | Recorded per paid booking; payouts are manual |
| Refunds | 🟡 | Recorded by admin after refunding in the Paystack dashboard. No gateway refund API call |
| Hubtel | ⬜ | Needs merchant credentials; see PAYMENTS.md |
| SMS notifications | ⬜ | |

## Phase 4: Smart tourism 🟡 (partly built, tested locally)
| Item | Status | Notes |
|---|---|---|
| Travel planner (accounts, days, add/reorder/move, notes, custom items) | ✅ | `/travel-planner`; owner-only via RLS; 20 plans/user, 100 items/plan |
| Plan on a map, share link (read-only, revocable), print/PDF view | ✅ | Unpublished places never leak through a shared plan |
| Interest-based recommendations | ✅ | Transparent rules (interest → categories) over published data |
| Nearby places (distance) | ✅ | `nearby_places()` on attraction pages; only verified coordinates |
| AI itinerary assistant | 🟡 | Grounded in a catalogue of published items; every returned id is validated and unknown ones dropped. Tested against a **mock** model; **not tested with a real API key**. Off until `AI_ASSISTANT_ENABLED=true` + `ANTHROPIC_API_KEY` |
| Progressive Web App | 🟡 | Manifest, icons, service worker (public pages only; offline page). Install prompt and offline behaviour need checking on real devices |
| Visitor analytics | 🟡 | Google Analytics when configured; per-listing views for partners |
| Multilingual support | ⬜ | **Needs your decision**: which languages (e.g. Twi, French?), who translates content, and whether to translate only the interface or database content too |
| Personalised recommendations from behaviour | ⬜ | Needs real traffic first; current ones are interest-based |
| Advanced map clustering/routing | ⬜ | |

## Phase 5: Expansion 🟡 (investment and advertising built; rest not actionable yet)
| Item | Status | Notes |
|---|---|---|
| Investment portal | ✅ | `/investment`. Each project has a stage: existing, approved, proposed, under consideration. Approved/existing **require a named source** (DB rule). Concepts carry a visible "not approved or funded" notice. Estimates need a stated basis |
| Investor enquiries | ✅ | Linked to the project; organisation captured; filter by type in admin |
| Advertising / sponsorship | ✅ | Admin-managed placements (homepage banner, top of directories) with start/end dates; always labelled "Sponsored"; impressions and clicks counted. Sold manually: no online ad purchase |
| Downloadable investment briefs | ⬜ | Storage currently accepts images only; add PDF support if wanted |
| Separate campaign objects | ⬜ | One ad row = one campaign for now |
| Advanced marketplace, more partners, wider coverage | ⬜ | Business/content work, not code |
| Mobile app | ⬜ | The PWA covers installation; native app only if commercially justified |
| Additional payment methods, USD for visitors | ⬜ | Needs merchant setup; currencies are never hardcoded |

## History note
The architecture review advised launching Phase 1 first. All phases are now built locally, but the real launch blockers are unchanged: real content, accounts/deployment, live Paystack/AI testing, and legal review.

## Content plan
See [CONTENT_PLAN.md](CONTENT_PLAN.md). Summary:
For each attraction/community: GPS point taken on site, opening hours, fees, contact, photos with permission and credit, history checked with the Bosomtwe District Assembly and traditional authorities. The lake carries customary rules and sacred significance, so cultural content must be verified locally before publishing.

## Open decisions / information needed from you
1. Domain: confirm visitlakebosomtwe.com (or alternative) is registered.
2. Supabase and Vercel accounts to deploy under; Resend and (later) Paystack merchant accounts.
3. Contact email/phone/WhatsApp for the footer.
4. Source of photography and licence terms.
5. Who the first super administrator is.
