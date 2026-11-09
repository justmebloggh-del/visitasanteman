-- Phase 5: investment portal and advertising.

create type project_stage as enum ('operational', 'approved', 'proposed', 'under_consideration');

create table investment_opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  stage project_stage not null default 'proposed',
  -- A project may only be shown as approved or operational if the source is recorded.
  stage_source text,
  summary text,
  description text,
  proposed_location text,
  community_id uuid references communities (id) on delete set null,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  objectives text,
  commercial_opportunities text,
  investment_min numeric(14, 2) check (investment_min >= 0),
  investment_max numeric(14, 2) check (investment_max >= 0),
  investment_currency char(3) not null default 'GHS',
  investment_note text,                       -- where the estimate comes from; leave empty if no verified estimate
  environmental_considerations text,
  partnership_requirements text,
  images_are_conceptual boolean not null default true,
  cover_media_id uuid references media (id) on delete set null,
  is_featured boolean not null default false,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (stage not in ('operational', 'approved') or nullif(btrim(stage_source), '') is not null),
  check (investment_max is null or investment_min is null or investment_max >= investment_min),
  check ((investment_min is null and investment_max is null) or nullif(btrim(investment_note), '') is not null)
);
create index investments_status_idx on investment_opportunities (status, stage) where deleted_at is null;
create trigger set_updated_at before update on investment_opportunities for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on investment_opportunities for each row execute function audit_row();
alter table investment_opportunities enable row level security;
create policy investments_public_read on investment_opportunities for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy investments_staff_insert on investment_opportunities for insert with check (is_staff());
create policy investments_staff_update on investment_opportunities for update using (is_staff()) with check (is_staff());
create policy investments_admin_delete on investment_opportunities for delete using (is_admin());

-- Investor enquiries reuse the enquiries table (kind = 'investment') and point at the project.
alter table enquiries add column investment_id uuid references investment_opportunities (id) on delete set null;

-- ───────────── Advertising ─────────────
create type ad_placement as enum ('homepage_banner', 'directory_top');

create table advertisements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 120),
  advertiser_name text not null check (length(advertiser_name) between 1 and 120),
  placement ad_placement not null,
  headline text check (length(headline) <= 140),
  body text check (length(body) <= 300),
  link_url text not null check (link_url ~* '^https?://'),
  cover_media_id uuid references media (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status content_status not null default 'draft',           -- 'published' = active (inside its dates)
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_at > starts_at)
);
create index ads_active_idx on advertisements (placement, starts_at, ends_at) where status = 'published' and deleted_at is null;
create trigger set_updated_at before update on advertisements for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on advertisements for each row execute function audit_row();
alter table advertisements enable row level security;
-- Public sees only ads that are published AND inside their dates.
create policy ads_public_read on advertisements for select using (
  (status = 'published' and deleted_at is null and now() between starts_at and ends_at) or is_staff());
create policy ads_staff_insert on advertisements for insert with check (is_admin());
create policy ads_staff_update on advertisements for update using (is_admin()) with check (is_admin());
create policy ads_admin_delete on advertisements for delete using (is_admin());
-- Counters can only be changed through record_ad_event.
revoke update (impressions, clicks) on advertisements from authenticated, anon;

create or replace function record_ad_event(p_ad uuid, p_event text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_event not in ('impression', 'click') then raise exception 'Unknown event'; end if;
  update advertisements set
    impressions = impressions + (p_event = 'impression')::int,
    clicks = clicks + (p_event = 'click')::int
  where id = p_ad and status = 'published' and deleted_at is null and now() between starts_at and ends_at;
end $$;
revoke all on function record_ad_event(uuid, text) from public;
grant execute on function record_ad_event(uuid, text) to anon, authenticated;

insert into homepage_sections (key, title, subtitle, sort_order) values
  ('investment', 'Invest in Lake Bosomtwe', 'Opportunities and partnerships for sustainable tourism. Projects are labelled by their real status.', 12)
on conflict (key) do nothing;
