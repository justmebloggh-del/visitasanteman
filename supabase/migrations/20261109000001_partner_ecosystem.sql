-- Phase 2: business ecosystem.
-- Partners manage ONLY their own listings. They can never publish, verify or feature:
-- publication needs an administrator's approval (status stays draft/pending_review).

-- ───────────── Subscription plans (editable by admins, no code change) ─────────────
create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  price_monthly numeric(12, 2) check (price_monthly >= 0),   -- null = "ask us"; nothing is charged online yet
  price_currency char(3) not null default 'GHS',
  max_photos int not null default 3 check (max_photos between 0 and 100),
  featured_placement boolean not null default false,
  analytics boolean not null default false,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on subscription_plans for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on subscription_plans for each row execute function audit_row();
alter table subscription_plans enable row level security;
create policy plans_public_read on subscription_plans for select using (is_active or is_staff());
create policy plans_admin_write on subscription_plans for all using (is_admin()) with check (is_admin());

-- Structure only; prices are left blank for the owner to decide.
insert into subscription_plans (slug, name, summary, max_photos, featured_placement, analytics, features, sort_order) values
  ('free', 'Free Listing', 'Basic business profile and contact details.', 3, false, false, array['Basic business profile', 'Contact details', 'Limited photographs'], 1),
  ('standard', 'Standard Listing', 'Enhanced profile with more photographs.', 10, false, false, array['Enhanced business profile', 'More photographs', 'Additional service information', 'Improved directory visibility'], 2),
  ('premium', 'Premium Listing', 'Featured placement and listing analytics.', 30, true, true, array['Featured placement', 'Extended media gallery', 'Promotional opportunities', 'Advanced listing analytics'], 3)
on conflict (slug) do nothing;

alter table listings add column plan_id uuid references subscription_plans (id) on delete set null;
alter table profiles add column business_account_type text
  check (business_account_type in ('accommodation', 'restaurant', 'tour_operator', 'boat_operator', 'tour_guide', 'general'));

-- Extend the privileged-field guard: only admins change plan, verification, featured, owner.
create or replace function guard_listing_privileged_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (
       new.is_verified is distinct from old.is_verified
    or new.verified_at is distinct from old.verified_at
    or new.is_featured is distinct from old.is_featured
    or new.owner_id is distinct from old.owner_id
    or new.plan_id is distinct from old.plan_id
  ) then
    raise exception 'Only administrators can change verification, featured, plan or owner fields';
  end if;
  return new;
end $$;

-- ───────────── Becoming a partner (server-controlled role change) ─────────────
-- The browser never supplies a role. A signed-in, email-verified visitor calls this
-- function, which can only ever move visitor -> partner.
create or replace function become_partner(account_type text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if account_type not in ('accommodation', 'restaurant', 'tour_operator', 'boat_operator', 'tour_guide', 'general') then
    raise exception 'Invalid account type';
  end if;
  if not exists (select 1 from auth.users where id = uid and email_confirmed_at is not null) then
    raise exception 'Verify your email address first';
  end if;
  update user_roles set role = 'partner' where user_id = uid and role = 'visitor';
  update profiles set business_account_type = account_type
    where id = uid and business_account_type is null
      and exists (select 1 from user_roles where user_id = uid and role = 'partner');  -- set once; admins may change it
end $$;
revoke all on function become_partner(text) from public, anon;
grant execute on function become_partner(text) to authenticated;

create or replace function is_partner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_app_role() = 'partner', false)
$$;

create or replace function owns_listing(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from listings where id = l and owner_id = auth.uid())
$$;

-- ───────────── Owner-scoped listing policies ─────────────
create policy listings_owner_read on listings for select using (owner_id = auth.uid() and deleted_at is null);
create policy listings_partner_insert on listings for insert with check (
  is_partner() and owner_id = auth.uid() and status in ('draft', 'pending_review')
  and is_verified = false and is_featured = false and plan_id is null and deleted_at is null);
create policy listings_partner_update on listings for update
  using (is_partner() and owner_id = auth.uid() and deleted_at is null)
  -- A partner can never set 'published'. Editing a live listing sends it back for review.
  with check (is_partner() and owner_id = auth.uid() and status in ('draft', 'pending_review', 'archived'));

create policy room_types_owner_all on room_types for all using (owns_listing(listing_id)) with check (owns_listing(listing_id));
create policy menu_items_owner_all on menu_items for all using (owns_listing(listing_id)) with check (owns_listing(listing_id));

-- Photos: partners upload into their own folder and link them to their own listings.
create policy media_partner_insert on media for insert with check (is_partner() and uploaded_by = auth.uid() and folder = 'partners/' || auth.uid()::text);
create policy media_partner_read_own on media for select using (uploaded_by = auth.uid());
create policy media_links_owner_write on media_links for all
  using (entity_type = 'listing' and owns_listing(entity_id))
  with check (entity_type = 'listing' and owns_listing(entity_id)
              and exists (select 1 from media m where m.id = media_id and m.uploaded_by = auth.uid()));
create policy media_objects_partner_insert on storage.objects for insert
  with check (bucket_id = 'media' and is_partner() and name like 'partners/' || auth.uid()::text || '/%');

-- Enquiries about a partner's own listings.
create policy enquiries_owner_read on enquiries for select using (listing_id is not null and owns_listing(listing_id));
create policy enquiries_owner_update on enquiries for update
  using (listing_id is not null and owns_listing(listing_id))
  with check (listing_id is not null and owns_listing(listing_id));

-- ───────────── Listing analytics ─────────────
create table listing_views (
  listing_id uuid not null references listings (id) on delete cascade,
  day date not null default current_date,
  views int not null default 0,
  primary key (listing_id, day)
);
alter table listing_views enable row level security;
create policy views_owner_read on listing_views for select using (owns_listing(listing_id) or is_staff());
revoke all on listing_views from anon, authenticated;
grant select on listing_views to authenticated;

-- Anyone may record a view of a PUBLISHED listing; nothing else is exposed or writable.
create or replace function record_listing_view(l uuid) returns void
language sql security definer set search_path = public as $$
  insert into listing_views (listing_id, day, views)
  select id, current_date, 1 from listings where id = l and status = 'published' and deleted_at is null
  on conflict (listing_id, day) do update set views = listing_views.views + 1
$$;
revoke all on function record_listing_view(uuid) from public;
grant execute on function record_listing_view(uuid) to anon, authenticated;
