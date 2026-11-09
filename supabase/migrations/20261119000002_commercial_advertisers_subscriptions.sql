-- VisitAsanteman Phase 7: advertisers, daily ad statistics, subscription history.
-- Paid promotion never changes editorial verification: nothing here touches verification fields.

-- ───────────── Advertisers ─────────────
create table advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  contact_name text, contact_email text, contact_phone text,
  notes text,                                  -- internal: terms agreed, invoicing reference
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger set_updated_at before update on advertisers for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on advertisers for each row execute function audit_row();
alter table advertisers enable row level security;
create policy advertisers_admin_all on advertisers for all using (is_admin()) with check (is_admin());
revoke all on advertisers from anon;

alter table advertisements add column advertiser_id uuid references advertisers (id) on delete set null;
create index ads_advertiser_idx on advertisements (advertiser_id);

-- ───────────── Daily statistics (monitor impressions and clicks over time) ─────────────
create table ad_stats_daily (
  ad_id uuid not null references advertisements (id) on delete cascade,
  day date not null,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  primary key (ad_id, day)
);
alter table ad_stats_daily enable row level security;
create policy ad_stats_admin_read on ad_stats_daily for select using (is_admin());
revoke all on ad_stats_daily from anon;
revoke insert, update, delete on ad_stats_daily from authenticated;

create or replace function record_ad_event(p_ad uuid, p_event text) returns void
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if p_event not in ('impression', 'click') then raise exception 'Unknown event'; end if;
  update advertisements set
    impressions = impressions + (p_event = 'impression')::int,
    clicks = clicks + (p_event = 'click')::int
  where id = p_ad and status = 'published' and deleted_at is null and now() between starts_at and ends_at;
  get diagnostics n = row_count;
  if n > 0 then
    insert into ad_stats_daily (ad_id, day, impressions, clicks)
    values (p_ad, (now() at time zone 'utc')::date, (p_event = 'impression')::int, (p_event = 'click')::int)
    on conflict (ad_id, day) do update set
      impressions = ad_stats_daily.impressions + (p_event = 'impression')::int,
      clicks = ad_stats_daily.clicks + (p_event = 'click')::int;
  end if;
end $$;

-- ───────────── Subscription history ─────────────
-- Plans are arranged with the business and assigned by an administrator (there is no online purchase).
-- Every change of a listing's plan is recorded here, with an optional end date.
create type subscription_status as enum ('active', 'ended');
create table business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  plan_id uuid not null references subscription_plans (id) on delete restrict,
  status subscription_status not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,                   -- planned end; the plan lapses when an administrator runs "end overdue plans"
  ended_at timestamptz,
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index subs_listing_idx on business_subscriptions (listing_id, starts_at desc);
create index subs_active_idx on business_subscriptions (status, ends_at);
alter table business_subscriptions enable row level security;
create policy subs_admin_all on business_subscriptions for all using (is_admin()) with check (is_admin());
create policy subs_owner_read on business_subscriptions for select using (owns_listing(listing_id));
revoke all on business_subscriptions from anon;

create or replace function record_subscription_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.plan_id is distinct from old.plan_id then
    update business_subscriptions set status = 'ended', ended_at = now() where listing_id = new.id and status = 'active';
    if new.plan_id is not null then
      insert into business_subscriptions (listing_id, plan_id, created_by) values (new.id, new.plan_id, auth.uid());
    end if;
  end if;
  return new;
end $$;
create trigger tg_i_subscription after update of plan_id on listings for each row execute function record_subscription_change();

insert into business_subscriptions (listing_id, plan_id) select id, plan_id from listings where plan_id is not null;

-- Administrators set an end date on the current plan.
create or replace function set_subscription_end(p_listing uuid, p_ends timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only administrators can change subscriptions'; end if;
  update business_subscriptions set ends_at = p_ends where listing_id = p_listing and status = 'active';
end $$;
revoke all on function set_subscription_end(uuid, timestamptz) from public, anon;
grant execute on function set_subscription_end(uuid, timestamptz) to authenticated;

-- Ends every plan whose end date has passed and returns the number ended. Run it from the admin, or schedule it.
create or replace function end_overdue_subscriptions() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_admin() then raise exception 'Only administrators can end subscriptions'; end if;
  with due as (
    update business_subscriptions set status = 'ended', ended_at = now()
     where status = 'active' and ends_at is not null and ends_at <= now() returning listing_id
  )
  update listings set plan_id = null where id in (select listing_id from due);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function end_overdue_subscriptions() from public, anon;
grant execute on function end_overdue_subscriptions() to authenticated;
