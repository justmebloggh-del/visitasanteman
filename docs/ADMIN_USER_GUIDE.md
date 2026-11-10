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

## Navigation, quick links, themes and the homepage
- **Menu:** grouped by what visitors want to do (Explore Ashanti, Culture & Heritage, Experiences, Where to Stay, Food & Dining, Events, Plan Your Visit, Media, Business Directory, About Us, Contact). The links are set in `config/site.ts`. Pages for Why Ashanti, Getting Around, Travel Information and Visa and Entry are managed under **Pages**; until you publish them they show “being prepared”. For practical pages fill **Last verified on** and **Source**: they are shown publicly. Do not publish visa, health, safety or transport facts that have not been checked against an official source.
- **Homepage quick links** (Admin → Homepage quick links): up to six. Give a link a *page name* to hide it until that page is published.
- **Themes** (Admin → Themes): Eat, Wear, See, Feel and the four tour categories exist without descriptions. Write the description yourself once wording is verified. Tick themes on any attraction, listing, experience, event or article form. A theme appears on the homepage, and its page exists, only when it has published content.
- **Explore by type** (Admin → Attraction categories): add a cover photo, tick *Show on the homepage* and set the order. Categories with no published attractions never appear.
- **Browse by district** appears automatically for districts with published places.
- **Events:** tick *Date verified* only when the organisers have confirmed the date for this occurrence; otherwise visitors see “Date to be confirmed”.
- **WhatsApp:** enter the number under Settings to show the floating “Chat on WhatsApp” button (a plain link, no tracking); leave it blank to hide it. **Campaign hashtag** in Settings sets the footer ticker text (empty hides it).
- **Cookies:** the banner offers Accept all, Reject all and Customise with equal prominence. Optional cookies (Functional, Analytics, Advertising) are off until the visitor agrees; Google Analytics loads only after Analytics consent. The **Cookie policy** page is an empty draft: have the wording written and reviewed by someone qualified before publishing (Ghana Data Protection Act, 2012, Act 843).

## Advertising and subscriptions
- **Advertisers** (Admin → Advertisers): record who is paying and the terms (internal notes, never public). When creating an advertisement, pick the advertiser record and enter the name shown publicly.
- **Placements:** homepage banner, top of directory pages, top of search results, culture and heritage pages, top of district pages. An ad shows only while published and inside its dates, always labelled **Sponsored**. Paid promotion never affects verification or editorial content.
- **Ad performance** (Admin → Ad performance): views, clicks, click rate and the last 14 days per ad.
- **Subscriptions** (Admin → Subscriptions): assign a plan to a business listing, optionally with an end date; every change is kept as history. A plan lapses when an administrator runs **End overdue plans** (automatic expiry needs a scheduler, which is not set up). Plans are arranged with the business; there is no online purchase.
- **Notifications:** when a visitor sends an enquiry about a listing or experience, an email goes to the contact address on that listing if there is one (needs `RESEND_API_KEY` and `EMAIL_FROM`). The enquiry always appears in the partner portal. Partners see page views, enquiries and booking requests per listing for the last 30 days on their dashboard.

## Search, map, experiences and curated itineraries
- **Search** (`/search`, and suggestions in the search box) covers every published section. A record appears only after it is published; alternative spellings you enter on attractions, communities and districts are searched too.
- **Map** (`/map`): categories now include education, sports and transport; there is a list view. Only places with coordinates appear. On any edit form with latitude and longitude, **click the map or drag the pin** to fill them in, but only place a pin where you have confirmed the location on site or from an official source.
- **Experiences** have new categories, *Price on request* and *Minimum age*.
- **Curated itineraries:** build a plan in the Travel planner using published places, open it and use **Publish as a curated itinerary (staff)**. It is created as a draft (or attach it to one of the empty drafts). A regional editor or administrator publishes it from Admin → Curated itineraries. Before publishing, check that routes and times are realistic: the site does not calculate journey times. Visitors can copy a published itinerary into their own plans.

## Education, sports and transport
- **Education** (institutions), **Sports venues**, **Sports clubs**, **Transport**: each record needs a source and verification before it can be published, like attractions.
- Education: record recognition only with who confirmed it (a regulator register and the date). A campus is not a tourist attraction unless the institution says visitors are welcome; set *Visitor access* accordingly.
- Sports: do not enter fixtures or results. Club league or division changes by season, so record the official source. Capacity only when verified.
- Transport: set *Operating status* honestly (a proposed or under-development facility must never look operational). Enter fares and times only from the operator, with the *Fare information last updated* date.
- Events have a **Category**; sports and education events appear at `/sports/events` and `/education/events`.

## Hospitality, markets and business verification
- Sections: Accommodation (hotels, boutique hotels, homestays and more), Food & dining (restaurants, cafés, bakeries, traditional food vendors, caterers), Event venues, Markets, Businesses. Each has public filters for district, type, price range, capacity and facility.
- Enter **price range**, **capacity**, **how to book** and **accessibility** only as the business has told you.
- **Business verification** (Admin → Business verification): businesses ask for verification from their portal. Check they are genuine (call, visit, documents), then **Verify**, **Reject** (a reason is required and shown to the owner) or **Suspend** (hides the listing). Paying for a plan never verifies a business.
- Market records loaded from research start as drafts. Fill them from confirmed information before publishing.

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

## Jobs moderation (Admin → Jobs moderation)
- **Vacancies in review:** read the vacancy, then *Publish (30 days)*, *Send back to draft* or *Reject and close*. A district must be set before publishing. Regional editors and administrators can publish; editors can only view.
- **Employers:** administrators verify, suspend or reset employers. Suspending hides all of the employer's vacancies at once. Verify only after you have checked the organisation yourself. Payment never verifies an employer.
- **Reports:** job seekers report vacancies that ask for money, look fake, discriminate or mislead. Administrators mark them actioned or dismissed.
- Applications and CVs are private and never appear in the admin. Job seekers are never charged to apply.
