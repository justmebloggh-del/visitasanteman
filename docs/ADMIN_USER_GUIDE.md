# Admin user guide

Sign in, then open **Admin** in the top bar (or `/admin`). Content editors, regional editors, administrators and super administrators can enter; media managers see only the Media library.

## Publishing content
1. Pick a section (Attractions, Communities, Destinations, Accommodation, Restaurants, Experiences, Events, Businesses, Articles).
2. **New**, fill in the form, upload a main photograph (describe it in the alt-text box first).
3. Work in *Draft*, then **Send for review**. A regional editor or administrator **Approves** and **Publishes**. Pages update within about a minute.
4. Choose a **district** (or a community or destination, which supplies it). The database refuses to publish content without an active district.
5. Use **Unpublish** in the list to take something down. **Delete** (administrators) archives the item; it is not erased.

## Rules for trustworthy content
- Only enter facts, prices, hours and coordinates you have confirmed. Leave a field blank rather than guessing.
- Fill **Sources** for history/heritage; it is shown to visitors.
- The **Verified** badge (listings) and **Provider has confirmed** (experiences) are admin-only. Tick them only after checking with the business.
- Coordinates: take them on site or from an official source. Both latitude and longitude, or neither.

## Roles
| Role | Can |
|---|---|
| Content editor | Create and edit drafts, send for review, upload media, handle enquiries |
| Regional tourism editor | Content editor + approve, publish, verify content, manage regions and districts |
| Media manager | Media library only |
| Administrator | Regional editor + delete, listing badges, featured flags, plans, ads, settings |
| Super administrator | Administrator + change user roles |

The full matrix is in [AUTHENTICATION](AUTHENTICATION.md).

## Research records and import (Admin → Attractions, Import research)
- Each attraction has **Verification status** and **Visitor access**. A record cannot be published until a regional editor or administrator marks it *Verified through a credible secondary source* or *Officially confirmed* and a source is recorded. Use *Awaiting verification* while you work.
- Filter the Attractions list by **Verification** to see the research queue (the loaded inventory starts as *Research identified*).
- A protected forest, shrine, dam or river is not automatically a visitor attraction. Set *Visitor access* honestly and explain permits and rules in *Access, permits and visitor rules*. Anything other than "Open to visitors" shows a notice on the public page.
- **Import research** takes a CSV (download the template). Check the preview, then import. Imported rows are always unpublished drafts marked *Research identified*; status or verification columns in a file are ignored. Every row needs a source. Duplicates (same name or alternative spelling, or repeated in the file) are skipped; places within 200 m of an existing one are flagged. Columns are matched by heading, not mapped by hand. Templates exist for attractions and communities only.

## Ceremonies and festivals (Admin → Ceremonies & festivals)
- Traditional ceremonies are not automatically public events. Set **Public attendance** honestly (open, open with conditions, by invitation, restricted). Restricted and private rites can still have a minimal public entry, or none.
- **Publishing needs** the responsible traditional authority or organiser's approval of the public information (ticked by a regional editor or administrator), a verified record with a source, and a district. Content editors can draft but cannot tick the approval or publish.
- **Dates:** traditional dates are announced each year. Enter a start time and tick *Date confirmed* only when the organisers have confirmed it for this occurrence. Unconfirmed dates are never shown, never listed on the calendar and never exported. Use *How dates are announced* for who announces them, not a guessed pattern.
- Do not write significance, history or symbol meanings from memory. Use cited sources or custodians and record the reviewer in the verification notes.
- Public pages: `/culture/ceremonies`, `/culture/ceremonies/[slug]` (with an "Add to my calendar" file for confirmed dates) and `/culture/calendar`.

## Geography (Admin → Geography)
- **Regions** and **Districts** (metropolitan, municipal and district assemblies) are managed by regional editors and administrators. Record the **source** and the date it was checked for every district.
- **Traditional areas** and **Localities** are optional. Traditional-area text is culturally sensitive: publish only what the appropriate custodians have reviewed.
- **Destinations** (e.g. Lake Bosomtwe) belong to one district and appear at `/destinations`.
- Each edit page for content shows **Revision history**, the earlier versions of that item.
- **Verification**: *Content verified* and *Last verified on* can be set by regional editors and administrators. Anyone can write internal *Verification notes*.

## Other screens
- **Homepage**: headings, on/off for each section, hero photograph. Empty sections never show.
- **Media library**: upload, edit alt text/caption/credit, delete unused files. Put photos in folder `gallery` to show them on the public Gallery page.
- **Enquiries**: reply by email, mark read/replied/closed. These are requests, not confirmed bookings.
- **Newsletter**: view and export subscribers as CSV.
- **Pages**: write About, Our mission, Partners, Explore, Travel Guide, Culture & Heritage (and its five sub-pages), Privacy, Terms in Markdown (`## Heading`, `**bold**`, `- list`, `[text](https://…)`).
- **Settings**: contact details, social links, map start view.

## Business listing requests
Businesses ask to be listed through the contact form (type *List my business*). Review the request in Enquiries, contact them to verify details, create the listing as a draft, then publish. A self-service partner portal arrives in Phase 2.

## Visitor features worth knowing
- **Travel planner** (`/travel-planner`): signed-in visitors build day-by-day plans from published places, view them on a map, share a read-only link and print. Plans only contain places that are published, so keep content accurate.
- **Nearby**: attraction pages list close places automatically. They appear only for items with verified coordinates, so adding coordinates improves discovery.
- **AI suggestions** appear in the planner only when `AI_ASSISTANT_ENABLED` and an API key are set. They use only published items.

## Investment opportunities (Admin → Investments)
- Choose the **real stage**. *Approved* and *Existing* need a named source (who approved it, which reference); the system will not save them without one.
- Leave *Estimated investment* blank unless you can state where the figure comes from.
- Keep *Images are conceptual* ticked unless the photo shows the real, existing facility.
- Investor enquiries arrive in *Enquiries* (filter **Investor**), linked to the project.
- Have the wording on this section reviewed legally before launch: it must not read as an offer of securities or a promise of returns.

## Advertisements (Admin → Advertisements, administrators only)
- Create an ad, set **placement**, link, and start/end times (Ghana time), then set status to **Published**. It shows only inside its dates and is always labelled “Sponsored”.
- *Views* and *Clicks* update automatically. Ads are sold and invoiced manually; there is no online purchase flow.
