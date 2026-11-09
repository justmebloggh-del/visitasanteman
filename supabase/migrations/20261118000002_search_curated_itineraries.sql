-- VisitAsanteman Phase 6: site-wide search, experience details, curated itineraries.

alter table experiences
  add column min_age int check (min_age >= 0 and min_age <= 120),
  add column price_on_request boolean not null default false;   -- "price on request" instead of a number

-- ───────────── Site-wide search ─────────────
-- Runs with the caller's rights (security invoker), so row level security applies: anonymous visitors only ever
-- get published records. Matching: whole words (full-text) and partial names; alternative spellings are searched.
create or replace function search_site(p_q text, p_kinds text[] default null, p_area text default null, p_limit int default 20, p_offset int default 0)
returns table (kind text, id uuid, slug text, title text, summary text, href text, area_name text, area_slug text, rank real, total bigint)
language sql stable set search_path = public as $$
  with q as (
    select btrim(left(coalesce(p_q, ''), 80)) as raw,
           '%' || replace(replace(replace(btrim(left(coalesce(p_q, ''), 80)), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat
  ),
  docs as (
    select 'attraction'::text as kind, a.id, a.slug, a.name as title, a.summary, '/attractions/' || a.slug as href, a.administrative_area_id as area_id,
           a.name || ' ' || coalesce(array_to_string(a.alt_names, ' '), '') || ' ' || coalesce(a.summary, '') as hay
      from attractions a where a.status = 'published' and a.deleted_at is null
    union all select 'community', c.id, c.slug, c.name, c.summary, '/communities/' || c.slug, c.administrative_area_id,
           c.name || ' ' || coalesce(array_to_string(c.alt_names, ' '), '') || ' ' || coalesce(c.summary, '') from communities c where c.status = 'published' and c.deleted_at is null
    union all select 'destination', d.id, d.slug, d.name, d.summary, '/destinations/' || d.slug, d.administrative_area_id, d.name || ' ' || coalesce(d.summary, '')
      from destinations d where d.status = 'published' and d.deleted_at is null
    union all select 'district', z.id, z.slug, z.name, z.summary, '/districts/' || z.slug, z.id,
           z.name || ' ' || coalesce(array_to_string(z.alt_names, ' '), '') || ' ' || coalesce(z.summary, '') from administrative_areas z where z.is_active
    union all select case when l.type in ('hotel','resort','guesthouse','lodge','eco_lodge','boutique_hotel','homestay','holiday_home','apartment') then 'accommodation'
                          when l.type in ('restaurant','cafe','bakery','food_vendor','caterer') then 'restaurant'
                          when l.type in ('conference_centre','event_venue','wedding_venue') then 'venue'
                          when l.type in ('market','shopping_centre') then 'market' else 'business' end,
           l.id, l.slug, l.name, l.summary,
           '/' || (case when l.type in ('hotel','resort','guesthouse','lodge','eco_lodge','boutique_hotel','homestay','holiday_home','apartment') then 'accommodation'
                        when l.type in ('restaurant','cafe','bakery','food_vendor','caterer') then 'restaurants'
                        when l.type in ('conference_centre','event_venue','wedding_venue') then 'venues'
                        when l.type in ('market','shopping_centre') then 'markets' else 'business' end) || '/' || l.slug,
           l.administrative_area_id, l.name || ' ' || coalesce(l.summary, '') || ' ' || coalesce(array_to_string(l.cuisines, ' '), '')
      from listings l where l.status = 'published' and l.deleted_at is null
    union all select 'experience', e.id, e.slug, e.title, e.summary, '/experiences/' || e.slug, e.administrative_area_id, e.title || ' ' || coalesce(e.summary, '')
      from experiences e where e.status = 'published' and e.deleted_at is null
    union all select 'event', v.id, v.slug, v.title, v.summary, '/events/' || v.slug, v.administrative_area_id, v.title || ' ' || coalesce(v.summary, '')
      from events v where v.status = 'published' and v.deleted_at is null
    union all select 'ceremony', y.id, y.slug, y.name, y.summary, '/culture/ceremonies/' || y.slug, y.administrative_area_id, y.name || ' ' || coalesce(y.summary, '')
      from ceremonies y where y.status = 'published' and y.deleted_at is null
    union all select 'institution', i.id, i.slug, i.name, i.summary, '/education/' || i.slug, i.administrative_area_id, i.name || ' ' || coalesce(i.summary, '')
      from institutions i where i.status = 'published' and i.deleted_at is null
    union all select 'sports', s.id, s.slug, s.name, s.summary, '/sports/' || s.slug, s.administrative_area_id, s.name || ' ' || coalesce(s.summary, '') || ' ' || coalesce(array_to_string(s.sports, ' '), '')
      from sports_venues s where s.status = 'published' and s.deleted_at is null
    union all select 'club', k.id, k.slug, k.name, k.summary, '/sports/clubs/' || k.slug, k.administrative_area_id, k.name || ' ' || coalesce(k.summary, '') || ' ' || coalesce(k.sport, '')
      from sports_clubs k where k.status = 'published' and k.deleted_at is null
    union all select 'transport', t.id, t.slug, t.name, t.summary, '/transport/' || t.slug, t.administrative_area_id, t.name || ' ' || coalesce(t.summary, '')
      from transport_providers t where t.status = 'published' and t.deleted_at is null
    union all select 'article', r.id, r.slug, r.title, r.excerpt, '/articles/' || r.slug, null::uuid, r.title || ' ' || coalesce(r.excerpt, '')
      from articles r where r.status = 'published' and r.deleted_at is null and r.published_at <= now()
  ),
  hits as (
    select d.*, z.name as area_name, z.slug as area_slug,
           (case when lower(d.title) = lower(q.raw) then 3.0 when d.title ilike substr(q.pat, 2) then 2.0 when d.title ilike q.pat then 1.5 else 0 end)
             + ts_rank(to_tsvector('simple', d.hay), websearch_to_tsquery('simple', q.raw)) as score
      from docs d cross join q
      left join administrative_areas z on z.id = d.area_id
     where q.raw <> ''
       and (to_tsvector('simple', d.hay) @@ websearch_to_tsquery('simple', q.raw) or d.hay ilike q.pat)
       and (p_kinds is null or d.kind = any (p_kinds))
       and (p_area is null or z.slug = p_area)
  )
  select h.kind, h.id, h.slug, h.title, h.summary, h.href, h.area_name, h.area_slug, h.score::real, count(*) over () as total
    from hits h order by h.score desc, h.title limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0)
$$;
grant execute on function search_site(text, text[], text, int, int) to anon, authenticated;

-- ───────────── Curated itineraries ─────────────
-- A staff member builds a plan in the travel planner, then publishes it as a curated itinerary. The public sees a
-- read-only copy (only items that are still published are resolved) and can copy it into their own plan.
create table curated_itineraries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  theme text,
  summary text,
  itinerary_id uuid unique references travel_itineraries (id) on delete set null,
  cover_media_id uuid references media (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text, seo_description text, focus_keywords text,
  canonical_url text, og_media_id uuid references media (id) on delete set null,
  noindex boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status <> 'published' or itinerary_id is not null)
);
create trigger tg_c_workflow before insert or update on curated_itineraries for each row execute function guard_editorial_workflow();
create trigger tg_e_revision before update on curated_itineraries for each row execute function record_revision();
create trigger set_updated_at before update on curated_itineraries for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on curated_itineraries for each row execute function audit_row();
alter table curated_itineraries enable row level security;
create policy curated_public_read on curated_itineraries for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy curated_staff_insert on curated_itineraries for insert with check (is_staff());
create policy curated_staff_update on curated_itineraries for update using (is_staff()) with check (is_staff());
create policy curated_admin_delete on curated_itineraries for delete using (is_admin());

-- Staff turn one of their own plans into a (draft) curated itinerary. Sharing is switched on because the public view
-- reads the plan through its share token.
create or replace function make_curated_itinerary(p_itinerary uuid, p_title text, p_summary text, p_theme text, p_attach uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare t travel_itineraries%rowtype; base text; s text; n int := 1; new_id uuid;
begin
  if not is_staff() then raise exception 'Only staff can publish curated itineraries'; end if;
  select * into t from travel_itineraries where id = p_itinerary and user_id = auth.uid();
  if not found then raise exception 'Plan not found'; end if;
  p_title := btrim(coalesce(p_title, '')); if p_title = '' or length(p_title) > 150 then raise exception 'Enter a title (up to 150 characters)'; end if;
  if t.share_token is null then
    update travel_itineraries set share_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') where id = t.id;
  end if;
  if p_attach is not null then
    -- attach the plan to an existing draft placeholder (it must not have a plan yet)
    update curated_itineraries set itinerary_id = t.id, title = p_title, summary = coalesce(nullif(btrim(coalesce(p_summary, '')), ''), summary),
           theme = coalesce(nullif(btrim(coalesce(p_theme, '')), ''), theme)
     where id = p_attach and itinerary_id is null and status = 'draft' and deleted_at is null returning id into new_id;
    if new_id is null then raise exception 'That draft is not available'; end if;
    return new_id;
  end if;
  base := trim(both '-' from regexp_replace(lower(p_title), '[^a-z0-9]+', '-', 'g')); if base = '' then base := 'itinerary'; end if;
  s := base;
  while exists (select 1 from curated_itineraries where slug = s) loop n := n + 1; s := base || '-' || n; end loop;
  insert into curated_itineraries (slug, title, summary, theme, itinerary_id, created_by)
  values (s, p_title, nullif(btrim(coalesce(p_summary, '')), ''), nullif(btrim(coalesce(p_theme, '')), ''), t.id, auth.uid()) returning id into new_id;
  return new_id;
end $$;
revoke all on function make_curated_itinerary(uuid, text, text, text, uuid) from public, anon;
grant execute on function make_curated_itinerary(uuid, text, text, text, uuid) to authenticated;

create or replace function curated_itinerary_view(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c curated_itineraries%rowtype; tok text; plan jsonb;
begin
  select * into c from curated_itineraries where slug = p_slug and status = 'published' and deleted_at is null;
  if not found or c.itinerary_id is null then return null; end if;
  select share_token into tok from travel_itineraries where id = c.itinerary_id;
  if tok is null then return null; end if;
  plan := itinerary_view(null, tok);
  if plan is null then return null; end if;
  return jsonb_build_object('title', c.title, 'summary', c.summary, 'theme', c.theme, 'plan', plan);
end $$;
revoke all on function curated_itinerary_view(text) from public;
grant execute on function curated_itinerary_view(text) to anon, authenticated;

create or replace function copy_curated_itinerary(p_slug text) returns uuid
language plpgsql security definer set search_path = public as $$
declare c curated_itineraries%rowtype; t travel_itineraries%rowtype; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to copy an itinerary'; end if;
  select * into c from curated_itineraries where slug = p_slug and status = 'published' and deleted_at is null;
  if not found or c.itinerary_id is null then raise exception 'Itinerary not found'; end if;
  select * into t from travel_itineraries where id = c.itinerary_id;
  insert into travel_itineraries (user_id, title, days, travellers, interests, notes)
  values (auth.uid(), left(c.title, 120), t.days, t.travellers, t.interests, t.notes) returning id into new_id;
  -- only items that are still published are copied
  insert into itinerary_items (itinerary_id, day, sort_order, item_type, item_id, custom_title, note)
  select new_id, i.day, i.sort_order, i.item_type, i.item_id, i.custom_title, i.note from itinerary_items i
   where i.itinerary_id = t.id and (i.item_type = 'custom'
     or (i.item_type = 'attraction' and exists (select 1 from attractions a where a.id = i.item_id and a.status = 'published' and a.deleted_at is null))
     or (i.item_type = 'listing' and exists (select 1 from listings a where a.id = i.item_id and a.status = 'published' and a.deleted_at is null))
     or (i.item_type = 'experience' and exists (select 1 from experiences a where a.id = i.item_id and a.status = 'published' and a.deleted_at is null))
     or (i.item_type = 'event' and exists (select 1 from events a where a.id = i.item_id and a.status = 'published' and a.deleted_at is null))
     or (i.item_type = 'community' and exists (select 1 from communities a where a.id = i.item_id and a.status = 'published' and a.deleted_at is null)));
  return new_id;
end $$;
revoke all on function copy_curated_itinerary(text) from public, anon;
grant execute on function copy_curated_itinerary(text) to authenticated;

-- Itinerary ideas from the project brief: TITLES ONLY, as empty drafts. They have no places yet; editors build each
-- from published, verified records, and routes and times must be checked by a person.
insert into curated_itineraries (slug, title, theme) values
  ('one-day-kumasi-cultural-tour', 'One-day Kumasi cultural tour', 'Culture'),
  ('two-day-asante-heritage-experience', 'Two-day Asante heritage experience', 'Heritage'),
  ('three-day-ashanti-discovery-tour', 'Three-day Ashanti discovery tour', 'Discovery'),
  ('lake-bosomtwe-weekend', 'Lake Bosomtwe weekend', 'Nature'),
  ('family-holiday-in-ashanti', 'Family holiday in Ashanti', 'Family'),
  ('nature-and-waterfall-exploration', 'Nature and waterfall exploration', 'Nature'),
  ('kente-and-adinkra-cultural-experience', 'Kente and Adinkra cultural experience', 'Crafts'),
  ('sports-and-entertainment-weekend', 'Sports and entertainment weekend', 'Sports'),
  ('educational-heritage-excursion', 'Educational heritage excursion', 'Education')
on conflict (slug) do nothing;
