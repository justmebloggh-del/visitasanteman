-- Awards and event registration: public nominations, staff review, shortlist visibility, free registration with capacity.
-- Run against a local database; everything is rolled back:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/awards_rls.sql
begin;
create temp table results (label text, ok boolean, detail text);
grant all on results to public;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
select ('00000000-0000-0000-0000-00000000a0' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       r || '@awards.invalid', now(), '{}', now(), now()
from (values ('01','admin'), ('02','regional'), ('03','editor'), ('04','visitor')) v(n, r);
update user_roles set role = 'admin'           where user_id = '00000000-0000-0000-0000-00000000a001';
update user_roles set role = 'regional_editor' where user_id = '00000000-0000-0000-0000-00000000a002';
update user_roles set role = 'editor'          where user_id = '00000000-0000-0000-0000-00000000a003';

insert into award_programmes (id, slug, title, categories, nominations_open, status) values
  ('00000000-0000-0000-0000-0000000000f1', 'open-awards', 'Open awards', '{Tourism,Culture}', true, 'published'),
  ('00000000-0000-0000-0000-0000000000f2', 'closed-awards', 'Closed awards', '{Tourism}', false, 'published'),
  ('00000000-0000-0000-0000-0000000000f3', 'draft-awards', 'Draft awards', '{Tourism}', true, 'draft');
insert into award_nominations (id, programme_id, category, nominee_name, reason, nominator_name, nominator_email, status) values
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000f1', 'Tourism', 'Shortlisted Nominee', 'A sufficiently long reason for the nomination to be valid.', 'N1', 'n1@x.invalid', 'shortlisted'),
  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000f1', 'Culture', 'New Nominee', 'A sufficiently long reason for the nomination to be valid.', 'N2', 'n2@x.invalid', 'new');
insert into regions (id, slug, name) values ('00000000-0000-0000-0000-0000000000c1', 'awards-test-region', 'Awards test region');
insert into administrative_areas (id, region_id, slug, name, kind, is_active) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000c1', 'awards-test-area', 'Awards test area', 'district', true);
insert into events (id, slug, title, starts_at, status, registration_enabled, capacity, administrative_area_id) values
  ('00000000-0000-0000-0000-0000000000f6', 'reg-event', 'Reg event', now() + interval '10 days', 'published', true, 3, '00000000-0000-0000-0000-0000000000c2'),
  ('00000000-0000-0000-0000-0000000000f7', 'noreg-event', 'No reg event', now() + interval '10 days', 'published', false, null, '00000000-0000-0000-0000-0000000000c2');

-- Run a statement as a user and role; expect it to succeed or to raise an error.
create function pg_temp.t(label text, uid text, rl text, stmt text, expect_ok boolean) returns void
language plpgsql as $$
declare failed boolean := false; msg text := 'ok';
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  begin
    execute 'set local role ' || rl;
    execute stmt;
  exception when others then failed := true; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into results values (label, failed = not expect_ok, case when failed then 'error: ' || msg else 'succeeded' end);
end $$;

-- Run an update/delete as a user and expect an exact number of affected rows (RLS hides rows silently).
create function pg_temp.rows(label text, uid text, rl text, stmt text, expected int) returns void
language plpgsql as $$
declare n int := -1; msg text := '';
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  begin
    execute 'set local role ' || rl;
    execute stmt;
    get diagnostics n = row_count;
  exception when others then n := -2; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into results values (label, n = expected, 'rows=' || n || ' expected=' || expected || ' ' || msg);
end $$;

-- Count rows visible to a user.
create function pg_temp.visible(label text, uid text, rl text, q text, expected int) returns void
language plpgsql as $$
declare n int := -1; msg text := '';
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  begin
    execute 'set local role ' || rl;
    execute 'select count(*) from (' || q || ') s' into n;
  exception when others then n := -2; msg := sqlerrm;
  end;
  execute 'reset role';
  insert into results values (label, n = expected, 'visible=' || n || ' expected=' || expected || ' ' || msg);
end $$;

select pg_temp.visible('anon sees published programmes only', null, 'anon', $q$select 1 from award_programmes$q$, 2);
select pg_temp.t('anon can nominate into an open programme', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email) values ('00000000-0000-0000-0000-0000000000f1', 'Tourism', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid')$q$, true);
select pg_temp.t('anon cannot nominate into a closed programme', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email) values ('00000000-0000-0000-0000-0000000000f2', 'Tourism', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid')$q$, false);
select pg_temp.t('anon cannot nominate into a draft programme', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email) values ('00000000-0000-0000-0000-0000000000f3', 'Tourism', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid')$q$, false);
select pg_temp.t('anon cannot use a category outside the programme', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email) values ('00000000-0000-0000-0000-0000000000f1', 'Sport', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid')$q$, false);
select pg_temp.t('anon cannot self-shortlist', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email, status) values ('00000000-0000-0000-0000-0000000000f1', 'Tourism', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid', 'shortlisted')$q$, false);
select pg_temp.t('anon cannot self-name winner', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email, is_winner) values ('00000000-0000-0000-0000-0000000000f1', 'Tourism', 'X Nominee', 'A sufficiently long reason for the nomination to be valid.', 'Me', 'me@x.invalid', true)$q$, false);
select pg_temp.t('too-short reason is rejected', null, 'anon', $q$insert into award_nominations (programme_id, category, nominee_name, reason, nominator_name, nominator_email) values ('00000000-0000-0000-0000-0000000000f1', 'Tourism', 'X Nominee', 'short', 'Me', 'me@x.invalid')$q$, false);
select pg_temp.t('anon cannot read nominations', null, 'anon', $q$select 1 from award_nominations$q$, false);
select pg_temp.visible('visitor cannot read nominations', '00000000-0000-0000-0000-00000000a004', 'authenticated', $q$select 1 from award_nominations$q$, 0);
select pg_temp.visible('editor can read nominations', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$select 1 from award_nominations$q$, 3);
select pg_temp.visible('public shortlist shows only shortlisted', null, 'anon', $q$select 1 from award_shortlist$q$, 1);
select pg_temp.t('anon cannot read nominator email via view', null, 'anon', $q$select nominator_email from award_shortlist$q$, false);
select pg_temp.rows('editor can mark under review', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$update award_nominations set status = 'under_review' where id = '00000000-0000-0000-0000-0000000000f5'$q$, 1);
select pg_temp.t('editor cannot shortlist', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$update award_nominations set status = 'shortlisted' where id = '00000000-0000-0000-0000-0000000000f5'$q$, false);
select pg_temp.t('editor cannot name a winner', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$update award_nominations set is_winner = true where id = '00000000-0000-0000-0000-0000000000f4'$q$, false);
select pg_temp.t('regional editor can shortlist', '00000000-0000-0000-0000-00000000a002', 'authenticated', $q$update award_nominations set status = 'shortlisted' where id = '00000000-0000-0000-0000-0000000000f5'$q$, true);
select pg_temp.t('regional editor can name a winner', '00000000-0000-0000-0000-00000000a002', 'authenticated', $q$update award_nominations set is_winner = true where id = '00000000-0000-0000-0000-0000000000f4'$q$, true);
select pg_temp.rows('visitor cannot update nominations', '00000000-0000-0000-0000-00000000a004', 'authenticated', $q$update award_nominations set status = 'eligible'$q$, 0);
select pg_temp.rows('editor cannot delete nominations', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$delete from award_nominations$q$, 0);
select pg_temp.t('editor cannot publish a programme', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$update award_programmes set status = 'published' where id = '00000000-0000-0000-0000-0000000000f3'$q$, false);
select pg_temp.t('regional editor can publish a programme', '00000000-0000-0000-0000-00000000a002', 'authenticated', $q$update award_programmes set status = 'published' where id = '00000000-0000-0000-0000-0000000000f3'$q$, true);
select pg_temp.t('anon cannot read registrations table', null, 'anon', $q$select * from event_registrations$q$, false);
select pg_temp.t('anon cannot insert into registrations directly', null, 'anon', $q$insert into event_registrations (event_id, name, email) values ('00000000-0000-0000-0000-0000000000f6', 'X', 'x@x.invalid')$q$, false);
select pg_temp.t('anon registers via function', null, 'anon', $q$select 1 / (case when register_for_event('00000000-0000-0000-0000-0000000000f6', 'Ama', 'ama@x.invalid', null, 2, null) = 'ok' then 1 else 0 end)$q$, true);
select pg_temp.t('duplicate email is refused', null, 'anon', $q$select 1 / (case when register_for_event('00000000-0000-0000-0000-0000000000f6', 'Ama', 'AMA@x.invalid', null, 1, null) = 'duplicate' then 1 else 0 end)$q$, true);
select pg_temp.t('capacity is enforced', null, 'anon', $q$select 1 / (case when register_for_event('00000000-0000-0000-0000-0000000000f6', 'Kofi', 'kofi@x.invalid', null, 2, null) = 'full' then 1 else 0 end)$q$, true);
select pg_temp.t('last place can be taken', null, 'anon', $q$select 1 / (case when register_for_event('00000000-0000-0000-0000-0000000000f6', 'Kofi', 'kofi@x.invalid', null, 1, null) = 'ok' then 1 else 0 end)$q$, true);
select pg_temp.t('event without registration is closed', null, 'anon', $q$select 1 / (case when register_for_event('00000000-0000-0000-0000-0000000000f7', 'Ama', 'a@x.invalid', null, 1, null) = 'closed' then 1 else 0 end)$q$, true);
select pg_temp.visible('visitor cannot read registrations', '00000000-0000-0000-0000-00000000a004', 'authenticated', $q$select 1 from event_registrations$q$, 0);
select pg_temp.visible('editor can read registrations', '00000000-0000-0000-0000-00000000a003', 'authenticated', $q$select 1 from event_registrations$q$, 2);

select label, detail from results where not ok;
do $$
declare bad int; total int;
begin
  select count(*) filter (where not ok), count(*) into bad, total from results;
  raise notice '% checks, % failed', total, bad;
  if bad > 0 then raise exception '% awards checks failed', bad; end if;
end $$;
rollback;
