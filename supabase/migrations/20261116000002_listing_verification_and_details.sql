-- VisitAsanteman Phase 4: business verification workflow, search details, research tracking, and
-- awareness of the new listing types in booking and planner functions.

create type price_range as enum ('budget', 'mid_range', 'upscale');
create type partner_verification as enum ('pending', 'verified', 'rejected', 'suspended');

alter table listings
  add column price_range price_range,
  add column capacity int check (capacity > 0),            -- guests, seats or visitors, as stated by the business
  add column accessibility text,
  add column booking_method text,                          -- how to book or enquire
  add column verification_decision partner_verification not null default 'pending',
  add column verification_requested_at timestamptz,
  add column verification_reason text,                     -- shown to the owner when rejected or suspended
  add column source_organisation text,
  add column source_url text,
  add column source_published_at date,
  add column researched_at date,
  add column research_notes text;                          -- internal

-- Existing verified listings keep their state.
update listings set verification_decision = 'verified' where is_verified;
create index listings_verification_idx on listings (verification_decision, verification_requested_at);

-- Keep the badge (is_verified) and the decision consistent, whichever one an administrator edits.
create or replace function sync_listing_verification() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.is_verified then new.verification_decision := 'verified'; end if;
    if new.verification_decision = 'verified' then new.is_verified := true; new.verified_at := coalesce(new.verified_at, now()); end if;
    return new;
  end if;
  if new.verification_decision is distinct from old.verification_decision then
    new.is_verified := (new.verification_decision = 'verified');
    new.verified_at := case when new.is_verified then now() else null end;
  elsif new.is_verified is distinct from old.is_verified then
    new.verification_decision := case when new.is_verified then 'verified' when old.verification_decision = 'verified' then 'pending' else new.verification_decision end;
    new.verified_at := case when new.is_verified then coalesce(new.verified_at, now()) else null end;
  end if;
  return new;
end $$;
create trigger tg_h_verification_sync before insert or update on listings for each row execute function sync_listing_verification();

create or replace function request_verification(p_listing uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing and owner_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'Listing not found'; end if;
  if l.verification_decision = 'suspended' then raise exception 'This listing is suspended. Contact the team.'; end if;
  if l.verification_decision = 'verified' then raise exception 'This listing is already verified'; end if;
  perform set_config('vasa.verification_request', 'on', true);
  update listings set verification_requested_at = now(), verification_decision = 'pending' where id = p_listing;
  perform set_config('vasa.verification_request', 'off', true);   -- the allowance covers this one update only
end $$;
revoke all on function request_verification(uuid) from public, anon;
grant execute on function request_verification(uuid) to authenticated;
-- Only administrators decide verification; owners may only ask, and only through request_verification above.
create or replace function guard_listing_privileged_fields() returns trigger
language plpgsql security definer set search_path = public as $$
declare via_request boolean := coalesce(current_setting('vasa.verification_request', true), '') = 'on';
begin
  if not is_admin() and not via_request and (
       new.is_verified is distinct from old.is_verified
    or new.verified_at is distinct from old.verified_at
    or new.is_featured is distinct from old.is_featured
    or new.owner_id is distinct from old.owner_id
    or new.plan_id is distinct from old.plan_id
    or new.verification_decision is distinct from old.verification_decision
    or new.verification_reason is distinct from old.verification_reason
    or new.verification_requested_at is distinct from old.verification_requested_at
  ) then
    raise exception 'Only administrators can change verification, featured, plan or owner fields';
  end if;
  return new;
end $$;

-- Make the earlier booking and planner functions aware of the new listing types.
do $$
declare fn text; def text; orig text;
begin
  foreach fn in array array['create_booking', 'itinerary_view', 'nearby_places'] loop
    select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn limit 1;
    orig := def;
    def := replace(def, '''eco_lodge'', ''holiday_home''', '''eco_lodge'', ''boutique_hotel'', ''homestay'', ''holiday_home''');
    def := replace(def, '''eco_lodge'',''holiday_home''', '''eco_lodge'',''boutique_hotel'',''homestay'',''holiday_home''');
    def := replace(def, 'when l.type = ''restaurant'' then ''restaurants'' else ''business'' end',
      'when l.type in (''restaurant'',''cafe'',''bakery'',''food_vendor'',''caterer'') then ''restaurants'' when l.type in (''market'',''shopping_centre'') then ''markets'' when l.type in (''conference_centre'',''event_venue'',''wedding_venue'') then ''venues'' else ''business'' end');
    def := replace(def, 'when l.type = ''restaurant'' then ''restaurant'' else ''business'' end',
      'when l.type in (''restaurant'',''cafe'',''bakery'',''food_vendor'',''caterer'') then ''restaurant'' else ''business'' end');
    def := replace(def, 'and type = ''restaurant'';', 'and type in (''restaurant'', ''cafe'');');   -- table requests: restaurants and cafés
    if def = orig then raise exception 'function % was not changed; check the patterns', fn; end if;
    execute def;
  end loop;
end $$;

-- Researched market records: UNPUBLISHED drafts from the project owner's research summary, which cites the
-- Ashanti Regional Coordinating Council's Regional Profile 2023. Not checked against that document (it could not be
-- reached). No description, address, coordinates, hours or contacts are entered. A district is linked only where the
-- market's town matches a district name in the (itself unverified) working district list.
insert into listings (slug, type, name, status, administrative_area_id, source_organisation, source_url, research_notes)
select v.slug, 'market', v.name, 'draft', (select id from administrative_areas where slug = v.area),
       'Ashanti Regional Coordinating Council, Regional Profile 2023 (as summarised by the project owner; not yet checked against the document)',
       'https://arcc.gov.gh/wp-content/uploads/2024/04/REGIONAL-PROFILE-ASHANTI-pdf.pdf', v.note
from (values
  ('kumasi-central-market-kejetia', 'Kumasi Central Market (Kejetia)', 'kumasi', 'Confirm the exact name used officially, location, trading days and what visitors should know.'),
  ('mampong-market', 'Mampong Market', 'mampong', 'Confirm which Mampong district this is, location and market days.'),
  ('tepa-market', 'Tepa Market', null, 'Confirm the district, location and market days.'),
  ('ejura-sekyedumase-market', 'Ejura-Sekyedumase Market', 'ejura-sekyedumase', 'Confirm location, market days and main trading categories.'),
  ('fumso-market', 'Fumso Market', null, 'Confirm the district, location and market days.')
) as v(slug, name, area, note)
on conflict (slug) do nothing;
