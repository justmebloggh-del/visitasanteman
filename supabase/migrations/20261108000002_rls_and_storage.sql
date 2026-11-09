-- Row Level Security. Default is deny; each policy below grants one thing.

alter table profiles               enable row level security;
alter table user_roles             enable row level security;
alter table media                  enable row level security;
alter table media_links            enable row level security;
alter table communities            enable row level security;
alter table attraction_categories  enable row level security;
alter table attractions            enable row level security;
alter table listings               enable row level security;
alter table room_types             enable row level security;
alter table menu_items             enable row level security;
alter table experiences            enable row level security;
alter table events                 enable row level security;
alter table article_categories     enable row level security;
alter table articles               enable row level security;
alter table testimonials           enable row level security;
alter table newsletter_subscribers enable row level security;
alter table enquiries              enable row level security;
alter table site_settings          enable row level security;
alter table homepage_sections      enable row level security;
alter table audit_logs             enable row level security;
alter table pages                  enable row level security;

-- ── profiles: own row, staff can read all ──
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Authors' display names are public (shown on articles) via a narrow view below.

create view public_authors with (security_invoker = false) as
  select p.id, p.full_name, p.avatar_url, p.bio
  from profiles p
  where exists (select 1 from articles a where a.author_id = p.id
                and a.status = 'published' and a.deleted_at is null and a.published_at <= now());
grant select on public_authors to anon, authenticated;

-- ── user_roles: users may read their own role; only super admins write ──
create policy roles_select_own on user_roles for select using (user_id = auth.uid() or is_admin());
create policy roles_write_super on user_roles for all using (is_super_admin()) with check (is_super_admin());

-- ── media: public read of non-deleted files, staff write ──
create policy media_public_read on media for select using (deleted_at is null or is_staff());
create policy media_staff_insert on media for insert with check (is_staff());
create policy media_staff_update on media for update using (is_staff()) with check (is_staff());
create policy media_admin_delete on media for delete using (is_admin());
create policy media_links_public_read on media_links for select using (true);
create policy media_links_staff_write on media_links for all using (is_staff()) with check (is_staff());

-- ── lookup tables ──
create policy attr_cat_read on attraction_categories for select using (true);
create policy attr_cat_write on attraction_categories for all using (is_admin()) with check (is_admin());
create policy art_cat_read on article_categories for select using (true);
create policy art_cat_write on article_categories for all using (is_admin()) with check (is_admin());

-- ── content tables: public sees published, staff manage; delete = admin only ──
do $$
declare t text;
begin
  foreach t in array array['communities', 'attractions', 'listings', 'experiences', 'events'] loop
    execute format($f$create policy %1$s_public_read on %1$I for select
      using ((status = 'published' and deleted_at is null) or is_staff())$f$, t);
    execute format($f$create policy %1$s_staff_insert on %1$I for insert with check (is_staff())$f$, t);
    execute format($f$create policy %1$s_staff_update on %1$I for update using (is_staff()) with check (is_staff())$f$, t);
    execute format($f$create policy %1$s_admin_delete on %1$I for delete using (is_admin())$f$, t);
  end loop;
end $$;

-- Articles honour scheduled publishing: published_at must have passed.
create policy articles_public_read on articles for select using (
  (status = 'published' and deleted_at is null and published_at <= now()) or is_staff());
create policy articles_staff_insert on articles for insert with check (is_staff());
create policy articles_staff_update on articles for update using (is_staff()) with check (is_staff());
create policy articles_admin_delete on articles for delete using (is_admin());

-- Child tables inherit visibility from the parent listing.
create policy room_types_read on room_types for select using (
  exists (select 1 from listings l where l.id = listing_id
          and ((l.status = 'published' and l.deleted_at is null) or is_staff())));
create policy room_types_staff_write on room_types for all using (is_staff()) with check (is_staff());
create policy menu_items_read on menu_items for select using (
  exists (select 1 from listings l where l.id = listing_id
          and ((l.status = 'published' and l.deleted_at is null) or is_staff())));
create policy menu_items_staff_write on menu_items for all using (is_staff()) with check (is_staff());

-- Only verified, published testimonials are public.
create policy testimonials_public_read on testimonials for select using (
  (status = 'published' and is_verified and deleted_at is null) or is_staff());
create policy testimonials_staff_write on testimonials for all using (is_staff()) with check (is_staff());

-- ── forms: anyone may submit, only staff may read ──
create policy newsletter_insert on newsletter_subscribers for insert with check (true);
create policy newsletter_staff_read on newsletter_subscribers for select using (is_staff());
create policy newsletter_admin_write on newsletter_subscribers for update using (is_admin()) with check (is_admin());
create policy newsletter_admin_delete on newsletter_subscribers for delete using (is_admin());

create policy enquiries_insert on enquiries for insert with check (status = 'new' and handled_by is null);
create policy enquiries_staff_read on enquiries for select using (is_staff());
create policy enquiries_staff_update on enquiries for update using (is_staff()) with check (is_staff());
create policy enquiries_admin_delete on enquiries for delete using (is_admin());

create policy pages_public_read on pages for select using ((status = 'published' and deleted_at is null) or is_staff());
create policy pages_staff_insert on pages for insert with check (is_staff());
create policy pages_staff_update on pages for update using (is_staff()) with check (is_staff());
create policy pages_admin_delete on pages for delete using (is_admin());

-- ── system ──
create policy settings_public_read on site_settings for select using (true);   -- no secrets stored here
create policy settings_admin_write on site_settings for all using (is_admin()) with check (is_admin());
create policy homepage_public_read on homepage_sections for select using (is_enabled or is_staff());
create policy homepage_staff_write on homepage_sections for all using (is_staff()) with check (is_staff());
create policy audit_admin_read on audit_logs for select using (is_admin());

-- Table privileges: RLS narrows these; revoke what must never be reachable.
revoke all on audit_logs from anon, authenticated;
grant select on audit_logs to authenticated;
revoke all on user_roles from anon;
-- Form tables: anonymous visitors may only INSERT (RLS also limits row values).
-- TRUNCATE is not covered by RLS, so it is revoked explicitly.
revoke all on newsletter_subscribers, enquiries from anon, authenticated;
grant insert on newsletter_subscribers, enquiries to anon, authenticated;
grant select, update, delete on newsletter_subscribers, enquiries to authenticated;
revoke truncate on all tables in schema public from anon, authenticated;

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy media_objects_public_read on storage.objects for select using (bucket_id = 'media');
create policy media_objects_staff_insert on storage.objects for insert with check (bucket_id = 'media' and is_staff());
create policy media_objects_staff_update on storage.objects for update using (bucket_id = 'media' and is_staff());
create policy media_objects_admin_delete on storage.objects for delete using (bucket_id = 'media' and is_admin());

-- Used by the media library to refuse deleting files that are still referenced.
create or replace function media_in_use(m uuid) returns boolean
language sql stable security invoker set search_path = public as $$
  select exists (select 1 from media_links where media_id = m)
      or exists (select 1 from communities where cover_media_id = m or og_media_id = m)
      or exists (select 1 from attractions where cover_media_id = m or og_media_id = m)
      or exists (select 1 from listings where cover_media_id = m or logo_media_id = m or og_media_id = m)
      or exists (select 1 from experiences where cover_media_id = m or og_media_id = m)
      or exists (select 1 from events where cover_media_id = m or og_media_id = m)
      or exists (select 1 from articles where cover_media_id = m or og_media_id = m)
      or exists (select 1 from pages where cover_media_id = m or og_media_id = m)
      or exists (select 1 from homepage_sections where config ->> 'media_id' = m::text)
$$;
