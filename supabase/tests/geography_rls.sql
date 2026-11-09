-- Geography, role permissions, publish guard and revisions.
-- Run against a local database; everything happens in one transaction that is rolled back:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/geography_rls.sql
-- Prints one PASS/FAIL line per check and fails (non-zero exit) if any check fails.
begin;

create temp table results (label text, ok boolean, detail text);
grant all on results to public;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
select ('00000000-0000-0000-0000-00000000a0' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       r || '@test.invalid', now(), '{}', now(), now()
from (values ('01', 'super'), ('02', 'admin'), ('03', 'regional'), ('04', 'editor'), ('05', 'media'), ('06', 'partner'), ('07', 'visitor')) v(n, r);
update user_roles set role = 'super_admin'     where user_id = '00000000-0000-0000-0000-00000000a001';
update user_roles set role = 'admin'           where user_id = '00000000-0000-0000-0000-00000000a002';
update user_roles set role = 'regional_editor' where user_id = '00000000-0000-0000-0000-00000000a003';
update user_roles set role = 'editor'          where user_id = '00000000-0000-0000-0000-00000000a004';
update user_roles set role = 'media_manager'   where user_id = '00000000-0000-0000-0000-00000000a005';
update user_roles set role = 'partner'         where user_id = '00000000-0000-0000-0000-00000000a006';

-- Test fixtures (clearly fake: this is a rolled-back transaction).
insert into regions (id, slug, name) values ('00000000-0000-0000-0000-0000000000f1', 'test-region', 'Test region');
insert into administrative_areas (id, region_id, slug, name, kind, is_active) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', 'test-area', 'Test area', 'district', true),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000f1', 'test-inactive', 'Inactive area', 'district', false);
insert into communities (id, slug, name, status, administrative_area_id) values
  ('00000000-0000-0000-0000-0000000000f4', 'test-community', 'Test community', 'published', '00000000-0000-0000-0000-0000000000f2');
insert into localities (community_id, slug, name) values ('00000000-0000-0000-0000-0000000000f4', 'test-locality', 'Test locality');
insert into attractions (id, slug, name, status) values ('00000000-0000-0000-0000-0000000000f5', 'draft-attraction', 'Draft attraction', 'draft');
insert into listings (id, slug, type, name, status) values ('00000000-0000-0000-0000-0000000000f6', 'draft-hotel', 'hotel', 'Draft hotel', 'draft');
insert into destinations (slug, name, administrative_area_id, status) values
  ('draft-destination', 'Draft destination', '00000000-0000-0000-0000-0000000000f2', 'draft');

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

\set super   '''00000000-0000-0000-0000-00000000a001'''
\set admin   '''00000000-0000-0000-0000-00000000a002'''
\set regional '''00000000-0000-0000-0000-00000000a003'''
\set editor  '''00000000-0000-0000-0000-00000000a004'''
\set media   '''00000000-0000-0000-0000-00000000a005'''
\set partner '''00000000-0000-0000-0000-00000000a006'''
\set visitor '''00000000-0000-0000-0000-00000000a007'''
\set area    '''00000000-0000-0000-0000-0000000000f2'''
\set inactive '''00000000-0000-0000-0000-0000000000f3'''
\set region  '''00000000-0000-0000-0000-0000000000f1'''
\set comm    '''00000000-0000-0000-0000-0000000000f4'''
\set attr    '''00000000-0000-0000-0000-0000000000f5'''
\set lst     '''00000000-0000-0000-0000-0000000000f6'''

-- ── Geography reference data: who can write ──
select pg_temp.t('G01 anon cannot add a region', null, 'anon', 'insert into regions (slug, name) values (''x1'', ''X'')', false);
select pg_temp.t('G02 visitor cannot add an administrative area', :visitor, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x2'', ''X'', ''district'')', :region), false);
select pg_temp.t('G03 partner cannot add an administrative area', :partner, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x3'', ''X'', ''district'')', :region), false);
select pg_temp.t('G04 content editor cannot add an administrative area', :editor, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x4'', ''X'', ''district'')', :region), false);
select pg_temp.t('G05 media manager cannot add an administrative area', :media, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x5'', ''X'', ''district'')', :region), false);
select pg_temp.t('G06 regional editor can add an administrative area', :regional, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x6'', ''X'', ''district'')', :region), true);
select pg_temp.t('G07 admin can add an administrative area', :admin, 'authenticated',
  format('insert into administrative_areas (region_id, slug, name, kind) values (%L, ''x7'', ''X'', ''municipal'')', :region), true);

-- ── Geography reference data: who can read ──
select pg_temp.visible('G08 anon sees active areas only', null, 'anon', 'select 1 from administrative_areas where slug in (''test-area'', ''test-inactive'')', 1);
select pg_temp.visible('G09 editor sees inactive areas too', :editor, 'authenticated', 'select 1 from administrative_areas where slug in (''test-area'', ''test-inactive'')', 2);
select pg_temp.visible('G10 anon sees localities of published communities', null, 'anon', 'select 1 from localities', 1);
select pg_temp.visible('G11 anon cannot see a draft destination', null, 'anon', 'select 1 from destinations where slug = ''draft-destination''', 0);
select pg_temp.visible('G12 editor sees a draft destination', :editor, 'authenticated', 'select 1 from destinations where slug = ''draft-destination''', 1);

-- ── Publish guard ──
select pg_temp.t('P01 cannot publish an attraction without an area', :regional, 'authenticated',
  format('update attractions set status = ''published'' where id = %L', :attr), false);
select pg_temp.t('P02 cannot publish with an inactive area', :regional, 'authenticated',
  format('update attractions set status = ''published'', administrative_area_id = %L where id = %L', :inactive, :attr), false);
select pg_temp.t('P03 regional editor can publish with an active area', :regional, 'authenticated',
  format('update attractions set status = ''published'', administrative_area_id = %L where id = %L', :area, :attr), true);
select pg_temp.t('P04 area is derived from the community when left blank', :regional, 'authenticated',
  format('insert into attractions (slug, name, status, community_id) values (''derived'', ''Derived'', ''published'', %L)', :comm), true);
select pg_temp.visible('P05 the derived area was stored', null, 'anon', format('select 1 from attractions where slug = ''derived'' and administrative_area_id = %L', :area), 1);
select pg_temp.t('P06 cannot publish a listing without an area', :admin, 'authenticated',
  format('update listings set status = ''published'' where id = %L', :lst), false);
select pg_temp.t('P07 a draft needs no area', :editor, 'authenticated',
  'insert into attractions (slug, name, status) values (''draft-ok'', ''Draft ok'', ''draft'')', true);
select pg_temp.t('P08 cannot publish a community without an area', :admin, 'authenticated',
  'insert into communities (slug, name, status) values (''no-area'', ''No area'', ''published'')', false);
select pg_temp.t('P09 cannot publish a destination whose area is inactive', :admin, 'authenticated',
  format('insert into destinations (slug, name, administrative_area_id, status) values (''bad-dest'', ''Bad'', %L, ''published'')', :inactive), false);

-- ── Editorial workflow ──
select pg_temp.t('W01 content editor can send for review', :editor, 'authenticated',
  format('update attractions set status = ''pending_review'' where id = %L', :attr), true);
select pg_temp.t('W02 content editor cannot approve', :editor, 'authenticated',
  format('update attractions set status = ''approved'' where id = %L', :attr), false);
select pg_temp.t('W03 content editor cannot publish', :editor, 'authenticated',
  format('update attractions set status = ''published'' where id = %L', :attr), false);
select pg_temp.t('W04 content editor cannot insert already-published content', :editor, 'authenticated',
  format('insert into attractions (slug, name, status, administrative_area_id) values (''sneaky'', ''Sneaky'', ''published'', %L)', :area), false);
select pg_temp.t('W05 regional editor can approve', :regional, 'authenticated',
  format('update attractions set status = ''approved'' where id = %L', :attr), true);
select pg_temp.t('W06 content editor may still edit text of published content', :editor, 'authenticated',
  format('update attractions set status = ''published'', summary = ''x'' where id = %L', :attr), false);
select pg_temp.rows('W07 partner cannot publish a listing they do not own (RLS)', :partner, 'authenticated',
  format('update listings set status = ''published'' where id = %L', :lst), 0);

-- ── Verification flags ──
select pg_temp.t('V01 content editor cannot mark content verified', :editor, 'authenticated',
  format('update attractions set content_verified = true where id = %L', :attr), false);
select pg_temp.t('V02 content editor cannot set last_verified_at', :editor, 'authenticated',
  format('update attractions set last_verified_at = now() where id = %L', :attr), false);
select pg_temp.t('V03 regional editor can mark content verified', :regional, 'authenticated',
  format('update attractions set content_verified = true, last_verified_at = now() where id = %L', :attr), true);
select pg_temp.t('V04 content editor can write verification notes', :editor, 'authenticated',
  format('update attractions set verification_notes = ''checked on site'' where id = %L', :attr), true);
select pg_temp.t('V05 regional editor cannot set the listing verified badge', :regional, 'authenticated',
  format('update listings set is_verified = true where id = %L', :lst), false);
select pg_temp.t('V06 admin can set the listing verified badge', :admin, 'authenticated',
  format('update listings set is_verified = true where id = %L', :lst), true);

-- ── Roles, plans: never writable by editors ──
select pg_temp.rows('R01 regional editor cannot change roles', :regional, 'authenticated', format('update user_roles set role = ''admin'' where user_id = %L', :visitor), 0);
select pg_temp.rows('R02 content editor cannot change roles', :editor, 'authenticated', format('update user_roles set role = ''admin'' where user_id = %L', :visitor), 0);
select pg_temp.rows('R03 admin cannot change roles', :admin, 'authenticated', format('update user_roles set role = ''admin'' where user_id = %L', :visitor), 0);
select pg_temp.rows('R05 regional editor cannot edit subscription plans', :regional, 'authenticated', 'update subscription_plans set name = name', 0);
select pg_temp.rows('R06 content editor cannot edit subscription plans', :editor, 'authenticated', 'update subscription_plans set name = name', 0);
select pg_temp.rows('R07 regional editor cannot edit advertisements', :regional, 'authenticated', 'update advertisements set title = title', 0);

-- ── Media manager: media only ──
select pg_temp.t('M01 media manager can add a media record', :media, 'authenticated',
  format('insert into media (path, alt_text, mime_type, size_bytes, uploaded_by) values (''t/a.jpg'', ''alt'', ''image/jpeg'', 10, %L)', :media), true);
select pg_temp.t('M02 media manager can edit media', :media, 'authenticated', 'update media set caption = ''c'' where path = ''t/a.jpg''', true);
select pg_temp.t('M03 media manager cannot create content', :media, 'authenticated', 'insert into attractions (slug, name) values (''mm'', ''MM'')', false);
select pg_temp.rows('M04 media manager cannot edit content', :media, 'authenticated', format('update attractions set summary = ''x'' where id = %L', :attr), 0);
select pg_temp.visible('M05 media manager cannot read enquiries', :media, 'authenticated', 'select 1 from enquiries', 0);
select pg_temp.visible('M06 media manager sees only their own profile', :media, 'authenticated', 'select 1 from profiles', 1);
select pg_temp.t('M07 visitor cannot add media', :visitor, 'authenticated',
  format('insert into media (path, alt_text, mime_type, size_bytes, uploaded_by) values (''t/b.jpg'', ''alt'', ''image/jpeg'', 10, %L)', :visitor), false);
select pg_temp.t('M08 content editor can add media', :editor, 'authenticated',
  format('insert into media (path, alt_text, mime_type, size_bytes, uploaded_by) values (''t/c.jpg'', ''alt'', ''image/jpeg'', 10, %L)', :editor), true);

-- ── Revisions ──
select pg_temp.visible('H01 saving content recorded revisions', :editor, 'authenticated', format('select 1 from content_revisions where table_name = ''attractions'' and record_id = %L', :attr), 5);
select pg_temp.t('H02 anon cannot read revisions', null, 'anon', 'select 1 from content_revisions', false);
select pg_temp.visible('H03 visitor cannot read revisions', :visitor, 'authenticated', 'select 1 from content_revisions', 0);
select pg_temp.t('H04 nobody can write revisions directly', :admin, 'authenticated', 'insert into content_revisions (table_name, record_id, snapshot) values (''x'', ''y'', ''{}'')', false);
select pg_temp.t('H05 nobody can edit revisions', :super, 'authenticated', 'update content_revisions set record_id = ''z''', false);

-- Last, because it changes the visitor's role.
select pg_temp.rows('R04 super admin can change roles', :super, 'authenticated', format('update user_roles set role = ''media_manager'' where user_id = %L', :visitor), 1);

select label, case when ok then 'PASS' else 'FAIL' end as result, case when ok then '' else detail end as detail from results order by label;
do $$
declare bad int; total int;
begin
  select count(*) filter (where not ok), count(*) into bad, total from results;
  raise notice '% checks, % failed', total, bad;
  if bad > 0 then raise exception '% geography checks failed', bad; end if;
end $$;
rollback;
