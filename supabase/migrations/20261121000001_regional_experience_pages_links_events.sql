-- Regional experience features (inspired by the structure of other national tourism sites; all content is original).

-- ───────────── CMS pages: last verified date and public source ─────────────
alter table pages add column last_verified_at date, add column source_label text, add column source_url text;

-- Planned "Plan Your Visit" and policy pages. Empty drafts: the site shows "being prepared" until an administrator
-- writes and publishes them. No visa, health, safety, transport or legal facts are written here.
insert into pages (slug, title, status) values
  ('why-ashanti', 'Why Ashanti', 'draft'),
  ('getting-around', 'Getting Around Ashanti', 'draft'),
  ('travel-information', 'Travel Information', 'draft'),
  ('visa-and-entry', 'Visa and Entry', 'draft'),
  ('cookie-policy', 'Cookie Policy', 'draft')
on conflict (slug) do nothing;

-- ───────────── Homepage quick links ─────────────
create table quick_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 40),
  url text not null check (url ~ '^/[^/]' or url ~* '^https://'),
  icon text not null default 'compass' check (icon in ('car', 'info', 'file-text', 'calendar', 'map', 'compass', 'bed', 'utensils', 'camera', 'users', 'ticket', 'phone')),
  page_slug text references pages (slug) on delete set null,   -- if set, the link is hidden until that page is published
  sort_order int not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on quick_links for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on quick_links for each row execute function audit_row();
alter table quick_links enable row level security;
create policy quick_links_public_read on quick_links for select using (is_enabled or is_staff());
create policy quick_links_staff_write on quick_links for all using (is_staff()) with check (is_staff());

-- At most six links can be enabled at once.
create or replace function enforce_quick_link_limit() returns trigger language plpgsql as $$
begin
  if new.is_enabled and (select count(*) from quick_links where is_enabled and id <> new.id) >= 6 then
    raise exception 'At most six quick links can be enabled. Disable one first.';
  end if;
  return new;
end $$;
create trigger tg_quick_link_limit before insert or update on quick_links for each row execute function enforce_quick_link_limit();

insert into quick_links (label, url, icon, page_slug, sort_order) values
  ('Getting Around', '/getting-around', 'car', 'getting-around', 1),
  ('Travel Information', '/travel-information', 'info', 'travel-information', 2),
  ('Visa and Entry', '/visa-and-entry', 'file-text', 'visa-and-entry', 3),
  ('Events', '/events', 'calendar', null, 4),
  ('Map', '/map', 'map', null, 5),
  ('Plan Your Visit', '/travel-planner', 'compass', null, 6);

-- ───────────── Events: per-occurrence date verification ─────────────
-- Traditional and community events do not follow fixed calendar dates, so a date is shown as fact only when an
-- administrator has verified it for this occurrence; otherwise the site says "Date to be confirmed".
alter table events add column date_verified boolean not null default false;

-- ───────────── Attraction categories on the homepage ─────────────
alter table attraction_categories
  add column cover_media_id uuid references media (id) on delete set null,
  add column is_featured boolean not null default true;
