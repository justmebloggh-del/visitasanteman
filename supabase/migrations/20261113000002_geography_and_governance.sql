-- VisitAsanteman Phase 1: regional geography, role permissions, publish guard, revisions.
-- Hierarchy: Region -> Administrative area (MMDA) -> Community -> Locality.
-- Traditional areas are a separate many-to-many overlay (they do not nest inside MMDAs).
-- This migration loads NO administrative-area names: they come from an official
-- source in a separate data migration.

-- ───────────────────────── Role helpers ─────────────────────────
-- is_staff(): can read operational data (enquiries, bookings, profiles) and edit content.
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin', 'regional_editor', 'editor'), false)
$$;
-- Approve, publish, verify content and maintain geography reference data.
create or replace function can_approve() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin', 'regional_editor'), false)
$$;
create or replace function can_manage_geography() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin', 'regional_editor'), false)
$$;
-- Media library: staff plus media managers (who can do nothing else).
create or replace function can_manage_media() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() in ('super_admin', 'admin', 'regional_editor', 'editor', 'media_manager'), false)
$$;

-- ───────────────────────── Geography tables ─────────────────────────
create type admin_area_kind as enum ('metropolitan', 'municipal', 'district');

create table regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  country_code char(2) not null default 'GH',
  summary text,
  is_active boolean not null default true,
  source text, source_url text, verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table administrative_areas (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references regions (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind admin_area_kind not null,
  capital_name text,
  summary text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  cover_media_id uuid references media (id) on delete set null,
  is_active boolean not null default true,
  source text, source_url text, verified_at timestamptz,   -- where the name/kind came from
  seo_title text, seo_description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index admin_areas_region_idx on administrative_areas (region_id);

create table traditional_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  content_verified boolean not null default false,
  sources text,
  last_verified_at timestamptz, verification_notes text,
  status content_status not null default 'draft',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  administrative_area_id uuid not null references administrative_areas (id) on delete restrict,
  summary text,
  description text,
  directions text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  cover_media_id uuid references media (id) on delete set null,
  content_verified boolean not null default false,
  sources text,
  last_verified_at timestamptz, verification_notes text,
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
create index destinations_area_idx on destinations (administrative_area_id);

-- Communities and localities (declared after destinations for readability).
alter table communities add column administrative_area_id uuid references administrative_areas (id) on delete restrict;
create index communities_area_idx on communities (administrative_area_id);

create table community_traditional_areas (
  community_id uuid not null references communities (id) on delete cascade,
  traditional_area_id uuid not null references traditional_areas (id) on delete cascade,
  primary key (community_id, traditional_area_id)
);

create table localities (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, slug)
);

-- ───────────────────────── Links on existing content ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['attractions', 'listings', 'events', 'experiences'] loop
    execute format('alter table %I add column administrative_area_id uuid references administrative_areas (id) on delete restrict', t);
    execute format('alter table %I add column destination_id uuid references destinations (id) on delete set null', t);
    execute format('create index %I on %I (administrative_area_id)', t || '_area_idx', t);
    execute format('create index %I on %I (destination_id)', t || '_dest_idx', t);
  end loop;
  foreach t in array array['communities', 'attractions', 'listings', 'events', 'experiences'] loop
    execute format('alter table %I add column last_verified_at timestamptz', t);
    execute format('alter table %I add column verification_notes text', t);
  end loop;
end $$;
alter table articles add column destination_id uuid references destinations (id) on delete set null;
create index articles_dest_idx on articles (destination_id);

-- Fill the area from the community, then the destination, when the editor left it blank.
create or replace function derive_administrative_area() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new);
begin
  if new.administrative_area_id is null and (j ->> 'community_id') is not null then
    select administrative_area_id into new.administrative_area_id
      from communities where id = (j ->> 'community_id')::uuid;
  end if;
  if new.administrative_area_id is null and (j ->> 'destination_id') is not null then
    select administrative_area_id into new.administrative_area_id
      from destinations where id = (j ->> 'destination_id')::uuid;
  end if;
  return new;
end $$;

-- Publish guard: nothing is published without an active administrative area.
create or replace function guard_publish_requires_area() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and not exists (
    select 1 from administrative_areas a join regions r on r.id = a.region_id
    where a.id = new.administrative_area_id and a.is_active and r.is_active
  ) then
    raise exception 'Content cannot be published without an active administrative area (district, municipality or metropolis)';
  end if;
  return new;
end $$;

-- Editorial workflow: only approvers move content to approved or published.
-- auth.uid() is null for migrations, the service role and direct database sessions,
-- which are not end users; end users are always subject to the rule.
create or replace function guard_editorial_workflow() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed boolean;
begin
  changed := (tg_op = 'INSERT') or (new.status is distinct from old.status);
  if changed and new.status in ('approved', 'published') and auth.uid() is not null and not can_approve() then
    raise exception 'Only regional editors and administrators can approve or publish content';
  end if;
  return new;
end $$;

-- Verification flags on content: approvers only.
create or replace function guard_content_verification() returns trigger
language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb := to_jsonb(new);
begin
  if auth.uid() is null or can_approve() then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce((n ->> 'content_verified')::boolean, false) or n ->> 'last_verified_at' is not null
       or coalesce((n ->> 'provider_verified')::boolean, false) then
      raise exception 'Only regional editors and administrators can mark content as verified';
    end if;
  else
    o := to_jsonb(old);
    if (n -> 'content_verified') is distinct from (o -> 'content_verified')
       or (n -> 'last_verified_at') is distinct from (o -> 'last_verified_at')
       or (n -> 'provider_verified') is distinct from (o -> 'provider_verified') then
      raise exception 'Only regional editors and administrators can change verification';
    end if;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['communities', 'attractions', 'listings', 'events', 'experiences'] loop
    execute format('create trigger tg_a_derive_area before insert or update on %I for each row execute function derive_administrative_area()', t);
    execute format('create trigger tg_b_publish_area before insert or update on %I for each row execute function guard_publish_requires_area()', t);
  end loop;
  -- Destinations always carry their area already.
  create trigger tg_b_publish_area before insert or update on destinations
    for each row execute function guard_publish_requires_area();

  foreach t in array array['communities', 'attractions', 'listings', 'events', 'experiences', 'articles', 'pages',
                           'destinations', 'traditional_areas'] loop
    execute format('create trigger tg_c_workflow before insert or update on %I for each row execute function guard_editorial_workflow()', t);
  end loop;
  foreach t in array array['communities', 'attractions', 'experiences', 'events', 'destinations', 'traditional_areas'] loop
    execute format('create trigger tg_d_verification before insert or update on %I for each row execute function guard_content_verification()', t);
  end loop;
end $$;
-- listings: keep the existing admin-only guard (is_verified etc.) and add the verification-note guard.
create trigger tg_d_verification before insert or update on listings
  for each row execute function guard_content_verification();

-- updated_at + audit on the new tables
do $$
declare t text;
begin
  foreach t in array array['regions', 'administrative_areas', 'traditional_areas', 'destinations', 'localities'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger audit_row after insert or update or delete on %I for each row execute function audit_row()', t);
  end loop;
end $$;

-- ───────────────────────── Revision history ─────────────────────────
-- Staff-readable history of the previous version of a row, so editors can see
-- what changed and who changed it. (audit_logs remains administrator-only.)
create table content_revisions (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  snapshot jsonb not null,              -- the row as it was before this change
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index content_revisions_lookup_idx on content_revisions (table_name, record_id, created_at desc);

create or replace function record_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare o jsonb := to_jsonb(old); n jsonb := to_jsonb(new);
begin
  -- Ignore changes that only touch updated_at.
  if (o - 'updated_at') is distinct from (n - 'updated_at') then
    insert into content_revisions (table_name, record_id, snapshot, changed_by)
    values (tg_table_name, coalesce(o ->> 'id', o ->> 'slug'), o, auth.uid());
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['communities', 'attractions', 'listings', 'experiences', 'events', 'articles', 'pages',
                           'destinations', 'traditional_areas'] loop
    execute format('create trigger tg_e_revision before update on %I for each row execute function record_revision()', t);
  end loop;
end $$;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table regions                      enable row level security;
alter table administrative_areas         enable row level security;
alter table traditional_areas            enable row level security;
alter table destinations                 enable row level security;
alter table localities                   enable row level security;
alter table community_traditional_areas  enable row level security;
alter table content_revisions            enable row level security;

create policy regions_read on regions for select using (is_active or is_staff());
create policy regions_write on regions for all using (can_manage_geography()) with check (can_manage_geography());
create policy areas_read on administrative_areas for select using (is_active or is_staff());
create policy areas_write on administrative_areas for all using (can_manage_geography()) with check (can_manage_geography());

create policy trad_public_read on traditional_areas for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy trad_staff_insert on traditional_areas for insert with check (is_staff());
create policy trad_staff_update on traditional_areas for update using (is_staff()) with check (is_staff());
create policy trad_admin_delete on traditional_areas for delete using (is_admin());

create policy dest_public_read on destinations for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy dest_staff_insert on destinations for insert with check (is_staff());
create policy dest_staff_update on destinations for update using (is_staff()) with check (is_staff());
create policy dest_admin_delete on destinations for delete using (is_admin());

create policy localities_read on localities for select using (
  exists (select 1 from communities c where c.id = community_id
          and ((c.status = 'published' and c.deleted_at is null) or is_staff())));
create policy localities_write on localities for all using (is_staff()) with check (is_staff());

create policy cta_read on community_traditional_areas for select using (
  exists (select 1 from communities c where c.id = community_id and c.status = 'published' and c.deleted_at is null)
  and exists (select 1 from traditional_areas t where t.id = traditional_area_id and t.status = 'published' and t.deleted_at is null)
  or is_staff());
create policy cta_write on community_traditional_areas for all using (is_staff()) with check (is_staff());

create policy revisions_staff_read on content_revisions for select using (is_staff());

-- Media managers: media library and its storage objects only.
drop policy media_staff_insert on media;
drop policy media_staff_update on media;
create policy media_staff_insert on media for insert with check (can_manage_media());
create policy media_staff_update on media for update using (can_manage_media()) with check (can_manage_media());
drop policy media_objects_staff_insert on storage.objects;
drop policy media_objects_staff_update on storage.objects;
create policy media_objects_staff_insert on storage.objects for insert with check (bucket_id = 'media' and can_manage_media());
create policy media_objects_staff_update on storage.objects for update using (bucket_id = 'media' and can_manage_media());

-- Table privileges: nothing can be written by anon; revisions are never directly writable.
revoke all on content_revisions from anon, authenticated;
grant select on content_revisions to authenticated;
