-- Visit Lake Bosomtwe: core schema (Phase 1)
-- Principles: UUID keys, soft delete, RLS on every table, roles stored in a
-- table users cannot write to, public reads limited to published content.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ───────────────────────── Enums ─────────────────────────
create type app_role as enum ('super_admin', 'admin', 'editor', 'partner', 'visitor');
create type content_status as enum ('draft', 'pending_review', 'published', 'archived');
create type listing_type as enum (
  'hotel', 'resort', 'guesthouse', 'lodge', 'eco_lodge', 'holiday_home', 'apartment',
  'restaurant',
  'tour_operator', 'tour_guide', 'boat_operator', 'transport', 'event_organiser',
  'photography', 'artisan', 'souvenir_shop', 'travel_agency', 'supplier'
);
create type experience_category as enum (
  'boat_cruise', 'guided_tour', 'fishing', 'hiking', 'cycling', 'birdwatching',
  'photography', 'cultural', 'community', 'nature', 'group_excursion', 'family'
);
create type event_status as enum ('scheduled', 'cancelled', 'postponed', 'completed');
create type enquiry_kind as enum (
  'general', 'accommodation', 'experience', 'table_reservation', 'investment', 'partnership', 'business_listing'
);
create type enquiry_status as enum ('new', 'read', 'replied', 'closed');

-- ───────────────────────── Helpers ─────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────── Auth: profiles & roles ─────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles live in their own table. No RLS policy lets a user write it, so a
-- role can never be self-assigned from the browser.
create table user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'visitor',
  assigned_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  -- Always 'visitor'. Elevation is done by an administrator only.
  insert into user_roles (user_id, role) values (new.id, 'visitor');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function current_app_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from user_roles where user_id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin', 'editor'), false)
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin'), false)
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() = 'super_admin', false)
$$;

-- ───────────────────────── Media library ─────────────────────────
create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,            -- path inside the 'media' storage bucket
  alt_text text not null default '',
  caption text,
  credit text,                          -- photographer / source
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width int,
  height int,
  folder text not null default 'general',
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Which media belongs to which content item (gallery order etc.)
create table media_links (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references media (id) on delete cascade,
  entity_type text not null check (entity_type in
    ('attraction', 'community', 'listing', 'experience', 'event', 'article')),
  entity_id uuid not null,
  sort_order int not null default 0,
  unique (media_id, entity_type, entity_id)
);
create index media_links_entity_idx on media_links (entity_type, entity_id, sort_order);

-- ───────────────────────── Communities ─────────────────────────
create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  history text,                 -- only verified history
  cultural_heritage text,
  traditional_leadership text,  -- only where verified
  festivals text,
  traditional_food text,
  directions text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  cover_media_id uuid references media (id) on delete set null,
  content_verified boolean not null default false,
  sources text,                 -- public references shown on the page (column-level hiding is not possible under RLS)
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ───────────────────────── Attractions ─────────────────────────
create table attraction_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table attractions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  category_id uuid references attraction_categories (id) on delete set null,
  community_id uuid references communities (id) on delete set null,
  summary text,
  description text,
  history text,                 -- only verified history
  video_url text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  directions text,
  opening_hours text,
  entrance_fee text,
  activities text[] not null default '{}',
  visitor_guidelines text,
  accessibility text,
  contact_phone text,
  contact_email text,
  cover_media_id uuid references media (id) on delete set null,
  is_featured boolean not null default false,
  content_verified boolean not null default false,
  sources text,                 -- public references shown on the page
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index attractions_status_idx on attractions (status) where deleted_at is null;
create index attractions_category_idx on attractions (category_id);
create index attractions_community_idx on attractions (community_id);
create index attractions_name_trgm on attractions using gin (name gin_trgm_ops);

-- ───────────────────────── Listings (stays, food, businesses) ─────────────────────────
create table listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type listing_type not null,
  name text not null,
  community_id uuid references communities (id) on delete set null,
  owner_id uuid references auth.users (id) on delete set null,  -- partner owner (Phase 2)
  summary text,
  description text,
  address text,
  directions text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  phone text,
  whatsapp text,                -- international format digits, e.g. 233XXXXXXXXX
  email text,
  website text,
  social jsonb not null default '{}'::jsonb,
  opening_hours text,
  price_from numeric(12, 2) check (price_from >= 0),
  price_currency char(3) not null default 'GHS',
  price_note text,
  amenities text[] not null default '{}',
  cuisines text[] not null default '{}',
  logo_media_id uuid references media (id) on delete set null,
  cover_media_id uuid references media (id) on delete set null,
  is_featured boolean not null default false,
  is_verified boolean not null default false,   -- badge; set by admins only after checks
  verified_at timestamptz,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index listings_type_status_idx on listings (type, status) where deleted_at is null;
create index listings_community_idx on listings (community_id);
create index listings_owner_idx on listings (owner_id);
create index listings_name_trgm on listings using gin (name gin_trgm_ops);

-- Room types: the basis for later availability and real-time booking.
create table room_types (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  name text not null,
  description text,
  max_guests int check (max_guests > 0),
  price_per_night numeric(12, 2) check (price_per_night >= 0),
  units int not null default 1 check (units >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index room_types_listing_idx on room_types (listing_id);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  section text not null default 'Menu',
  name text not null,
  description text,
  price numeric(12, 2) check (price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_listing_idx on menu_items (listing_id);

-- ───────────────────────── Experiences ─────────────────────────
create table experiences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  category experience_category not null,
  provider_listing_id uuid references listings (id) on delete set null,
  community_id uuid references communities (id) on delete set null,
  summary text,
  description text,
  duration_minutes int check (duration_minutes > 0),
  price_from numeric(12, 2) check (price_from >= 0),
  price_currency char(3) not null default 'GHS',
  price_unit text,              -- e.g. 'per person', 'per boat'
  min_participants int check (min_participants > 0),
  max_participants int check (max_participants >= coalesce(min_participants, 1)),
  meeting_point text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  safety_requirements text,
  cancellation_policy text,
  video_url text,
  cover_media_id uuid references media (id) on delete set null,
  -- The public site only states an experience is bookable once the provider
  -- has confirmed it. Until then it is shown as "availability to be confirmed".
  provider_verified boolean not null default false,
  is_featured boolean not null default false,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index experiences_status_idx on experiences (status, category) where deleted_at is null;

-- ───────────────────────── Events ─────────────────────────
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  community_id uuid references communities (id) on delete set null,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  organiser text,
  ticket_info text,
  registration_url text,
  contact_email text,
  contact_phone text,
  event_status event_status not null default 'scheduled',
  cover_media_id uuid references media (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);
create index events_start_idx on events (starts_at) where deleted_at is null;

-- ───────────────────────── Articles ─────────────────────────
create table article_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text,
  body text not null default '',          -- Markdown; rendered without raw HTML
  category_id uuid references article_categories (id) on delete set null,
  author_id uuid references auth.users (id) on delete set null,
  cover_media_id uuid references media (id) on delete set null,
  tags text[] not null default '{}',
  status content_status not null default 'draft',
  published_at timestamptz,               -- future date = scheduled publishing
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index articles_pub_idx on articles (published_at desc) where deleted_at is null;

-- ───────────────────────── Marketing & engagement ─────────────────────────
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_origin text,
  quote text not null,
  rating int check (rating between 1 and 5),
  is_verified boolean not null default false,   -- only verified ones are shown
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  source text not null default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index newsletter_email_uniq on newsletter_subscribers (lower(email));

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  kind enquiry_kind not null default 'general',
  name text not null check (length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  phone text check (length(phone) <= 40),
  message text not null check (length(message) between 1 and 4000),
  listing_id uuid references listings (id) on delete set null,
  experience_id uuid references experiences (id) on delete set null,
  details jsonb not null default '{}'::jsonb,   -- dates, guests, etc.
  status enquiry_status not null default 'new',
  handled_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on enquiries (status, created_at desc);

-- ───────────────────────── Static pages (About, Explore, Travel Guide, legal) ─────────────────────────
create table pages (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  body text not null default '',           -- Markdown, rendered without raw HTML
  cover_media_id uuid references media (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ───────────────────────── System ─────────────────────────
create table site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table homepage_sections (
  key text primary key,
  title text,
  subtitle text,
  body text,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  table_name text not null,
  row_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs (created_at desc);

create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, action, table_name, row_id, old_data, new_data)
  values (
    auth.uid(), tg_op, tg_table_name,
    coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'), (to_jsonb(new) ->> 'key'), (to_jsonb(old) ->> 'key')),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

-- ───────────────────────── updated_at + audit triggers ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'user_roles', 'media', 'communities', 'attractions', 'listings', 'room_types',
    'menu_items', 'experiences', 'events', 'articles', 'testimonials', 'enquiries',
    'site_settings', 'homepage_sections', 'pages'
  ] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;

  foreach t in array array[
    'user_roles', 'communities', 'attractions', 'listings', 'room_types', 'menu_items',
    'experiences', 'events', 'articles', 'testimonials', 'site_settings', 'homepage_sections', 'media', 'pages'
  ] loop
    execute format('create trigger audit_row after insert or update or delete on %I for each row execute function audit_row()', t);
  end loop;
end $$;

-- Only administrators may change verification badges / featured flags on listings.
create or replace function guard_listing_privileged_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (
       new.is_verified is distinct from old.is_verified
    or new.verified_at is distinct from old.verified_at
    or new.is_featured is distinct from old.is_featured
    or new.owner_id is distinct from old.owner_id
  ) then
    raise exception 'Only administrators can change verification, featured or owner fields';
  end if;
  return new;
end $$;
create trigger guard_listing_privileged before update on listings
  for each row execute function guard_listing_privileged_fields();
