import { facilityStatusLabels, institutionKinds, transportKinds } from "@/config/domains";
import { marketTypes, venueTypes, priceRangeLabels, ceremonyKindLabels, attendanceLabels, stageLabels, accommodationTypes, businessTypes, experienceCategoryLabels, eventStatusLabels, listingTypeLabels, restaurantTypes, type ListingType } from "@/config/site";

export type FieldType =
  | "text" | "textarea" | "markdown" | "number" | "select" | "checkbox" | "datetime" | "tags" | "url" | "email"
  | "relation" | "lat" | "lng" | "date";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  relation?: { table: string; label: string };     // options loaded from this table
  adminOnly?: boolean;                              // only admins may change (editors see it read-only)
  approverOnly?: boolean;                           // regional editors and admins only (verification, publishing)
  group?: "main" | "details" | "location" | "contact";
  max?: number;
}

export interface ResourceDef {
  key: string;
  table: string;
  label: string;          // plural
  singular: string;
  titleField: string;     // used for slug + list title
  hasSlug: boolean;
  slugField?: string;     // primary key column other than slug (pages use slug as pk)
  fields: FieldDef[];
  listColumns: { name: string; label: string }[];
  typeFilter?: { column: string; values: string[] };
  hasStatus: boolean;
  hasCover: boolean;
  galleryEntity?: string;
  children?: "rooms" | "menu";
  seo: boolean;
  softDelete: boolean;
  orderBy: { column: string; ascending: boolean };
  publicPath?: (row: Record<string, unknown>) => string;
  approverOnly?: boolean;                           // whole section: only regional editors and admins may change it
  revisions?: boolean;                              // show revision history on the edit page
  area?: boolean;                                   // has administrative_area_id (checked before publishing)
  filter?: { column: string; label: string; options: { value: string; label: string }[] };   // extra list filter
  noCreatedBy?: boolean;
  themeEntity?: "attraction" | "listing" | "experience" | "event" | "article";   // themes can be attached (theme_links)
  verifiable?: boolean;                             // has verification_status and reviewed_by                            // table has no created_by column
}

const statusOptions = [
  { value: "draft", label: "Draft" }, { value: "pending_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" }, { value: "archived", label: "Archived" },
];
export const statusOptionList = statusOptions;
export const statusField: FieldDef = { name: "status", label: "Status", type: "select", required: true, options: statusOptions, group: "main", hint: "Workflow: Draft, In review, Approved, Published. Only regional editors and administrators can approve or publish. Only Published items are visible on the website." };

export const verificationOptions = [
  { value: "research_identified", label: "Research identified (nothing checked)" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "verified_secondary", label: "Verified through a credible secondary source" },
  { value: "officially_confirmed", label: "Officially confirmed" },
];
export const accessOptions = [
  { value: "unknown", label: "Not yet established" },
  { value: "open_to_visitors", label: "Open to visitors" },
  { value: "permission_required", label: "Permission or permit required" },
  { value: "restricted_access", label: "Restricted access (sacred, private or protected)" },
  { value: "temporarily_unavailable", label: "Temporarily unavailable" },
  { value: "permanently_closed", label: "Permanently closed" },
  { value: "proposed", label: "Proposed or under development" },
];
const researchFields: FieldDef[] = [
  { name: "verification_status", label: "Verification status", type: "select", required: true, options: verificationOptions, group: "details", hint: "A record cannot be published until it is verified. Only regional editors and administrators can set the two verified levels." },
  { name: "access_status", label: "Visitor access", type: "select", required: true, options: accessOptions, group: "details", hint: "A site can be real and still closed, restricted or only proposed. Never imply access that is not confirmed." },
  { name: "access_notes", label: "Access, permits and visitor rules (public)", type: "textarea", group: "details", hint: "Permits, permissions, safety, etiquette, photography rules." },
  { name: "managing_institution", label: "Managing institution", type: "text", group: "details", hint: "e.g. the body responsible for the site. Leave blank if unknown." },
  { name: "alt_names", label: "Alternative names and spellings", type: "tags", group: "details", hint: "Comma separated. Recorded for editors; public search does not match these yet." },
  { name: "source_organisation", label: "Source organisation", type: "text", group: "details" },
  { name: "source_url", label: "Source link", type: "url", group: "details" },
  { name: "source_published_at", label: "Source publication date", type: "date", group: "details" },
  { name: "researched_at", label: "Date researched", type: "date", group: "details" },
  { name: "research_notes", label: "Research notes (internal)", type: "textarea", group: "details", hint: "Uncertainty and what still needs checking. Not shown publicly." },
];

const area: FieldDef = { name: "administrative_area_id", label: "District / municipality / metropolis", type: "relation", relation: { table: "administrative_areas", label: "name" }, group: "main", hint: "Required before publishing. If left blank it is taken from the community or destination." };
const destination: FieldDef = { name: "destination_id", label: "Destination", type: "relation", relation: { table: "destinations", label: "name" }, group: "details" };
const verifiedAt: FieldDef = { name: "last_verified_at", label: "Last verified on", type: "datetime", approverOnly: true, group: "details", hint: "When a person last checked these facts." };
const verifyNotes: FieldDef = { name: "verification_notes", label: "Verification notes (internal)", type: "textarea", group: "details", hint: "What was checked, by whom, and what still needs checking. Not shown publicly." };

const typeOptions = (types: ListingType[]) => types.map((t) => ({ value: t, label: listingTypeLabels[t] }));

const community: FieldDef = { name: "community_id", label: "Community", type: "relation", relation: { table: "communities", label: "name" }, group: "details" };
const lat: FieldDef = { name: "latitude", label: "Latitude", type: "lat", group: "location", hint: "Decimal degrees measured on site or from an official source. Leave blank if unknown. Never estimate." };
const lng: FieldDef = { name: "longitude", label: "Longitude", type: "lng", group: "location", hint: "Negative values are west of Greenwich (the Ashanti Region is west of the meridian)." };

export const listingFields = (types: ListingType[], food: boolean, stay: boolean): FieldDef[] => [
  { name: "name", label: "Name", type: "text", required: true, group: "main" },
  { name: "type", label: "Type", type: "select", required: true, options: typeOptions(types), group: "main" },
  statusField,
  { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
  { name: "description", label: "Description", type: "textarea", group: "main" },
  community, area, destination, verifiedAt, verifyNotes,
  { name: "address", label: "Address / landmark", type: "text", group: "location" },
  { name: "directions", label: "Directions", type: "textarea", group: "location" },
  lat, lng,
  { name: "phone", label: "Phone", type: "text", group: "contact" },
  { name: "whatsapp", label: "WhatsApp number", type: "text", group: "contact", hint: "International format, digits only, e.g. 233XXXXXXXXX." },
  { name: "email", label: "Email", type: "email", group: "contact" },
  { name: "website", label: "Website", type: "url", group: "contact" },
  { name: "opening_hours", label: "Opening hours", type: "textarea", group: "details" },
  { name: "price_from", label: stay ? "Price from (per night)" : "Price from", type: "number", group: "details", hint: "Only enter a price the provider has confirmed." },
  { name: "price_note", label: "Price note", type: "text", group: "details" },
  { name: "amenities", label: "Facilities", type: "tags", group: "details", hint: "Comma separated, e.g. Wi-Fi, Parking." },
  ...(food ? [{ name: "cuisines", label: "Cuisines / food types", type: "tags", group: "details", hint: "Comma separated." } as FieldDef] : []),
  { name: "price_range", label: "Price range", type: "select", group: "details", options: Object.entries(priceRangeLabels).map(([value, label]) => ({ value, label })), hint: "Only if the business has told you how to describe its prices." },
  { name: "capacity", label: "Capacity (guests, seats or visitors)", type: "number", group: "details", hint: "As stated by the business." },
  { name: "booking_method", label: "How to book or enquire", type: "text", group: "details" },
  { name: "accessibility", label: "Accessibility", type: "textarea", group: "details" },
  { name: "source_organisation", label: "Source organisation (researched records)", type: "text", group: "details", hint: "For records researched by the team rather than submitted by the business." },
  { name: "source_url", label: "Source link", type: "url", group: "details" },
  { name: "source_published_at", label: "Source publication date", type: "date", group: "details" },
  { name: "researched_at", label: "Date researched", type: "date", group: "details" },
  { name: "research_notes", label: "Research notes (internal)", type: "textarea", group: "details" },
  { name: "is_featured", label: "Featured on homepage", type: "checkbox", adminOnly: true, group: "main" },
  { name: "is_verified", label: "Verified badge", type: "checkbox", adminOnly: true, group: "main", hint: "Tick only after the business has been checked. Paying for a plan never verifies a business." },
  { name: "verification_decision", label: "Verification decision", type: "select", required: true, adminOnly: true, group: "main", options: [{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }] },
  { name: "verification_reason", label: "Reason shown to the owner (rejected or suspended)", type: "textarea", adminOnly: true, group: "main" },
  { name: "plan_id", label: "Subscription plan", type: "relation", relation: { table: "subscription_plans", label: "name" }, adminOnly: true, group: "main", hint: "Set by administrators. Paid plans are arranged with the owner; there is no online payment yet." },
];

export const resources: ResourceDef[] = [
  {
    filter: { column: "verification_status", label: "Verification", options: verificationOptions }, area: true, revisions: true, themeEntity: "attraction", key: "attractions", table: "attractions", label: "Attractions", singular: "attraction", titleField: "name", hasSlug: true,
    hasStatus: true, hasCover: true, galleryEntity: "attraction", seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/attractions/${r.slug}`,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      statusField,
      { name: "category_id", label: "Category", type: "relation", relation: { table: "attraction_categories", label: "name" }, group: "main" },
      community, area, destination,
      { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
      { name: "description", label: "Description", type: "textarea", group: "main" },
      { name: "history", label: "History (verified only)", type: "textarea", group: "details", hint: "Leave blank unless verified. Cite the source below." },
      { name: "activities", label: "Available activities", type: "tags", group: "details" },
      { name: "opening_hours", label: "Opening hours", type: "textarea", group: "details" },
      { name: "entrance_fee", label: "Entrance fees", type: "textarea", group: "details", hint: "Only enter fees you have confirmed." },
      { name: "visitor_guidelines", label: "Visitor guidelines", type: "textarea", group: "details" },
      { name: "accessibility", label: "Accessibility information", type: "textarea", group: "details" },
      { name: "directions", label: "Directions", type: "textarea", group: "location" },
      lat, lng,
      { name: "contact_phone", label: "Contact phone", type: "text", group: "contact" },
      { name: "contact_email", label: "Contact email", type: "email", group: "contact" },
      { name: "video_url", label: "Video link", type: "url", group: "details" },
      { name: "sources", label: "Sources", type: "textarea", group: "details", hint: "Shown publicly. Who or what confirmed these facts?" },
      { name: "content_verified", label: "Content verified", type: "checkbox", approverOnly: true, group: "details" },
      verifiedAt, verifyNotes, ...researchFields,
      { name: "is_featured", label: "Featured on homepage", type: "checkbox", group: "main" },
    ],
  },
  {
    area: true, revisions: true, key: "communities", table: "communities", label: "Communities", singular: "community", titleField: "name", hasSlug: true,
    hasStatus: true, hasCover: true, galleryEntity: "community", seo: true, softDelete: true, orderBy: { column: "sort_order", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/communities/${r.slug}`,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      statusField, area,
      { name: "alt_names", label: "Alternative names and spellings", type: "tags", group: "main", hint: "Comma separated. Recorded for editors; public search does not match these yet." },
      { name: "summary", label: "Introduction", type: "textarea", group: "main", max: 600 },
      { name: "history", label: "History (verified only)", type: "textarea", group: "details", hint: "Do not publish unverified history or population figures." },
      { name: "cultural_heritage", label: "Cultural heritage", type: "textarea", group: "details" },
      { name: "traditional_leadership", label: "Traditional leadership (verified only)", type: "textarea", group: "details" },
      { name: "festivals", label: "Festivals", type: "textarea", group: "details" },
      { name: "traditional_food", label: "Traditional food", type: "textarea", group: "details" },
      { name: "directions", label: "Directions", type: "textarea", group: "location" },
      lat, lng,
      { name: "sources", label: "Sources", type: "textarea", group: "details", hint: "Shown publicly. Who or what confirmed these facts?" },
      { name: "content_verified", label: "Content verified", type: "checkbox", approverOnly: true, group: "details" },
      verifiedAt, verifyNotes,
      { name: "sort_order", label: "Display order", type: "number", group: "details" },
    ],
  },
  {
    area: true, revisions: true, themeEntity: "listing", key: "accommodation", table: "listings", label: "Accommodation", singular: "accommodation listing", titleField: "name", hasSlug: true,
    typeFilter: { column: "type", values: accommodationTypes }, hasStatus: true, hasCover: true, galleryEntity: "listing", children: "rooms",
    seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "type", label: "Type" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/accommodation/${r.slug}`, fields: listingFields(accommodationTypes, false, true),
  },
  {
    area: true, revisions: true, themeEntity: "listing", key: "restaurants", table: "listings", label: "Food and dining", singular: "restaurant", titleField: "name", hasSlug: true,
    typeFilter: { column: "type", values: restaurantTypes }, hasStatus: true, hasCover: true, galleryEntity: "listing", children: "menu",
    seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/restaurants/${r.slug}`, fields: listingFields(restaurantTypes, true, false),
  },
  {
    area: true, revisions: true, themeEntity: "listing", key: "businesses", table: "listings", label: "Businesses", singular: "business", titleField: "name", hasSlug: true,
    typeFilter: { column: "type", values: businessTypes }, hasStatus: true, hasCover: true, galleryEntity: "listing",
    seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "type", label: "Type" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/business/${r.slug}`, fields: listingFields(businessTypes, false, false),
  },
  {
    area: true, revisions: true, themeEntity: "experience", key: "experiences", table: "experiences", label: "Experiences", singular: "experience", titleField: "title", hasSlug: true,
    hasStatus: true, hasCover: true, galleryEntity: "experience", seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "title", label: "Title" }, { name: "category", label: "Type" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/experiences/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, group: "main" },
      { name: "category", label: "Type", type: "select", required: true, group: "main", options: Object.entries(experienceCategoryLabels).map(([value, label]) => ({ value, label })) },
      statusField,
      { name: "provider_listing_id", label: "Provider", type: "relation", relation: { table: "listings", label: "name" }, group: "main", hint: "A business listing that runs this experience." },
      { name: "provider_verified", label: "Provider has confirmed this experience", type: "checkbox", adminOnly: true, group: "main", hint: "Tick only after the provider has confirmed details and availability." },
      { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
      { name: "description", label: "Description", type: "textarea", group: "main" },
      community, area, destination, verifiedAt, verifyNotes,
      { name: "duration_minutes", label: "Duration (minutes)", type: "number", group: "details" },
      { name: "price_from", label: "Price from", type: "number", group: "details", hint: "Only enter a price the provider has confirmed." },
      { name: "price_unit", label: "Price applies", type: "text", group: "details", hint: "e.g. per person" },
      { name: "price_on_request", label: "Price on request", type: "checkbox", group: "details", hint: "Tick instead of entering a price when the provider quotes per booking." },
      { name: "min_age", label: "Minimum age", type: "number", group: "details", hint: "Leave blank if there is no age requirement." },
      { name: "min_participants", label: "Minimum participants", type: "number", group: "details" },
      { name: "max_participants", label: "Maximum participants", type: "number", group: "details" },
      { name: "meeting_point", label: "Meeting point", type: "text", group: "location" },
      lat, lng,
      { name: "safety_requirements", label: "Safety requirements", type: "textarea", group: "details" },
      { name: "cancellation_policy", label: "Cancellation conditions", type: "textarea", group: "details" },
      { name: "video_url", label: "Video link", type: "url", group: "details" },
      { name: "is_featured", label: "Featured on homepage", type: "checkbox", adminOnly: true, group: "main" },
    ],
  },
  {
    area: true, revisions: true, themeEntity: "event", key: "events", table: "events", label: "Events", singular: "event", titleField: "title", hasSlug: true,
    hasStatus: true, hasCover: true, galleryEntity: "event", seo: true, softDelete: true, orderBy: { column: "starts_at", ascending: false },
    listColumns: [{ name: "title", label: "Title" }, { name: "starts_at", label: "Starts" }, { name: "status", label: "Status" }],
    publicPath: (r) => `/events/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, group: "main" },
      statusField,
      { name: "category", label: "Category", type: "select", required: true, group: "main", options: [{ value: "general", label: "General" }, { value: "sports", label: "Sports" }, { value: "education", label: "Education" }, { value: "cultural", label: "Cultural" }, { value: "business", label: "Business" }], hint: "Sports and education events also appear on their own pages." },
      { name: "event_status", label: "Event status", type: "select", required: true, group: "main", options: Object.entries(eventStatusLabels).map(([value, label]) => ({ value, label })) },
      { name: "starts_at", label: "Starts (Ghana time)", type: "datetime", required: true, group: "main" },
      { name: "ends_at", label: "Ends (Ghana time)", type: "datetime", group: "main" },
      { name: "date_verified", label: "Date verified with the organisers for this occurrence", type: "checkbox", group: "main", hint: "Untick if the date is provisional. Unverified dates show as “Date to be confirmed”. Traditional festivals do not fall on fixed calendar dates." },
      { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
      { name: "description", label: "Description", type: "textarea", group: "main" },
      { name: "venue", label: "Venue", type: "text", group: "location" },
      community, area, destination, verifiedAt, verifyNotes,
      lat, lng,
      { name: "organiser", label: "Organiser", type: "text", group: "details" },
      { name: "ticket_info", label: "Ticket information", type: "textarea", group: "details" },
      { name: "registration_url", label: "Registration link", type: "url", group: "details" },
      { name: "contact_email", label: "Contact email", type: "email", group: "contact" },
      { name: "contact_phone", label: "Contact phone", type: "text", group: "contact" },
    ],
  },
  {
    revisions: true, themeEntity: "article", key: "articles", table: "articles", label: "Articles", singular: "article", titleField: "title", hasSlug: true,
    hasStatus: true, hasCover: true, galleryEntity: "article", seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "title", label: "Title" }, { name: "status", label: "Status" }, { name: "published_at", label: "Publish date" }],
    publicPath: (r) => `/articles/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, group: "main" },
      statusField,
      { name: "published_at", label: "Publish date (Ghana time)", type: "datetime", group: "main", hint: "Set a future date to schedule. Defaults to now when published." },
      { name: "category_id", label: "Category", type: "relation", relation: { table: "article_categories", label: "name" }, group: "main" },
      destination,
      { name: "excerpt", label: "Excerpt", type: "textarea", group: "main", max: 400 },
      { name: "body", label: "Article body (Markdown)", type: "markdown", required: true, group: "main", hint: "Use ## for headings, **bold**, [links](https://…), and - for lists." },
      { name: "tags", label: "Tags", type: "tags", group: "details" },
    ],
  },
  {
    key: "testimonials", table: "testimonials", label: "Testimonials", singular: "testimonial", titleField: "author_name", hasSlug: false,
    hasStatus: true, hasCover: false, seo: false, softDelete: true, orderBy: { column: "created_at", ascending: false },
    listColumns: [{ name: "author_name", label: "Author" }, { name: "is_verified", label: "Verified" }, { name: "status", label: "Status" }],
    fields: [
      { name: "author_name", label: "Author name", type: "text", required: true, group: "main" },
      { name: "author_origin", label: "Where from", type: "text", group: "main" },
      { name: "quote", label: "Feedback", type: "textarea", required: true, group: "main" },
      { name: "rating", label: "Rating (1-5)", type: "number", group: "main" },
      { name: "is_verified", label: "Verified visitor", type: "checkbox", group: "main", hint: "Only verified feedback is shown on the website." },
      statusField,
    ],
  },
  {
    revisions: true, key: "pages", table: "pages", label: "Pages", singular: "page", titleField: "title", hasSlug: false, slugField: "slug",
    hasStatus: true, hasCover: true, seo: true, softDelete: false, orderBy: { column: "slug", ascending: true },
    listColumns: [{ name: "title", label: "Title" }, { name: "slug", label: "URL" }, { name: "status", label: "Status" }],
    publicPath: (r) => `/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, group: "main" },
      statusField,
      { name: "body", label: "Content (Markdown)", type: "markdown", group: "main", hint: "Use ## for headings, **bold**, [links](https://…), and - for lists." },
      { name: "last_verified_at", label: "Last verified on", type: "date", group: "details", hint: "Shown publicly. For practical information (travel, entry, safety) record when someone last checked it against the official source." },
      { name: "source_label", label: "Source", type: "text", group: "details", hint: "Shown publicly, e.g. the name of the official body." },
      { name: "source_url", label: "Source link", type: "url", group: "details" },
    ],
  },
];

resources.push({
  key: "subscription-plans", table: "subscription_plans", label: "Subscription plans", singular: "plan", titleField: "name", hasSlug: true,
  hasStatus: false, hasCover: false, seo: false, softDelete: false, orderBy: { column: "sort_order", ascending: true },
  listColumns: [{ name: "name", label: "Name" }, { name: "price_monthly", label: "Price / month" }, { name: "max_photos", label: "Photos" }, { name: "is_active", label: "Active" }],
  fields: [
    { name: "name", label: "Plan name", type: "text", required: true, group: "main" },
    { name: "summary", label: "Short description", type: "textarea", group: "main", max: 300 },
    { name: "price_monthly", label: "Price per month (GHS)", type: "number", group: "main", hint: "Leave blank to show no price. Nothing is charged online yet." },
    { name: "max_photos", label: "Maximum gallery photos", type: "number", required: true, group: "main" },
    { name: "features", label: "Benefits", type: "tags", group: "main", hint: "Comma separated list shown to businesses." },
    { name: "commission_percent", label: "Commission on paid bookings (%)", type: "number", group: "main", hint: "0 to 100. Recorded on each paid booking. Nothing is deducted automatically; payouts are arranged separately." },
    { name: "featured_placement", label: "Featured placement", type: "checkbox", group: "details" },
    { name: "analytics", label: "Listing analytics", type: "checkbox", group: "details" },
    { name: "is_active", label: "Offered to businesses", type: "checkbox", group: "details" },
    { name: "sort_order", label: "Display order", type: "number", group: "details" },
  ],
});

resources.push(
  {
    key: "investments", table: "investment_opportunities", label: "Investment opportunities", singular: "investment opportunity", titleField: "title", hasSlug: true,
    hasStatus: true, hasCover: true, seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "title", label: "Title" }, { name: "stage", label: "Stage" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/investment/${r.slug}`,
    fields: [
      { name: "title", label: "Project title", type: "text", required: true, group: "main" },
      { name: "stage", label: "Project stage", type: "select", required: true, group: "main", options: Object.entries(stageLabels).map(([value, label]) => ({ value, label })), hint: "Be strict. Only choose Approved or Existing if you can name the source." },
      { name: "stage_source", label: "Source for the stage", type: "textarea", group: "main", hint: "Required for Approved and Existing: who approved it, and the reference (e.g. Assembly resolution, permit)." },
      statusField,
      { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
      { name: "description", label: "Description", type: "textarea", group: "main" },
      { name: "proposed_location", label: "Proposed location", type: "text", group: "location" },
      community, lat, lng,
      { name: "objectives", label: "Development objectives", type: "textarea", group: "details" },
      { name: "commercial_opportunities", label: "Potential commercial opportunities", type: "textarea", group: "details" },
      { name: "investment_min", label: "Estimated investment: minimum", type: "number", group: "details", hint: "Only enter an estimate you can source. Leave blank otherwise." },
      { name: "investment_max", label: "Estimated investment: maximum", type: "number", group: "details" },
      { name: "investment_currency", label: "Currency", type: "select", required: true, group: "details", options: [{ value: "GHS", label: "GHS" }, { value: "USD", label: "USD" }] },
      { name: "investment_note", label: "Where the estimate comes from", type: "textarea", group: "details", hint: "Required if you enter an estimate." },
      { name: "environmental_considerations", label: "Environmental considerations", type: "textarea", group: "details" },
      { name: "partnership_requirements", label: "Partnership requirements", type: "textarea", group: "details" },
      { name: "images_are_conceptual", label: "Images are conceptual illustrations", type: "checkbox", group: "details", hint: "Keep ticked unless the photo shows the real, existing facility." },
      { name: "is_featured", label: "Featured on homepage", type: "checkbox", group: "main" },
    ],
  },
  {
    key: "advertisements", table: "advertisements", label: "Advertisements", singular: "advertisement", titleField: "title", hasSlug: false,
    hasStatus: true, hasCover: true, seo: false, softDelete: true, orderBy: { column: "starts_at", ascending: false },
    listColumns: [{ name: "title", label: "Ad" }, { name: "placement", label: "Placement" }, { name: "status", label: "Status" }, { name: "ends_at", label: "Ends" }, { name: "impressions", label: "Views" }, { name: "clicks", label: "Clicks" }],
    fields: [
      { name: "title", label: "Internal title", type: "text", required: true, group: "main" },
      { name: "advertiser_id", label: "Advertiser record", type: "relation", relation: { table: "advertisers", label: "name" }, group: "main", hint: "Optional: links the ad to an advertiser (Admin → Advertisers)." },
      { name: "advertiser_name", label: "Advertiser name shown publicly", type: "text", required: true, group: "main" },
      { name: "placement", label: "Placement", type: "select", required: true, group: "main", options: [{ value: "homepage_banner", label: "Homepage banner" }, { value: "directory_top", label: "Top of directory pages" }, { value: "search_top", label: "Top of search results" }, { value: "culture_top", label: "Culture and heritage pages" }, { value: "district_top", label: "Top of district pages" }] },
      statusField,
      { name: "headline", label: "Headline", type: "text", group: "main", max: 140 },
      { name: "body", label: "Short text", type: "textarea", group: "main", max: 300 },
      { name: "link_url", label: "Link", type: "url", required: true, group: "main" },
      { name: "starts_at", label: "Starts (Ghana time)", type: "datetime", required: true, group: "main" },
      { name: "ends_at", label: "Ends (Ghana time)", type: "datetime", required: true, group: "main", hint: "Published ads show only between these dates, always labelled “Sponsored”." },
    ],
  },
);

/* ───────────── Regional geography (Phase 1 of VisitAsanteman) ───────────── */
const sourceFields: FieldDef[] = [
  { name: "source", label: "Source of this record", type: "text", group: "details", hint: "Name the official publication, e.g. the Local Government Service list." },
  { name: "source_url", label: "Source link", type: "url", group: "details" },
  { name: "verified_at", label: "Source checked on", type: "datetime", group: "details" },
];
const activeField: FieldDef = { name: "is_active", label: "Active", type: "checkbox", group: "main", hint: "Inactive areas cannot be used to publish content." };

resources.push(
  {
    noCreatedBy: true, key: "regions", table: "regions", label: "Regions", singular: "region", titleField: "name", hasSlug: true, approverOnly: true,
    hasStatus: false, hasCover: false, seo: false, softDelete: false, orderBy: { column: "name", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "country_code", label: "Country" }, { name: "is_active", label: "Active" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      { name: "summary", label: "Summary", type: "textarea", group: "main", max: 600 },
      activeField, ...sourceFields,
    ],
  },
  {
    noCreatedBy: true, key: "administrative-areas", table: "administrative_areas", label: "Districts and municipalities", singular: "administrative area", titleField: "name", hasSlug: true, approverOnly: true,
    hasStatus: false, hasCover: true, seo: false, softDelete: false, orderBy: { column: "name", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "kind", label: "Type" }, { name: "is_active", label: "Active" }, { name: "verified_at", label: "Source checked" }],
    publicPath: (r) => `/districts/${r.slug}`,
    fields: [
      { name: "name", label: "Name (as named by the official source)", type: "text", required: true, group: "main" },
      { name: "region_id", label: "Region", type: "relation", relation: { table: "regions", label: "name" }, required: true, group: "main" },
      { name: "kind", label: "Type", type: "select", required: true, group: "main", options: [{ value: "metropolitan", label: "Metropolitan" }, { value: "municipal", label: "Municipal" }, { value: "district", label: "District" }] },
      { name: "capital_name", label: "Capital", type: "text", group: "main", hint: "Only from the official source." },
      { name: "alt_names", label: "Alternative names and spellings", type: "tags", group: "main", hint: "Comma separated. Recorded for editors; public search does not match these yet." },
      { name: "summary", label: "Introduction", type: "textarea", group: "main", max: 600 },
      activeField,
      { name: "latitude", label: "Map centre latitude", type: "lat", group: "location", hint: "Optional. Leave blank if unknown. Never estimate." },
      { name: "longitude", label: "Map centre longitude", type: "lng", group: "location" },
      ...sourceFields,
      { name: "sort_order", label: "Display order", type: "number", group: "details" },
    ],
  },
  {
    key: "traditional-areas", table: "traditional_areas", label: "Traditional areas", singular: "traditional area", titleField: "name", hasSlug: true,
    revisions: true, hasStatus: true, hasCover: false, seo: false, softDelete: true, orderBy: { column: "name", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      statusField,
      { name: "summary", label: "Summary (verified only)", type: "textarea", group: "main", max: 600, hint: "Traditional institutions are culturally sensitive. Publish only text reviewed by the appropriate custodians." },
      { name: "sources", label: "Sources", type: "textarea", group: "details", hint: "Who or what confirmed these facts?" },
      { name: "content_verified", label: "Content verified", type: "checkbox", approverOnly: true, group: "details" },
      verifiedAt, verifyNotes,
    ],
  },
  {
    key: "destinations", table: "destinations", label: "Destinations", singular: "destination", titleField: "name", hasSlug: true,
    revisions: true, hasStatus: true, hasCover: true, seo: true, softDelete: true, orderBy: { column: "sort_order", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/destinations/${r.slug}`,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      statusField,
      { ...area, required: true, hint: "Every destination belongs to one district, municipality or metropolis." },
      { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
      { name: "description", label: "Description", type: "textarea", group: "main" },
      { name: "directions", label: "Directions", type: "textarea", group: "location" },
      lat, lng,
      { name: "sources", label: "Sources", type: "textarea", group: "details", hint: "Shown publicly. Who or what confirmed these facts?" },
      { name: "content_verified", label: "Content verified", type: "checkbox", approverOnly: true, group: "details" },
      verifiedAt, verifyNotes,
      { name: "sort_order", label: "Display order", type: "number", group: "details" },
    ],
  },
  {
    noCreatedBy: true, key: "localities", table: "localities", label: "Localities", singular: "locality", titleField: "name", hasSlug: true,
    hasStatus: false, hasCover: false, seo: false, softDelete: false, orderBy: { column: "name", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "updated_at", label: "Updated" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      { name: "community_id", label: "Community", type: "relation", relation: { table: "communities", label: "name" }, required: true, group: "main" },
      lat, lng,
      { name: "sort_order", label: "Display order", type: "number", group: "details" },
    ],
  },
);

resources.push(
  {
    themeEntity: "listing", key: "venues", table: "listings", label: "Event venues", singular: "venue", titleField: "name", hasSlug: true,
    typeFilter: { column: "type", values: venueTypes }, hasStatus: true, hasCover: true, galleryEntity: "listing", area: true, revisions: true,
    seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "type", label: "Type" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/venues/${r.slug}`, fields: listingFields(venueTypes, false, false),
  },
  {
    themeEntity: "listing", key: "markets", table: "listings", label: "Markets and shopping", singular: "market", titleField: "name", hasSlug: true,
    typeFilter: { column: "type", values: marketTypes }, hasStatus: true, hasCover: true, galleryEntity: "listing", area: true, revisions: true,
    seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
    listColumns: [{ name: "name", label: "Name" }, { name: "type", label: "Type" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
    publicPath: (r) => `/markets/${r.slug}`, fields: listingFields(marketTypes, false, false),
  },
);

/* ───────────── Education, sports and transport (Phase 5) ───────────── */
const researchCore = researchFields.filter((f) => !["access_status", "access_notes", "managing_institution", "alt_names"].includes(f.name));
const opts = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
const facilityField: FieldDef = { name: "facility_status", label: "Operating status", type: "select", required: true, group: "main", options: opts(facilityStatusLabels), hint: "Existing, planned and closed facilities must never look alike. Leave as unconfirmed unless you have a source." };
const domainBase = (extraMain: FieldDef[], extraDetails: FieldDef[]): FieldDef[] => [
  { name: "name", label: "Name", type: "text", required: true, group: "main" },
  ...extraMain,
  statusField, area, community,
  { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
  { name: "description", label: "Description", type: "textarea", group: "main" },
  ...extraDetails,
  { name: "address", label: "Address", type: "text", group: "location" }, lat, lng,
  { name: "website", label: "Website", type: "url", group: "contact" },
  { name: "contact_phone", label: "Phone", type: "text", group: "contact" },
  { name: "contact_email", label: "Email", type: "email", group: "contact" },
  verifiedAt, verifyNotes, ...researchCore,
];
const domainDef = (key: string, table: string, label: string, singular: string, base: string, fields: FieldDef[], cols: { name: string; label: string }[]): ResourceDef => ({
  key, table, label, singular, titleField: "name", hasSlug: true, area: true, revisions: true, verifiable: true, hasStatus: true, hasCover: true, seo: true, softDelete: true,
  filter: { column: "verification_status", label: "Verification", options: verificationOptions },
  orderBy: { column: "updated_at", ascending: false }, listColumns: [{ name: "name", label: "Name" }, ...cols, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
  publicPath: (r) => `${base}/${r.slug}`, fields,
});

resources.push(
  domainDef("institutions", "institutions", "Education institutions", "institution", "/education", domainBase(
    [{ name: "kind", label: "Type", type: "select", required: true, group: "main", options: opts(institutionKinds) }],
    [
      { name: "programmes", label: "Programmes or courses", type: "textarea", group: "details", hint: "As stated by the institution." },
      { name: "admissions_url", label: "Admissions link", type: "url", group: "details" },
      { name: "facilities", label: "Campus facilities", type: "tags", group: "details" },
      { name: "visitor_access", label: "Visitor access", type: "select", required: true, group: "details", options: accessOptions, hint: "A campus is not a tourist attraction unless the institution says visitors are welcome." },
      { name: "visitor_arrangements", label: "Visitors and open days", type: "textarea", group: "details" },
      { name: "recognition_note", label: "Recognition status and who confirmed it", type: "textarea", group: "details", hint: "e.g. the regulator register and the date checked. Leave blank if unconfirmed." },
    ]), [{ name: "kind", label: "Type" }]),
  domainDef("sports-venues", "sports_venues", "Sports venues", "sports venue", "/sports", domainBase([facilityField], [
    { name: "sports", label: "Sports supported", type: "tags", group: "details" },
    { name: "capacity", label: "Capacity (verified only)", type: "number", group: "details" },
    { name: "managed_by", label: "Owner or manager", type: "text", group: "details" },
    { name: "facilities", label: "Facilities", type: "tags", group: "details" },
    { name: "booking_info", label: "Booking and enquiries", type: "textarea", group: "details" },
    { name: "accessibility", label: "Accessibility", type: "textarea", group: "details" },
  ]), [{ name: "facility_status", label: "Operating status" }]),
  domainDef("sports-clubs", "sports_clubs", "Sports clubs", "sports club", "/sports/clubs", domainBase([], [
    { name: "sport", label: "Sport", type: "text", group: "details" },
    { name: "level", label: "League or division (as stated by an official source)", type: "text", group: "details", hint: "Changes by season. Record the source and date." },
    { name: "home_venue_id", label: "Home venue", type: "relation", relation: { table: "sports_venues", label: "name" }, group: "details" },
    { name: "official_url", label: "Official club or league link", type: "url", group: "details" },
  ]), [{ name: "sport", label: "Sport" }]),
  domainDef("transport", "transport_providers", "Transport", "transport service", "/transport", domainBase(
    [{ name: "kind", label: "Type", type: "select", required: true, group: "main", options: opts(transportKinds) }, facilityField],
    [
      { name: "routes", label: "Routes covered", type: "textarea", group: "details" },
      { name: "departure_points", label: "Departure points", type: "textarea", group: "details" },
      { name: "operating_info", label: "Operating days and times", type: "textarea", group: "details", hint: "Only as confirmed by the operator." },
      { name: "fare_info", label: "Fares", type: "textarea", group: "details", hint: "Only with a source. Record the date below." },
      { name: "fare_updated_at", label: "Fare information last updated", type: "date", group: "details" },
      { name: "luggage_rules", label: "Luggage rules", type: "textarea", group: "details" },
      { name: "accessibility", label: "Accessibility", type: "textarea", group: "details" },
      { name: "booking_method", label: "How to book", type: "text", group: "details" },
      { name: "booking_url", label: "Booking link", type: "url", group: "details" },
    ]), [{ name: "kind", label: "Type" }, { name: "facility_status", label: "Operating status" }]),
);

resources.push(
  {
    key: "themes", table: "themes", label: "Themes", singular: "theme", titleField: "name", hasSlug: true, noCreatedBy: true,
    hasStatus: false, hasCover: true, seo: false, softDelete: false, orderBy: { column: "sort_order", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "kind", label: "Kind" }, { name: "is_active", label: "Active" }, { name: "sort_order", label: "Order" }],
    publicPath: (r) => `/themes/${r.slug}`,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      { name: "kind", label: "Kind", type: "select", required: true, group: "main", options: [{ value: "experience_theme", label: "Experience theme (Eat, Wear, See, Feel)" }, { value: "tour_category", label: "Tour category (Nature, Culture, Lifestyle, Heritage)" }] },
      { name: "summary", label: "Description (written by an administrator)", type: "textarea", group: "main", max: 400, hint: "Shown on the theme page. Leave blank until you have verified wording." },
      { name: "is_active", label: "Active", type: "checkbox", group: "main", hint: "A theme appears publicly only while it is active and has published content." },
      { name: "sort_order", label: "Order", type: "number", group: "main" },
    ],
  },
  {
    key: "attraction-categories", table: "attraction_categories", label: "Attraction categories", singular: "category", titleField: "name", hasSlug: true, noCreatedBy: true,
    hasStatus: false, hasCover: true, seo: false, softDelete: false, orderBy: { column: "sort_order", ascending: true },
    listColumns: [{ name: "name", label: "Name" }, { name: "is_featured", label: "On homepage" }, { name: "sort_order", label: "Order" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, group: "main" },
      { name: "is_featured", label: "Show on the homepage “Explore by type” grid", type: "checkbox", group: "main", hint: "Categories with no published attractions are hidden automatically." },
      { name: "sort_order", label: "Order", type: "number", group: "main" },
    ],
  },
);

resources.push({
  key: "quick-links", table: "quick_links", label: "Homepage quick links", singular: "quick link", titleField: "label", hasSlug: false, noCreatedBy: true,
  hasStatus: false, hasCover: false, seo: false, softDelete: false, orderBy: { column: "sort_order", ascending: true },
  listColumns: [{ name: "label", label: "Label" }, { name: "url", label: "Link" }, { name: "is_enabled", label: "Shown" }, { name: "sort_order", label: "Order" }],
  fields: [
    { name: "label", label: "Label", type: "text", required: true, group: "main", max: 40 },
    { name: "url", label: "Link", type: "text", required: true, group: "main", hint: "A page on this site such as /events, or a full https:// address." },
    { name: "icon", label: "Icon", type: "select", required: true, group: "main", options: ["car", "info", "file-text", "calendar", "map", "compass", "bed", "utensils", "camera", "users", "ticket", "phone"].map((v) => ({ value: v, label: v })) },
    { name: "page_slug", label: "Hide until this page is published (optional)", type: "text", group: "main", hint: "The short name of a managed page, e.g. getting-around. Leave blank to always show." },
    { name: "is_enabled", label: "Shown on the homepage", type: "checkbox", group: "main", hint: "At most six links can be shown at once." },
    { name: "sort_order", label: "Order", type: "number", group: "main" },
  ],
});

resources.push({
  key: "advertisers", table: "advertisers", label: "Advertisers", singular: "advertiser", titleField: "name", hasSlug: false,
  hasStatus: false, hasCover: false, seo: false, softDelete: true, noCreatedBy: false, orderBy: { column: "name", ascending: true },
  listColumns: [{ name: "name", label: "Name" }, { name: "contact_email", label: "Email" }, { name: "updated_at", label: "Updated" }],
  fields: [
    { name: "name", label: "Advertiser name", type: "text", required: true, group: "main" },
    { name: "contact_name", label: "Contact person", type: "text", group: "main" },
    { name: "contact_email", label: "Contact email", type: "email", group: "main" },
    { name: "contact_phone", label: "Contact phone", type: "text", group: "main" },
    { name: "notes", label: "Internal notes", type: "textarea", group: "details", hint: "Terms agreed, invoice reference. Never shown publicly." },
  ],
});

resources.push({
  key: "curated-itineraries", table: "curated_itineraries", label: "Curated itineraries", singular: "curated itinerary", titleField: "title", hasSlug: true,
  revisions: true, hasStatus: true, hasCover: true, seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
  listColumns: [{ name: "title", label: "Title" }, { name: "theme", label: "Theme" }, { name: "status", label: "Status" }, { name: "updated_at", label: "Updated" }],
  publicPath: (r) => `/travel-planner/itineraries/${r.slug}`,
  fields: [
    { name: "title", label: "Title", type: "text", required: true, group: "main" },
    statusField,
    { name: "theme", label: "Theme", type: "text", group: "main" },
    { name: "summary", label: "Summary", type: "textarea", group: "main", max: 600, hint: "A curated itinerary can only be published once a plan is attached. Build the plan in the travel planner, then use “Publish as a curated itinerary” there." },
  ],
});

resources.push({
  key: "ceremonies", table: "ceremonies", label: "Ceremonies and festivals", singular: "ceremony", titleField: "name", hasSlug: true,
  area: true, revisions: true, hasStatus: true, hasCover: true, seo: true, softDelete: true, orderBy: { column: "updated_at", ascending: false },
  filter: { column: "verification_status", label: "Verification", options: verificationOptions },
  listColumns: [{ name: "name", label: "Name" }, { name: "kind", label: "Type" }, { name: "starts_at", label: "Date" }, { name: "status", label: "Status" }],
  publicPath: (r) => `/culture/ceremonies/${r.slug}`,
  fields: [
    { name: "name", label: "Name", type: "text", required: true, group: "main" },
    { name: "kind", label: "Type", type: "select", required: true, group: "main", options: Object.entries(ceremonyKindLabels).map(([value, label]) => ({ value, label })) },
    statusField,
    { name: "attendance", label: "Public attendance", type: "select", required: true, group: "main", options: Object.entries(attendanceLabels).map(([value, label]) => ({ value, label })), hint: "Ceremonies are not automatically public events. Some are private or sacred. Be strict." },
    { name: "authority_approved", label: "Traditional authority or organiser has approved the public information", type: "checkbox", approverOnly: true, group: "main", hint: "Required before publishing. Tick only after the responsible authority has agreed what may be shown." },
    { name: "traditional_area_id", label: "Traditional area", type: "relation", relation: { table: "traditional_areas", label: "name" }, group: "main" },
    community, area,
    { name: "organiser", label: "Traditional authority or organiser", type: "text", group: "main" },
    { name: "summary", label: "Short summary", type: "textarea", group: "main", max: 400 },
    { name: "significance", label: "Significance and history (verified only)", type: "textarea", group: "details", hint: "Do not write cultural meaning from memory. Use cited sources or custodians, and record who reviewed it." },
    { name: "starts_at", label: "Starts (Ghana time)", type: "datetime", group: "details" },
    { name: "ends_at", label: "Ends (Ghana time)", type: "datetime", group: "details" },
    { name: "date_confirmed", label: "Date confirmed with the organisers for this occurrence", type: "checkbox", group: "details", hint: "Traditional dates are announced each year and do not follow fixed calendar dates. Only tick when confirmed; unconfirmed dates are never shown." },
    { name: "date_note", label: "How dates are announced", type: "text", group: "details", hint: "e.g. who announces the date. Do not guess a pattern." },
    { name: "attendance_notes", label: "Attendance conditions", type: "textarea", group: "details" },
    { name: "etiquette", label: "Visitor etiquette", type: "textarea", group: "details" },
    { name: "dress_guidance", label: "Dress guidance", type: "textarea", group: "details" },
    { name: "photography_rules", label: "Photography and recording rules", type: "textarea", group: "details" },
    { name: "contact_phone", label: "Contact phone", type: "text", group: "contact" },
    { name: "contact_email", label: "Contact email", type: "email", group: "contact" },
    { name: "official_announcement_url", label: "Official announcement link", type: "url", group: "contact" },
    verifiedAt, verifyNotes,
    ...researchFields.filter((f) => !["access_status", "access_notes", "managing_institution", "alt_names"].includes(f.name)),
  ],
});

export const resourceMap = Object.fromEntries(resources.map((r) => [r.key, r])) as Record<string, ResourceDef>;

export const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { group: "Content" },
  { href: "/admin/attractions", label: "Attractions" },
  { href: "/admin/attraction-categories", label: "Attraction categories" },
  { href: "/admin/themes", label: "Themes" },
  { href: "/admin/import", label: "Import research" },
  { href: "/admin/communities", label: "Communities" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/ceremonies", label: "Ceremonies & festivals" },
  { href: "/admin/curated-itineraries", label: "Curated itineraries" },
  { href: "/admin/institutions", label: "Education" },
  { href: "/admin/sports-venues", label: "Sports venues" },
  { href: "/admin/sports-clubs", label: "Sports clubs" },
  { href: "/admin/transport", label: "Transport" },
  { href: "/admin/accommodation", label: "Accommodation" },
  { href: "/admin/restaurants", label: "Food & dining" },
  { href: "/admin/venues", label: "Event venues" },
  { href: "/admin/markets", label: "Markets" },
  { href: "/admin/experiences", label: "Experiences" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/verification", label: "Business verification" },
  { href: "/admin/jobs", label: "Jobs moderation" },
  { href: "/admin/subscription-plans", label: "Subscription plans" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/investments", label: "Investments" },
  { href: "/admin/advertisements", label: "Advertisements" },
  { href: "/admin/advertisers", label: "Advertisers" },
  { href: "/admin/advertising", label: "Ad performance" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/quick-links", label: "Homepage quick links" },
  { href: "/admin/media", label: "Media library" },
  { group: "Geography" },
  { href: "/admin/regions", label: "Regions" },
  { href: "/admin/administrative-areas", label: "Districts" },
  { href: "/admin/traditional-areas", label: "Traditional areas" },
  { href: "/admin/localities", label: "Localities" },
  { group: "Audience" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/users", label: "Users" },
  { group: "System" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/readiness", label: "Launch readiness" },
  { href: "/admin/settings", label: "Settings" },
] as const;
