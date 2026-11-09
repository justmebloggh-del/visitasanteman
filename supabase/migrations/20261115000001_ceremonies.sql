-- VisitAsanteman Phase 3: traditional ceremonies, festivals and cultural occasions.
-- Rules built into the data model:
--  * a ceremony is NOT automatically a public event: attendance is classified, and
--  * nothing is published until the responsible traditional authority/organiser has approved the
--    public-facing information (authority_approved) and the facts are verified, and
--  * dates are not assumed: a date is shown only when date_confirmed is true.

create type ceremony_kind as enum ('ceremony', 'festival', 'durbar', 'performance', 'craft_demonstration', 'exhibition', 'other');
create type attendance_status as enum (
  'unknown',               -- not established
  'public',                -- the public may attend
  'public_with_conditions',-- the public may attend subject to stated conditions
  'by_invitation',         -- invited guests only
  'restricted'             -- sacred or private: not open to visitors
);

create table ceremonies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind ceremony_kind not null default 'ceremony',
  traditional_area_id uuid references traditional_areas (id) on delete set null,
  community_id uuid references communities (id) on delete set null,
  administrative_area_id uuid references administrative_areas (id) on delete restrict,
  organiser text,                 -- traditional authority or organiser
  summary text,
  significance text,              -- history and cultural meaning: verified text only
  starts_at timestamptz,
  ends_at timestamptz,
  date_confirmed boolean not null default false,   -- dates are announced per year; never assumed
  date_note text,                 -- e.g. how dates are announced
  attendance attendance_status not null default 'unknown',
  attendance_notes text,
  etiquette text,
  dress_guidance text,
  photography_rules text,
  contact_phone text,
  contact_email text,
  official_announcement_url text,
  authority_approved boolean not null default false,   -- the responsible authority approved public information
  verification_status verification_status not null default 'awaiting_verification',
  source_organisation text, source_url text, source_published_at date, researched_at date,
  reviewed_by uuid references auth.users (id) on delete set null,
  research_notes text,
  last_verified_at timestamptz, verification_notes text,
  cover_media_id uuid references media (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (not date_confirmed or starts_at is not null)
);
create index ceremonies_status_idx on ceremonies (status) where deleted_at is null;
create index ceremonies_start_idx on ceremonies (starts_at) where deleted_at is null;
create index ceremonies_area_idx on ceremonies (administrative_area_id);
create index ceremonies_trad_idx on ceremonies (traditional_area_id);

-- Only approvers record that the authority approved the public information.
-- Publishing needs that approval, a verified record and (checked elsewhere) a district.
create or replace function guard_ceremony() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not can_approve() then
    if tg_op = 'INSERT' and new.authority_approved then
      raise exception 'Only regional editors and administrators can record authority approval';
    end if;
    if tg_op = 'UPDATE' and new.authority_approved is distinct from old.authority_approved then
      raise exception 'Only regional editors and administrators can record authority approval';
    end if;
  end if;
  if new.status = 'published' and not new.authority_approved then
    raise exception 'The responsible traditional authority or organiser must approve the public information before a ceremony is published';
  end if;
  return new;
end $$;

create trigger tg_a_derive_area before insert or update on ceremonies for each row execute function derive_administrative_area();
create trigger tg_b_publish_area before insert or update on ceremonies for each row execute function guard_publish_requires_area();
create trigger tg_c_workflow before insert or update on ceremonies for each row execute function guard_editorial_workflow();
create trigger tg_f_research before insert or update on ceremonies for each row execute function guard_attraction_research();
create trigger tg_g_ceremony before insert or update on ceremonies for each row execute function guard_ceremony();
create trigger tg_e_revision before update on ceremonies for each row execute function record_revision();
create trigger set_updated_at before update on ceremonies for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on ceremonies for each row execute function audit_row();

alter table ceremonies enable row level security;
create policy ceremonies_public_read on ceremonies for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy ceremonies_staff_insert on ceremonies for insert with check (is_staff());
create policy ceremonies_staff_update on ceremonies for update using (is_staff()) with check (is_staff());
create policy ceremonies_admin_delete on ceremonies for delete using (is_admin());

insert into homepage_sections (key, title, subtitle, sort_order) values
  ('ceremonies', 'Ceremonies and festivals', 'Confirmed dates for ceremonies and festivals open to visitors. Dates are checked with the organisers each year.', 5)
on conflict (key) do nothing;
