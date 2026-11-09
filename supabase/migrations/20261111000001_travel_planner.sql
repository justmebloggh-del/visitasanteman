-- Phase 4: travel planner, shared itineraries, nearby discovery.

create table travel_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  start_date date,
  days int not null default 1 check (days between 1 and 30),
  travellers int not null default 1 check (travellers between 1 and 100),
  interests text[] not null default '{}',
  notes text check (length(notes) <= 2000),
  share_token text unique check (share_token ~ '^[A-Za-z0-9_-]{22,64}$'),   -- null = private
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index itineraries_user_idx on travel_itineraries (user_id, updated_at desc);
create trigger set_updated_at before update on travel_itineraries for each row execute function set_updated_at();

create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references travel_itineraries (id) on delete cascade,
  day int not null check (day >= 1),
  sort_order int not null default 0,
  item_type text not null check (item_type in ('attraction', 'listing', 'experience', 'event', 'community', 'custom')),
  item_id uuid,
  custom_title text check (length(custom_title) <= 150),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  check ((item_type = 'custom' and custom_title is not null and item_id is null) or (item_type <> 'custom' and item_id is not null))
);
create index itinerary_items_idx on itinerary_items (itinerary_id, day, sort_order);

alter table travel_itineraries enable row level security;
alter table itinerary_items enable row level security;
create policy itineraries_owner_all on travel_itineraries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy itinerary_items_owner_all on itinerary_items for all
  using (exists (select 1 from travel_itineraries t where t.id = itinerary_id and t.user_id = auth.uid()))
  with check (exists (select 1 from travel_itineraries t where t.id = itinerary_id and t.user_id = auth.uid()));
revoke all on travel_itineraries, itinerary_items from anon;

-- Limits: at most 20 plans per user and 100 items per plan.
create or replace function enforce_itinerary_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from travel_itineraries where user_id = new.user_id) >= 20 then
    raise exception 'You can keep up to 20 plans. Delete one first.'; end if;
  return new;
end $$;
create or replace function enforce_item_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from itinerary_items where itinerary_id = new.itinerary_id) >= 100 then
    raise exception 'A plan can hold up to 100 items.'; end if;
  return new;
end $$;
create trigger planner_limit before insert on travel_itineraries for each row execute function enforce_itinerary_limit();
create trigger planner_limit before insert on itinerary_items for each row execute function enforce_item_limit();

-- One function resolves an itinerary for its owner OR a holder of the share token. Items are
-- resolved against PUBLISHED content only, so unpublished things never leak through a plan.
create or replace function itinerary_view(p_id uuid default null, p_token text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t travel_itineraries%rowtype;
begin
  if p_token is not null then
    select * into t from travel_itineraries where share_token = p_token;
  else
    select * into t from travel_itineraries where id = p_id and user_id = auth.uid();
  end if;
  if not found then return null; end if;
  return jsonb_build_object(
    'id', t.id, 'title', t.title, 'start_date', t.start_date, 'days', t.days, 'travellers', t.travellers,
    'interests', t.interests, 'notes', t.notes, 'shared', t.share_token is not null,
    'items', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.day, r.sort_order, r.created_at) from (
        select i.id, i.day, i.sort_order, i.item_type, i.item_id, i.note, i.created_at,
          case i.item_type when 'attraction' then a.name when 'listing' then l.name when 'experience' then e.title
                           when 'event' then ev.title when 'community' then c.name else i.custom_title end as title,
          case i.item_type when 'attraction' then '/attractions/' || a.slug
            when 'listing' then '/' || (case when l.type in ('hotel','resort','guesthouse','lodge','eco_lodge','holiday_home','apartment') then 'accommodation'
                                             when l.type = 'restaurant' then 'restaurants' else 'business' end) || '/' || l.slug
            when 'experience' then '/experiences/' || e.slug when 'event' then '/events/' || ev.slug
            when 'community' then '/communities/' || c.slug end as href,
          coalesce(a.latitude, l.latitude, e.latitude, ev.latitude, c.latitude) as lat,
          coalesce(a.longitude, l.longitude, e.longitude, ev.longitude, c.longitude) as lng,
          (i.item_type <> 'custom' and coalesce(a.id, l.id, e.id, ev.id, c.id) is null) as unavailable
        from itinerary_items i
        left join attractions a on i.item_type = 'attraction' and a.id = i.item_id and a.status = 'published' and a.deleted_at is null
        left join listings l on i.item_type = 'listing' and l.id = i.item_id and l.status = 'published' and l.deleted_at is null
        left join experiences e on i.item_type = 'experience' and e.id = i.item_id and e.status = 'published' and e.deleted_at is null
        left join events ev on i.item_type = 'event' and ev.id = i.item_id and ev.status = 'published' and ev.deleted_at is null
        left join communities c on i.item_type = 'community' and c.id = i.item_id and c.status = 'published' and c.deleted_at is null
        where i.itinerary_id = t.id) r), '[]'::jsonb));
end $$;
revoke all on function itinerary_view(uuid, text) from public;
grant execute on function itinerary_view(uuid, text) to anon, authenticated;

-- ───────────── Nearby places (great-circle distance) ─────────────
create or replace function nearby_places(p_lat double precision, p_lng double precision, p_radius_km double precision default 10,
                                         p_limit int default 8, p_exclude uuid default null)
returns table (kind text, id uuid, title text, href text, distance_km double precision)
language sql stable security definer set search_path = public as $$
  with pts as (
    select 'attraction'::text as kind, a.id, a.name as title, '/attractions/' || a.slug as href, a.latitude::double precision as lat, a.longitude::double precision as lng
      from attractions a where a.status = 'published' and a.deleted_at is null and a.latitude is not null
    union all
    select case when l.type in ('hotel','resort','guesthouse','lodge','eco_lodge','holiday_home','apartment') then 'accommodation' when l.type = 'restaurant' then 'restaurant' else 'business' end,
           l.id, l.name, '/' || (case when l.type in ('hotel','resort','guesthouse','lodge','eco_lodge','holiday_home','apartment') then 'accommodation' when l.type = 'restaurant' then 'restaurants' else 'business' end) || '/' || l.slug,
           l.latitude::double precision, l.longitude::double precision
      from listings l where l.status = 'published' and l.deleted_at is null and l.latitude is not null
    union all
    select 'experience', e.id, e.title, '/experiences/' || e.slug, e.latitude::double precision, e.longitude::double precision
      from experiences e where e.status = 'published' and e.deleted_at is null and e.latitude is not null
    union all
    select 'community', c.id, c.name, '/communities/' || c.slug, c.latitude::double precision, c.longitude::double precision
      from communities c where c.status = 'published' and c.deleted_at is null and c.latitude is not null)
  select kind, id, title, href, d from (
    select p.*, 6371 * 2 * asin(sqrt(least(1, power(sin(radians(p.lat - p_lat) / 2), 2)
           + cos(radians(p_lat)) * cos(radians(p.lat)) * power(sin(radians(p.lng - p_lng) / 2), 2)))) as d
    from pts p where p.id is distinct from p_exclude) x
  where d <= least(greatest(p_radius_km, 0.1), 100)
  order by d limit least(greatest(p_limit, 1), 20)
$$;
revoke all on function nearby_places(double precision, double precision, double precision, int, uuid) from public;
grant execute on function nearby_places(double precision, double precision, double precision, int, uuid) to anon, authenticated;
