# Addendum to the VisitAsanteman Master Implementation Prompt

Paste this block **at the top** of the master prompt (or add it as the first message). Where it conflicts with the master prompt, this addendum wins. It exists because the repository is not empty: it already contains a working Next.js 16 and Supabase platform.

## A. Read before acting
1. `AGENTS.md` (Next.js 16 has breaking changes: read `node_modules/next/dist/docs/` before writing Next.js code).
2. `docs/VisitAsanteman-rebrand-assessment.md`, `docs/VisitAsanteman-brief-v1.md`, and every file in `supabase/migrations/`.

## B. Session scope
- **Work one phase per session.** Do Phase 1 only now. Finish it, report, and stop. Do not begin Phase 2 research or later directories in the same session.
- Keep `docs/PROGRESS.md` updated (completed, in progress, decisions, blockers, next tasks) so a fresh session can resume without this conversation.
- Before changing anything: `git init` if needed, add `.env*` (except `.env.example`) to `.gitignore`, make a baseline commit, and work on branch `rebrand/visitasanteman`. Run typecheck, lint, unit and e2e tests and record the true baseline. Never state that a test passed unless you ran it.
- Commit after each logical step. Do not push, and do not touch any hosted or production service, without asking.

## C. Existing schema takes precedence over the table list in section 22
The table list in section 22 describes **capabilities**, not mandatory table names. The repository already has `listings` (hotels, restaurants, operators, markets and similar, by `type`), a shared `media` and `media_links`, `room_types`, `menu_items`, bookings, reviews, itineraries, investment and advertising tables. Do **not** create parallel `businesses`, `accommodations`, `restaurants`, `*_images` tables that duplicate them. Extend the existing model, and add dedicated domain tables only where the data truly differs (for example institutions, sports venues, transport routes, ceremonies). Explain each new table briefly in `docs/DATABASE_SCHEMA.md`. All changes go in new migrations dated after `20261112000001`; never edit an applied migration.

## D. Three separate status fields (replaces the single long status list)
Do not stretch one enum to cover everything. Use:
1. **Publication workflow:** draft, in review, approved, scheduled, published, archived.
2. **Verification status:** researching, awaiting verification, verified (officially confirmed), verified (credible secondary source), rejected, temporarily unavailable.
3. **Access classification** (where relevant): public, by permission, restricted, private.
Plus `source_url`, `source_organisation`, `researched_at`, `last_verified_at`, `reviewer_id`, `notes`. The database must prevent publishing a record that is awaiting verification or restricted-without-consent.

## E. Research rules (stricter than section 6)
- The attraction and institution names in the master prompt are **leads to investigate, not confirmed facts.** Some may be misnamed, closed, private, or sit in a different district. Verify each one before creating a published record.
- Do not copy text, photographs or data from websites, directories or Google Maps. Write original descriptions. Use only images the project owns, has written permission for, or that carry a licence allowing reuse, and record the licence and credit.
- Coordinates must come from on-site GPS supplied by the owner, official sources, or OpenStreetMap (with the required attribution). Do not extract coordinates from Google Maps or other terms-restricted services.
- Research output goes into the **import pipeline as drafts "Awaiting verification"** (CSV or admin import), never straight to published pages.
- Contact details of private individuals (guides, drivers, artisans) are published only with recorded consent. Respect the Data Protection Act, 2012 (Act 843). Add a consent field.
- Sacred, restricted or custodian-controlled content needs a recorded custodian or traditional-authority approval before publication. If approval is not recorded, the record stays unpublished.
- Never fix a traditional festival or ceremony to a Gregorian date. Dates must be entered per occurrence and verified by an administrator.
- Sports fixtures and results: do not build or populate until a licensed or official data source is confirmed. Directory data (venues, clubs) comes first.
- Education: list institutions only after checking recognition with the relevant regulator; keep education discovery separate from tourist attractions.
- Transport: no fares, durations or timetables unless confirmed; clearly mark developing facilities (for example Boankra) as not operational unless officially confirmed.

## F. Technology decisions
- Keep MapLibre with OpenStreetMap (already built) behind the existing map abstraction. Google Maps or Mapbox remain optional later swaps.
- Keep the existing UI components. Do not retrofit shadcn/ui across the app; introduce it only for new components where it saves real effort, and say so.
- Use PostgreSQL full-text search for the global search; add `pg_trgm` for spelling tolerance only if needed.
- Adding any new dependency requires a one-line justification in the commit message.

## G. Checkpoints (stop and report)
- After the baseline (test results).
- After the geography migration and the official MMDA list import (state the source and record count).
- At the end of Phase 1 (full phase report in the format of master prompt section 30 plus exact commands run and results).

## H. Unconfirmed items (do not guess; ask the owner)
The VisitAsanteman domain, whether the old site is already live, whether any hosted database holds real data, the logo (use a text wordmark placeholder behind one replaceable component), the source and licence of photography, and who the first super administrator is.
