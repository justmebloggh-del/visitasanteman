-- VisitAsanteman Phase 5: education, sports and transport directories.
-- Same safeguards as attractions: records start as research drafts, cannot be published until verified with a source
-- and placed in an active district, and only approvers publish. No fixtures or fares are invented: fixtures are not
-- stored at all (they need an authorised data source) and fares need a source and date.

create type institution_kind as enum ('university', 'technical_university', 'college_of_education', 'nursing_midwifery',
  'tvet', 'senior_high', 'library', 'research_institution', 'cultural_learning_centre', 'vocational', 'other');
create type transport_kind as enum ('airport', 'intercity_bus', 'local_bus', 'terminal', 'taxi', 'ride_hailing', 'car_rental',
  'private_driver', 'tour_transport', 'railway', 'port', 'walking_route', 'cycling_route', 'accessible_transport', 'other');
-- Existing, planned and closed facilities must never look alike.
create type facility_status as enum ('unknown', 'operational', 'limited_service', 'under_development', 'proposed', 'temporarily_closed', 'permanently_closed');

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind institution_kind not null default 'other',
  summary text,
  description text,
  administrative_area_id uuid references administrative_areas (id) on delete restrict,
  community_id uuid references communities (id) on delete set null,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  website text, contact_phone text, contact_email text,
  programmes text,                 -- courses or programmes, as stated by the institution
  admissions_url text,
  facilities text[] not null default '{}',
  visitor_arrangements text,
  visitor_access access_status not null default 'unknown',   -- a campus is not a tourist attraction unless it says so
  recognition_note text,           -- recognition status and who confirmed it (e.g. the regulator register)
  cover_media_id uuid references media (id) on delete set null,
  verification_status verification_status not null default 'awaiting_verification',
  source_organisation text, source_url text, source_published_at date, researched_at date,
  reviewed_by uuid references auth.users (id) on delete set null,
  research_notes text,
  last_verified_at timestamptz, verification_notes text,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index institutions_status_idx on institutions (status) where deleted_at is null;
create index institutions_area_idx on institutions (administrative_area_id);

create table sports_venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  description text,
  administrative_area_id uuid references administrative_areas (id) on delete restrict,
  community_id uuid references communities (id) on delete set null,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  website text, contact_phone text, contact_email text,
  sports text[] not null default '{}',
  capacity int check (capacity > 0),      -- only when verified
  managed_by text,
  facilities text[] not null default '{}',
  booking_info text,
  accessibility text,
  facility_status facility_status not null default 'unknown',
  cover_media_id uuid references media (id) on delete set null,
  verification_status verification_status not null default 'awaiting_verification',
  source_organisation text, source_url text, source_published_at date, researched_at date,
  reviewed_by uuid references auth.users (id) on delete set null,
  research_notes text,
  last_verified_at timestamptz, verification_notes text,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sports_venues_status_idx on sports_venues (status) where deleted_at is null;
create index sports_venues_area_idx on sports_venues (administrative_area_id);

create table sports_clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  description text,
  administrative_area_id uuid references administrative_areas (id) on delete restrict,
  community_id uuid references communities (id) on delete set null,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  website text, contact_phone text, contact_email text,
  sport text,
  level text,                      -- league or division as stated by an official source; changes by season
  home_venue_id uuid references sports_venues (id) on delete set null,
  official_url text,
  cover_media_id uuid references media (id) on delete set null,
  verification_status verification_status not null default 'awaiting_verification',
  source_organisation text, source_url text, source_published_at date, researched_at date,
  reviewed_by uuid references auth.users (id) on delete set null,
  research_notes text,
  last_verified_at timestamptz, verification_notes text,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sports_clubs_status_idx on sports_clubs (status) where deleted_at is null;
create index sports_clubs_area_idx on sports_clubs (administrative_area_id);

create table transport_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind transport_kind not null default 'other',
  summary text,
  description text,
  administrative_area_id uuid references administrative_areas (id) on delete restrict,
  community_id uuid references communities (id) on delete set null,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  website text, contact_phone text, contact_email text,
  routes text,                     -- route coverage
  departure_points text,
  operating_info text,             -- days and times, as confirmed
  fare_info text,                  -- only with a source and date below
  fare_updated_at date,
  luggage_rules text,
  accessibility text,
  booking_method text,
  booking_url text,
  facility_status facility_status not null default 'unknown',
  cover_media_id uuid references media (id) on delete set null,
  verification_status verification_status not null default 'awaiting_verification',
  source_organisation text, source_url text, source_published_at date, researched_at date,
  reviewed_by uuid references auth.users (id) on delete set null,
  research_notes text,
  last_verified_at timestamptz, verification_notes text,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index transport_providers_status_idx on transport_providers (status) where deleted_at is null;
create index transport_providers_area_idx on transport_providers (administrative_area_id);

do $$
declare t text;
begin
  foreach t in array array['institutions', 'sports_venues', 'sports_clubs', 'transport_providers'] loop
    execute format('create trigger tg_a_derive_area before insert or update on %I for each row execute function derive_administrative_area()', t);
    execute format('create trigger tg_b_publish_area before insert or update on %I for each row execute function guard_publish_requires_area()', t);
    execute format('create trigger tg_c_workflow before insert or update on %I for each row execute function guard_editorial_workflow()', t);
    execute format('create trigger tg_f_research before insert or update on %I for each row execute function guard_attraction_research()', t);
    execute format('create trigger tg_e_revision before update on %I for each row execute function record_revision()', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger audit_row after insert or update or delete on %I for each row execute function audit_row()', t);
    execute format('alter table %I enable row level security', t);
    execute format($f$create policy %1$s_public_read on %1$I for select using ((status = 'published' and deleted_at is null) or is_staff())$f$, t);
    execute format($f$create policy %1$s_staff_insert on %1$I for insert with check (is_staff())$f$, t);
    execute format($f$create policy %1$s_staff_update on %1$I for update using (is_staff()) with check (is_staff())$f$, t);
    execute format($f$create policy %1$s_admin_delete on %1$I for delete using (is_admin())$f$, t);
  end loop;
end $$;

-- Events can be classified so sports, education and cultural events get their own calendars.
create type event_category as enum ('general', 'sports', 'education', 'cultural', 'business');
alter table events add column category event_category not null default 'general';
create index events_category_idx on events (category);
