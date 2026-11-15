-- Phase 4 (first part): award programmes with public nominations, and free event registration with a capacity limit.
-- Payments, ticketing, exhibitors and sponsors are NOT part of this migration.
-- Governance is built in: nominations are reviewed by staff, only shortlisted nominees become public, and the programme
-- page always states that sponsorship or payment never guarantees a nomination or an award.

-- ───────────────────────── Award programmes ─────────────────────────
create table if not exists award_programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  year int check (year between 2000 and 2100),
  summary text,
  description text,
  categories text[] not null default '{}',
  eligibility text,
  judging_criteria text,
  judging_process text,
  nominations_open boolean not null default false,
  nominations_close_at timestamptz,
  cover_media_id uuid references media (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table award_programmes enable row level security;
drop policy if exists award_programmes_public_read on award_programmes;
create policy award_programmes_public_read on award_programmes for select
  using ((status = 'published' and deleted_at is null) or is_staff());
drop policy if exists award_programmes_staff_insert on award_programmes;
create policy award_programmes_staff_insert on award_programmes for insert with check (is_staff());
drop policy if exists award_programmes_staff_update on award_programmes;
create policy award_programmes_staff_update on award_programmes for update using (is_staff()) with check (is_staff());
drop policy if exists award_programmes_admin_delete on award_programmes;
create policy award_programmes_admin_delete on award_programmes for delete using (is_admin());

drop trigger if exists set_updated_at on award_programmes;
create trigger set_updated_at before update on award_programmes for each row execute function set_updated_at();
drop trigger if exists audit_row on award_programmes;
create trigger audit_row after insert or update or delete on award_programmes for each row execute function audit_row();
drop trigger if exists tg_c_workflow on award_programmes;
create trigger tg_c_workflow before insert or update on award_programmes for each row execute function guard_editorial_workflow();
drop trigger if exists tg_e_revision on award_programmes;
create trigger tg_e_revision before update on award_programmes for each row execute function record_revision();

-- ───────────────────────── Nominations ─────────────────────────
create table if not exists award_nominations (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references award_programmes (id) on delete cascade,
  category text not null check (length(category) between 1 and 150),
  nominee_name text not null check (length(nominee_name) between 1 and 150),
  nominee_organisation text check (length(nominee_organisation) <= 150),
  nominee_location text check (length(nominee_location) <= 150),
  reason text not null check (length(reason) between 30 and 3000),
  supporting_url text check (length(supporting_url) <= 500),
  nominator_name text not null check (length(nominator_name) between 1 and 120),
  nominator_email text not null check (length(nominator_email) between 3 and 254),
  nominator_phone text check (length(nominator_phone) <= 40),
  status text not null default 'new' check (status in ('new', 'under_review', 'eligible', 'shortlisted', 'not_eligible', 'withdrawn')),
  is_winner boolean not null default false,
  reviewer_notes text check (length(reviewer_notes) <= 2000),
  reviewed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists award_nominations_programme_idx on award_nominations (programme_id, status, created_at desc);

alter table award_nominations enable row level security;
revoke all on award_nominations from anon, authenticated;
grant insert on award_nominations to anon, authenticated;
grant select, update, delete on award_nominations to authenticated;

-- Anyone may nominate, only while the programme is published and open, and only into one of its own categories.
drop policy if exists award_nominations_insert on award_nominations;
create policy award_nominations_insert on award_nominations for insert
  with check (
    status = 'new' and is_winner = false and reviewer_notes is null and reviewed_by is null
    and exists (
      select 1 from award_programmes p
      where p.id = programme_id and p.status = 'published' and p.deleted_at is null and p.nominations_open
        and (p.nominations_close_at is null or p.nominations_close_at > now())
        and category = any (p.categories)
    )
  );
drop policy if exists award_nominations_staff_read on award_nominations;
create policy award_nominations_staff_read on award_nominations for select using (is_staff());
drop policy if exists award_nominations_staff_update on award_nominations;
create policy award_nominations_staff_update on award_nominations for update using (is_staff()) with check (is_staff());
drop policy if exists award_nominations_admin_delete on award_nominations;
create policy award_nominations_admin_delete on award_nominations for delete using (is_admin());

-- Only regional editors and administrators may shortlist or name winners; ordinary editors can review and triage.
create or replace function guard_nomination_publication() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not can_approve() then
    if new.is_winner is distinct from old.is_winner or (new.status = 'shortlisted' and old.status is distinct from 'shortlisted') then
      raise exception 'Only regional editors and administrators can shortlist nominees or name winners';
    end if;
  end if;
  if new.status is distinct from old.status or new.is_winner is distinct from old.is_winner or new.reviewer_notes is distinct from old.reviewer_notes then
    new.reviewed_by := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists tg_a_guard on award_nominations;
create trigger tg_a_guard before update on award_nominations for each row execute function guard_nomination_publication();
drop trigger if exists audit_row on award_nominations;
create trigger audit_row after update or delete on award_nominations for each row execute function audit_row();

-- Public window: only shortlisted nominees (and winners) of published programmes, with no nominator details.
create or replace view award_shortlist with (security_barrier = true) as
select n.id, n.programme_id, p.slug as programme_slug, n.category, n.nominee_name, n.nominee_organisation, n.nominee_location, n.is_winner
from award_nominations n
join award_programmes p on p.id = n.programme_id
where n.status = 'shortlisted' and p.status = 'published' and p.deleted_at is null;
grant select on award_shortlist to anon, authenticated;

-- ───────────────────────── Event registration (free, capacity-limited) ─────────────────────────
alter table events add column if not exists registration_enabled boolean not null default false;
alter table events add column if not exists capacity int check (capacity is null or capacity between 1 and 100000);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  phone text check (length(phone) <= 40),
  guests int not null default 1 check (guests between 1 and 10),
  notes text check (length(notes) <= 500),
  status text not null default 'registered' check (status in ('registered', 'attended', 'cancelled')),
  created_at timestamptz not null default now()
);
create unique index if not exists event_registrations_unique on event_registrations (event_id, lower(email)) where status <> 'cancelled';

alter table event_registrations enable row level security;
revoke all on event_registrations from anon, authenticated;
grant select, update, delete on event_registrations to authenticated;
drop policy if exists event_registrations_staff_read on event_registrations;
create policy event_registrations_staff_read on event_registrations for select using (is_staff());
drop policy if exists event_registrations_staff_update on event_registrations;
create policy event_registrations_staff_update on event_registrations for update using (is_staff()) with check (is_staff());
drop policy if exists event_registrations_admin_delete on event_registrations;
create policy event_registrations_admin_delete on event_registrations for delete using (is_admin());
drop trigger if exists audit_row on event_registrations;
create trigger audit_row after update or delete on event_registrations for each row execute function audit_row();

-- The only way for the public to register. Returns 'ok', 'full', 'closed' or 'duplicate'.
create or replace function register_for_event(p_event uuid, p_name text, p_email text, p_phone text, p_guests int, p_notes text)
returns text language plpgsql security definer set search_path = public as $$
declare e events%rowtype; taken int;
begin
  select * into e from events where id = p_event and status = 'published' and deleted_at is null for update;
  if not found or not e.registration_enabled or e.event_status <> 'scheduled' or coalesce(e.ends_at, e.starts_at) < now() then
    return 'closed';
  end if;
  if e.capacity is not null then
    select coalesce(sum(guests), 0) into taken from event_registrations where event_id = e.id and status <> 'cancelled';
    if taken + p_guests > e.capacity then return 'full'; end if;
  end if;
  begin
    insert into event_registrations (event_id, name, email, phone, guests, notes)
    values (e.id, left(trim(p_name), 120), left(lower(trim(p_email)), 254), nullif(left(trim(coalesce(p_phone, '')), 40), ''), p_guests, nullif(left(trim(coalesce(p_notes, '')), 500), ''));
  exception when unique_violation then
    return 'duplicate';
  end;
  return 'ok';
end $$;
revoke all on function register_for_event(uuid, text, text, text, int, text) from public;
grant execute on function register_for_event(uuid, text, text, text, int, text) to anon, authenticated;
