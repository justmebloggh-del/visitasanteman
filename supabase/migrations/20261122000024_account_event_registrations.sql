-- Visitors can see, and cancel, their own event registrations in My account.
-- Registrations are matched on the signed-in person's email address (the form takes an email, not an account), so a person only ever
-- sees rows that carry the email of their own signed-in account. Re-runnable.
drop policy if exists event_registrations_own_read on event_registrations;
create policy event_registrations_own_read on event_registrations for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function cancel_my_registration(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update event_registrations set status = 'cancelled'
  where id = p_id and status = 'registered' and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function cancel_my_registration(uuid) from public, anon;
grant execute on function cancel_my_registration(uuid) to authenticated;
