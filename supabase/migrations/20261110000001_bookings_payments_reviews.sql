-- Phase 3: bookings (request-based), availability, payments, reviews, commissions.
-- Rules enforced in the database:
--  * Nothing is auto-confirmed. A provider or staff member confirms and sets the price.
--  * Clients never write bookings/payments directly; they call functions that validate.
--  * Payment rows are written only by server code using the service role after the gateway verifies.

create type booking_kind as enum ('accommodation', 'experience', 'table');
create type booking_status as enum ('pending', 'confirmed', 'awaiting_payment', 'paid', 'cancelled', 'completed', 'refunded');
create type payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');

alter table subscription_plans add column commission_percent numeric(5, 2) not null default 0 check (commission_percent between 0 and 100);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  kind booking_kind not null,
  user_id uuid references auth.users (id) on delete set null,
  listing_id uuid references listings (id) on delete set null,
  experience_id uuid references experiences (id) on delete set null,
  room_type_id uuid references room_types (id) on delete set null,
  customer_name text not null check (length(customer_name) between 1 and 120),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(customer_email) <= 254),
  customer_phone text check (length(customer_phone) <= 40),
  check_in date, check_out date,
  booking_date date, booking_time time,
  guests int not null check (guests between 1 and 500),
  notes text check (length(notes) <= 2000),
  total_amount numeric(12, 2) check (total_amount > 0),       -- set by provider/staff, never by the customer
  currency char(3) not null default 'GHS',
  commission_amount numeric(12, 2) check (commission_amount >= 0),
  status booking_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  cancellation_reason text,
  cancelled_by text check (cancelled_by in ('customer', 'provider', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'accommodation' and listing_id is not null and check_in is not null and check_out > check_in)
      or (kind = 'experience' and experience_id is not null and booking_date is not null)
      or (kind = 'table' and listing_id is not null and booking_date is not null and booking_time is not null))
);
create index bookings_user_idx on bookings (user_id);
create index bookings_listing_idx on bookings (listing_id, status);
create index bookings_experience_idx on bookings (experience_id, status);
create index bookings_room_idx on bookings (room_type_id, check_in, check_out);
create trigger set_updated_at before update on bookings for each row execute function set_updated_at();

create table booking_status_history (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings (id) on delete cascade,
  from_status booking_status, to_status booking_status not null,
  actor_id uuid, actor_kind text not null, note text,
  created_at timestamptz not null default now()
);
create index booking_history_idx on booking_status_history (booking_id, created_at);

create table booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete restrict,
  provider text not null default 'paystack',
  reference text not null unique,                    -- gateway transaction reference
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null,
  method text,
  status payment_status not null default 'pending',
  provider_response jsonb,
  initiated_at timestamptz not null default now(),
  paid_at timestamptz
);
create index booking_payments_booking_idx on booking_payments (booking_id);

create table room_blocked_dates (
  room_type_id uuid not null references room_types (id) on delete cascade,
  day date not null,
  primary key (room_type_id, day)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,   -- one review per completed booking
  listing_id uuid references listings (id) on delete cascade,
  experience_id uuid references experiences (id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text check (length(comment) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  owner_reply text check (length(owner_reply) <= 1000),
  created_at timestamptz not null default now()
);
create index reviews_listing_idx on reviews (listing_id) where status = 'published';
create index reviews_experience_idx on reviews (experience_id) where status = 'published';

-- ───────────── Helper functions ─────────────
create or replace function can_manage_booking(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() or exists (
    select 1 from bookings bk
    left join listings l on l.id = bk.listing_id
    left join experiences e on e.id = bk.experience_id
    left join listings pl on pl.id = e.provider_listing_id
    where bk.id = b and (l.owner_id = auth.uid() or pl.owner_id = auth.uid()))
$$;

create or replace function room_available(room uuid, d_in date, d_out date) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from room_blocked_dates where room_type_id = room and day >= d_in and day < d_out)
     and coalesce((select units from room_types where id = room), 0) >
         (select count(*) from bookings where room_type_id = room
            and status in ('confirmed', 'awaiting_payment', 'paid') and check_in < d_out and check_out > d_in)
$$;

-- ───────────── Creating a booking request ─────────────
create or replace function create_booking(
  p_kind booking_kind, p_listing uuid, p_experience uuid, p_room uuid,
  p_name text, p_email text, p_phone text,
  p_check_in date, p_check_out date, p_date date, p_time time, p_guests int, p_notes text
) returns text
language plpgsql security definer set search_path = public as $$
declare ref text; tries int := 0; l listings%rowtype; e experiences%rowtype; r room_types%rowtype;
begin
  p_name := btrim(coalesce(p_name, '')); p_email := lower(btrim(coalesce(p_email, '')));
  if p_guests is null or p_guests < 1 then raise exception 'Enter the number of guests'; end if;

  if p_kind = 'accommodation' then
    select * into l from listings where id = p_listing and status = 'published' and deleted_at is null
      and type in ('hotel', 'resort', 'guesthouse', 'lodge', 'eco_lodge', 'holiday_home', 'apartment');
    if not found then raise exception 'This accommodation is not available for booking requests'; end if;
    if p_check_in is null or p_check_out is null or p_check_in < current_date or p_check_out <= p_check_in
       or p_check_out - p_check_in > 60 then raise exception 'Choose valid check-in and check-out dates (max 60 nights)'; end if;
    if p_room is not null then
      select * into r from room_types where id = p_room and listing_id = l.id;
      if not found then raise exception 'Unknown room type'; end if;
      if r.max_guests is not null and p_guests > r.max_guests then raise exception 'That room sleeps at most % guests', r.max_guests; end if;
      if not room_available(p_room, p_check_in, p_check_out) then raise exception 'That room is not available for those dates'; end if;
    end if;
  elsif p_kind = 'experience' then
    select * into e from experiences where id = p_experience and status = 'published' and deleted_at is null;
    if not found then raise exception 'This experience is not available for booking requests'; end if;
    if p_date is null or p_date < current_date then raise exception 'Choose a date in the future'; end if;
    if e.min_participants is not null and p_guests < e.min_participants then raise exception 'Minimum % participants', e.min_participants; end if;
    if e.max_participants is not null and p_guests > e.max_participants then raise exception 'Maximum % participants', e.max_participants; end if;
  else
    select * into l from listings where id = p_listing and status = 'published' and deleted_at is null and type = 'restaurant';
    if not found then raise exception 'This restaurant does not take table requests'; end if;
    if p_date is null or p_time is null or p_date < current_date then raise exception 'Choose a date and time in the future'; end if;
  end if;

  loop
    ref := 'VLB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into bookings (reference, kind, user_id, listing_id, experience_id, room_type_id, customer_name, customer_email, customer_phone,
                            check_in, check_out, booking_date, booking_time, guests, notes)
      values (ref, p_kind, auth.uid(), case when p_kind = 'experience' then null else p_listing end,
              case when p_kind = 'experience' then p_experience end, case when p_kind = 'accommodation' then p_room end,
              p_name, p_email, nullif(btrim(coalesce(p_phone, '')), ''),
              case when p_kind = 'accommodation' then p_check_in end, case when p_kind = 'accommodation' then p_check_out end,
              case when p_kind <> 'accommodation' then p_date end, case when p_kind = 'table' then p_time end,
              p_guests, nullif(btrim(coalesce(p_notes, '')), ''));
      exit;
    exception when unique_violation then
      tries := tries + 1; if tries > 5 then raise; end if;
    end;
  end loop;
  insert into booking_status_history (booking_id, from_status, to_status, actor_id, actor_kind, note)
    select id, null, 'pending', auth.uid(), 'customer', 'Request created' from bookings where reference = ref;
  return ref;
end $$;

-- ───────────── Status changes (the only way a status changes from the client side) ─────────────
create or replace function set_booking_status(p_booking uuid, p_status booking_status, p_amount numeric default null, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; actor text; ok boolean := false; plan_pct numeric := 0;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;

  if is_admin() then actor := 'staff';
  elsif can_manage_booking(p_booking) then actor := 'provider';
  elsif b.user_id is not null and b.user_id = auth.uid() then actor := 'customer';
  else raise exception 'Not allowed'; end if;

  if actor = 'customer' then
    ok := p_status = 'cancelled' and b.status in ('pending', 'confirmed', 'awaiting_payment');
  else
    ok := (b.status, p_status) in (('pending','confirmed'), ('pending','cancelled'), ('confirmed','awaiting_payment'), ('confirmed','cancelled'),
                                   ('confirmed','completed'), ('awaiting_payment','cancelled'), ('paid','completed'), ('paid','cancelled'));
    -- Refund is recorded by an administrator after money has actually been returned via the gateway.
    if p_status = 'refunded' then ok := actor = 'staff' and b.payment_status = 'paid' and b.status in ('paid', 'cancelled', 'completed'); end if;
  end if;
  if not ok then raise exception 'Cannot change a booking from % to %', b.status, p_status; end if;

  if p_amount is not null then
    if actor = 'customer' or b.status in ('awaiting_payment', 'paid', 'completed', 'refunded') or b.payment_status <> 'unpaid' then
      raise exception 'The price cannot be changed now'; end if;
    if p_amount <= 0 then raise exception 'Price must be more than zero'; end if;
  end if;
  if p_status = 'awaiting_payment' and coalesce(p_amount, b.total_amount) is null then
    raise exception 'Set a price before requesting payment'; end if;
  if p_status = 'cancelled' and actor <> 'customer' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'Give a reason for cancelling'; end if;

  update bookings set
    status = p_status,
    total_amount = coalesce(p_amount, total_amount),
    payment_status = case when p_status = 'refunded' then 'refunded'::payment_status
                          when p_status = 'awaiting_payment' then 'pending'::payment_status
                          when p_status = 'cancelled' and payment_status = 'pending' then 'unpaid'::payment_status
                          else payment_status end,
    cancellation_reason = case when p_status = 'cancelled' then nullif(btrim(p_reason), '') else cancellation_reason end,
    cancelled_by = case when p_status = 'cancelled' then actor else cancelled_by end
  where id = p_booking;
  insert into booking_status_history (booking_id, from_status, to_status, actor_id, actor_kind, note)
    values (p_booking, b.status, p_status, auth.uid(), actor, nullif(btrim(coalesce(p_reason, '')), ''));
end $$;

-- ───────────── Guest access by reference + email ─────────────
create or replace function lookup_booking(p_ref text, p_email text)
returns table (id uuid, reference text, kind booking_kind, title text, status booking_status, payment_status payment_status,
               total_amount numeric, currency char(3), guests int, check_in date, check_out date, booking_date date, booking_time time,
               customer_name text, created_at timestamptz, can_review boolean, reviewed boolean)
language sql stable security definer set search_path = public as $$
  select b.id, b.reference, b.kind, coalesce(l.name, e.title), b.status, b.payment_status, b.total_amount, b.currency, b.guests,
         b.check_in, b.check_out, b.booking_date, b.booking_time, b.customer_name, b.created_at,
         b.status = 'completed' and not exists (select 1 from reviews r where r.booking_id = b.id),
         exists (select 1 from reviews r where r.booking_id = b.id)
  from bookings b left join listings l on l.id = b.listing_id left join experiences e on e.id = b.experience_id
  where b.reference = upper(btrim(p_ref)) and b.customer_email = lower(btrim(p_email))
$$;

create or replace function guest_cancel_booking(p_ref text, p_email text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  select * into b from bookings where reference = upper(btrim(p_ref)) and customer_email = lower(btrim(p_email)) for update;
  if not found then raise exception 'Booking not found'; end if;
  if b.status not in ('pending', 'confirmed', 'awaiting_payment') then raise exception 'This booking can no longer be cancelled online. Please contact the provider.'; end if;
  update bookings set status = 'cancelled', cancelled_by = 'customer', cancellation_reason = nullif(btrim(coalesce(p_reason, '')), ''),
    payment_status = case when payment_status = 'pending' then 'unpaid'::payment_status else payment_status end where id = b.id;
  insert into booking_status_history (booking_id, from_status, to_status, actor_kind, note) values (b.id, b.status, 'cancelled', 'customer', p_reason);
end $$;

create or replace function submit_review(p_ref text, p_email text, p_rating int, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  select * into b from bookings where reference = upper(btrim(p_ref)) and customer_email = lower(btrim(p_email));
  if not found then raise exception 'Booking not found'; end if;
  if b.status <> 'completed' then raise exception 'You can review a booking once the provider marks it completed'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'Choose a rating from 1 to 5'; end if;
  insert into reviews (booking_id, listing_id, experience_id, author_name, rating, comment)
  values (b.id, b.listing_id, b.experience_id, split_part(b.customer_name, ' ', 1), p_rating, nullif(btrim(coalesce(p_comment, '')), ''));
exception when unique_violation then raise exception 'You have already reviewed this booking';
end $$;

create or replace function reply_to_review(p_review uuid, p_reply text) returns void
language plpgsql security definer set search_path = public as $$
declare r reviews%rowtype;
begin
  select * into r from reviews where id = p_review;
  if not found then raise exception 'Review not found'; end if;
  if not (is_staff() or (r.listing_id is not null and owns_listing(r.listing_id))
          or (r.experience_id is not null and exists (select 1 from experiences e where e.id = r.experience_id and e.provider_listing_id is not null and owns_listing(e.provider_listing_id)))) then
    raise exception 'Not allowed'; end if;
  update reviews set owner_reply = nullif(btrim(coalesce(p_reply, '')), '') where id = p_review;
end $$;

-- ───────────── RLS and privileges ─────────────
alter table bookings enable row level security;
alter table booking_status_history enable row level security;
alter table booking_payments enable row level security;
alter table room_blocked_dates enable row level security;
alter table reviews enable row level security;

create policy bookings_customer_read on bookings for select using (user_id = auth.uid());
create policy bookings_manager_read on bookings for select using (can_manage_booking(id));
create policy history_read on booking_status_history for select using (can_manage_booking(booking_id) or exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy payments_read on booking_payments for select using (can_manage_booking(booking_id));
create policy blocked_owner_all on room_blocked_dates for all
  using (is_staff() or exists (select 1 from room_types r where r.id = room_type_id and owns_listing(r.listing_id)))
  with check (is_staff() or exists (select 1 from room_types r where r.id = room_type_id and owns_listing(r.listing_id)));
create policy reviews_public_read on reviews for select using (status = 'published');
create policy reviews_staff_all on reviews for all using (is_staff()) with check (is_staff());
create policy reviews_owner_read on reviews for select using (
  (listing_id is not null and owns_listing(listing_id))
  or (experience_id is not null and exists (select 1 from experiences e where e.id = experience_id and e.provider_listing_id is not null and owns_listing(e.provider_listing_id))));

-- No direct writes from the browser to booking tables; all changes go through the functions above.
revoke all on bookings, booking_status_history, booking_payments from anon, authenticated;
grant select on bookings, booking_status_history, booking_payments to authenticated;
revoke all on reviews from anon, authenticated;
grant select on reviews to anon, authenticated;
grant update (status) on reviews to authenticated;                    -- moderation (RLS: staff only)
revoke all on room_blocked_dates from anon;
revoke truncate on all tables in schema public from anon, authenticated;

revoke all on function create_booking(booking_kind, uuid, uuid, uuid, text, text, text, date, date, date, time, int, text) from public;
grant execute on function create_booking(booking_kind, uuid, uuid, uuid, text, text, text, date, date, date, time, int, text) to anon, authenticated;
revoke all on function set_booking_status(uuid, booking_status, numeric, text) from public, anon;
grant execute on function set_booking_status(uuid, booking_status, numeric, text) to authenticated;
revoke all on function lookup_booking(text, text) from public;
grant execute on function lookup_booking(text, text) to anon, authenticated;
revoke all on function guest_cancel_booking(text, text, text) from public;
grant execute on function guest_cancel_booking(text, text, text) to anon, authenticated;
revoke all on function submit_review(text, text, int, text) from public;
grant execute on function submit_review(text, text, int, text) to anon, authenticated;
revoke all on function reply_to_review(uuid, text) from public, anon;
grant execute on function reply_to_review(uuid, text) to authenticated;
revoke all on function room_available(uuid, date, date) from public, anon, authenticated;

-- audit trail for bookings and payments
create trigger audit_row after insert or update or delete on bookings for each row execute function audit_row();
create trigger audit_row after insert or update or delete on booking_payments for each row execute function audit_row();
