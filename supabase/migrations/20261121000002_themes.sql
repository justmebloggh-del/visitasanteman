-- Themes: experience themes (Eat, Wear, See, Feel) and tour categories (Nature, Culture, Lifestyle, Heritage), attachable to
-- attractions, listings, experiences, events and articles. Only the eight names are seeded: descriptions are written by an
-- administrator, not by the development team.
create type theme_kind as enum ('experience_theme', 'tour_category');

create table themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind theme_kind not null,
  summary text,
  cover_media_id uuid references media (id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on themes for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on themes for each row execute function audit_row();

create table theme_links (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references themes (id) on delete cascade,
  entity_type text not null check (entity_type in ('attraction', 'listing', 'experience', 'event', 'article')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (theme_id, entity_type, entity_id)
);
create index theme_links_entity_idx on theme_links (entity_type, entity_id);

-- The target must exist (a polymorphic link cannot use a foreign key).
create or replace function check_theme_link_entity() returns trigger
language plpgsql security definer set search_path = public as $$
declare tbl text; found_row boolean;
begin
  tbl := case new.entity_type when 'attraction' then 'attractions' when 'listing' then 'listings' when 'experience' then 'experiences'
                              when 'event' then 'events' when 'article' then 'articles' end;
  execute format('select exists (select 1 from %I where id = $1)', tbl) into found_row using new.entity_id;
  if not found_row then raise exception 'No such % to attach a theme to', new.entity_type; end if;
  return new;
end $$;
create trigger tg_theme_link_entity before insert or update on theme_links for each row execute function check_theme_link_entity();

alter table themes enable row level security;
alter table theme_links enable row level security;
create policy themes_public_read on themes for select using (is_active or is_staff());
create policy themes_admin_write on themes for all using (is_admin()) with check (is_admin());
create policy theme_links_public_read on theme_links for select using (true);     -- ids only; the items themselves are filtered by their own RLS
create policy theme_links_staff_write on theme_links for all using (is_staff()) with check (is_staff());

insert into themes (slug, name, kind, sort_order) values
  ('eat', 'Eat', 'experience_theme', 1), ('wear', 'Wear', 'experience_theme', 2), ('see', 'See', 'experience_theme', 3), ('feel', 'Feel', 'experience_theme', 4),
  ('nature', 'Nature', 'tour_category', 5), ('culture', 'Culture', 'tour_category', 6), ('lifestyle', 'Lifestyle', 'tour_category', 7), ('heritage', 'Heritage', 'tour_category', 8)
on conflict (slug) do nothing;

-- How many PUBLISHED items each theme has. Runs with the caller's rights, so unpublished items are never counted.
create or replace function theme_item_counts() returns table (slug text, items bigint)
language sql stable set search_path = public as $$
  select t.slug, count(x.*) from themes t
  left join (
    select l.theme_id from theme_links l join attractions a on l.entity_type = 'attraction' and a.id = l.entity_id and a.status = 'published' and a.deleted_at is null
    union all select l.theme_id from theme_links l join listings a on l.entity_type = 'listing' and a.id = l.entity_id and a.status = 'published' and a.deleted_at is null
    union all select l.theme_id from theme_links l join experiences a on l.entity_type = 'experience' and a.id = l.entity_id and a.status = 'published' and a.deleted_at is null
    union all select l.theme_id from theme_links l join events a on l.entity_type = 'event' and a.id = l.entity_id and a.status = 'published' and a.deleted_at is null
    union all select l.theme_id from theme_links l join articles a on l.entity_type = 'article' and a.id = l.entity_id and a.status = 'published' and a.deleted_at is null and a.published_at <= now()
  ) x on x.theme_id = t.id
  where t.is_active group by t.slug
$$;
grant execute on function theme_item_counts() to anon, authenticated;
