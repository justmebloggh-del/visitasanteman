# Part B design notes (not started)

Part B items from `CLAUDE-CODE-PROMPT-visitghana-inspired-features.md`. **Nothing here is built.** Building starts only after Part A is merged and the owner confirms in writing. These are original designs for VisitAsanteman; no text, images or code from other sites.

## B1. "Welcome to Ashanti" visitor guide (printable and downloadable)
- **Source of truth:** CMS `pages` (Why Ashanti, Getting Around, Travel Information, Visa and Entry) plus selected published destinations and districts. The guide is *assembled*, not written separately.
- **Format:** a print-optimised HTML route (`/guide`) using print CSS first (zero dependencies, works as "Save as PDF"). A server-generated PDF only if needed later (adds a dependency: justify it).
- **Verification gate:** emergency numbers and practical advice are included only from pages that carry `last_verified_at` and a source. A section whose page is unpublished or unverified is omitted, and the guide states the verification date of each section.
- **Data:** a `guide_sections` table (page slug, order, enabled) so editors choose what goes in. No new content tables.
- **Tests:** guide omits unverified sections; prints without site chrome; includes verification dates.

## B2. GTA-licensed operator signal
- **Columns** on `listings` (operator types only): `gta_licence_number text`, `gta_licence_verified_at timestamptz`, `gta_licence_verified_by uuid`.
- **Permissions:** extend `guard_listing_privileged_fields` so only administrators change them (partners can submit a number as a plain enquiry field, never write these columns).
- **Public badge:** "Licensed by the Ghana Tourism Authority" only when `gta_licence_verified_at` is set. Wording and any register link supplied by the owner after checking the GTA's own register; licence number display is optional and requires the operator's consent.
- **Tests:** SQL checks that partners and editors cannot set the fields; badge hidden when unverified.

## B3. Downloads library
- **Schema:** `documents` (title, category, description, file path, mime type, size, published_at, status, uploaded_by, checksum). RLS like other content; public reads published rows.
- **Storage:** a second private-by-default bucket `documents` accepting PDF only (and size cap, e.g. 10 MB), separate from the image bucket so image rules stay strict. Staff-only upload through the existing upload pattern, validating type by content (magic bytes) as well as extension. Public access via signed or public URL depending on whether any document is restricted.
- **Public:** `/downloads` listing by category with file size and date; each link is a real download. Documents carry source and a reviewed date.
- **Risks to settle first:** virus scanning (none available locally), retention, who may publish, accessibility of PDFs (encourage tagged PDFs).

## B4. Craft-village experiences
- **Model:** extend `experiences` with `buy_direct boolean`, `workshop boolean`, `craft_kind` (kente, adinkra, wood_carving, metal_craft, other), and a `contact_consent_at` timestamp on provider contact fields. Craft communities already exist as attraction drafts; link workshops to community and provider listing.
- **Consent rule (Act 843):** private artisans' phone numbers and emails publish only with recorded consent; otherwise visitors use the enquiry form.
- **Cultural care:** no symbol meanings or histories written by the team; Adinkra text needs custodian review.
- **Tests:** contact hidden without consent; workshop filter.

## B5. Live-stream and video embeds on event pages
- **Allowlist:** YouTube (`youtube-nocookie.com`) and Facebook video embeds only; the URL is parsed server-side into an embed id, never injected as raw HTML.
- **Consent:** embeds load only after Functional (or Advertising for Facebook) consent from the A8 banner; until then a placeholder with a "Watch on YouTube" link.
- **CSP:** add the embed hosts to `frame-src` only for those hosts.
- **Tests:** no third-party request before consent; invalid URLs rejected.

## B6. "Suggest a place" form
- **Public form** with honeypot, rate limit and validation; submissions go to a `place_suggestions` table (name, type, district guess, description, submitter email optional, consent to be contacted, source), status `awaiting_verification`, never public.
- **Admin review queue:** staff can reject, merge into an existing record, or convert to a draft attraction/listing (research-identified, source = "visitor suggestion"). Nothing publishes automatically.
- **Privacy:** minimal data, retention period, link to the privacy policy; spam controls (rate limit now, CAPTCHA only if abuse appears).
- **Tests:** honeypot, rate limit, RLS (anon insert only, staff read), conversion creates unpublished drafts.
