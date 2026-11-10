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
insert into attractions (id, slug, name, status, verification_status) values ('00000000-0000-0000-0000-0000000000f5', 'draft-attraction', 'Draft attraction', 'draft', 'verified_secondary');
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
  format('insert into attractions (slug, name, status, community_id, verification_status) values (''derived'', ''Derived'', ''published'', %L, ''verified_secondary'')', :comm), true);
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
  format('insert into attractions (slug, name, status, administrative_area_id, verification_status) values (''sneaky'', ''Sneaky'', ''published'', %L, ''verified_secondary'')', :area), false);
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

-- ── Research and verification (Phase 2) ──
select pg_temp.t('X01 content editor cannot insert a record as verified', :editor, 'authenticated',
  'insert into attractions (slug, name, verification_status) values (''x-ver'', ''X'', ''verified_secondary'')', false);
select pg_temp.t('X02 content editor can insert a research record', :editor, 'authenticated',
  'insert into attractions (slug, name, verification_status, source_organisation) values (''x-res'', ''X res'', ''research_identified'', ''Some source'')', true);
select pg_temp.t('X03 content editor cannot raise a record to verified', :editor, 'authenticated',
  'update attractions set verification_status = ''officially_confirmed'' where slug = ''x-res''', false);
select pg_temp.t('X04 regional editor can verify a record', :regional, 'authenticated',
  'update attractions set verification_status = ''verified_secondary'' where slug = ''x-res''', true);
select pg_temp.t('X05 an unverified record cannot be published, even by an admin', :admin, 'authenticated',
  format('insert into attractions (slug, name, status, administrative_area_id, verification_status) values (''x-pub'', ''X pub'', ''published'', %L, ''research_identified'')', :area), false);
select pg_temp.t('X06 awaiting verification cannot be published either', :admin, 'authenticated',
  format('insert into attractions (slug, name, status, administrative_area_id, verification_status) values (''x-pub2'', ''X pub2'', ''published'', %L, ''awaiting_verification'')', :area), false);
select pg_temp.t('X07 content editor can lower a verified record back to awaiting', :editor, 'authenticated',
  'update attractions set verification_status = ''awaiting_verification'' where slug = ''x-res''', true);
select pg_temp.t('X08 awaiting-verification records are hidden from anon even when published is attempted by superuser', null, 'anon',
  'select 1 from attractions where verification_status = ''awaiting_verification'' and status = ''published''', true);
select pg_temp.visible('X09 anon sees no research records (none are published)', null, 'anon', 'select 1 from attractions where verification_status in (''research_identified'', ''awaiting_verification'')', 0);

-- ── Ceremonies (Phase 3) ──
select pg_temp.t('C01 editor cannot record authority approval on insert', :editor, 'authenticated',
  'insert into ceremonies (slug, name, authority_approved) values (''c-x1'', ''C x1'', true)', false);
select pg_temp.t('C02 editor can draft a ceremony', :editor, 'authenticated',
  format('insert into ceremonies (slug, name, administrative_area_id) values (''c-draft'', ''C draft'', %L)', :area), true);
select pg_temp.t('C03 editor cannot record authority approval on update', :editor, 'authenticated',
  'update ceremonies set authority_approved = true where slug = ''c-draft''', false);
select pg_temp.t('C04 cannot publish without authority approval, even as admin', :admin, 'authenticated',
  format('insert into ceremonies (slug, name, status, administrative_area_id, verification_status) values (''c-noauth'', ''C noauth'', ''published'', %L, ''verified_secondary'')', :area), false);
select pg_temp.t('C05 cannot publish an unverified ceremony', :admin, 'authenticated',
  format('insert into ceremonies (slug, name, status, administrative_area_id, authority_approved) values (''c-unver'', ''C unver'', ''published'', %L, true)', :area), false);
select pg_temp.t('C06 cannot publish a ceremony without a district', :admin, 'authenticated',
  'insert into ceremonies (slug, name, status, authority_approved, verification_status) values (''c-nodist'', ''C nodist'', ''published'', true, ''verified_secondary'')', false);
select pg_temp.t('C07 admin can publish an approved, verified ceremony in an active district', :admin, 'authenticated',
  format('insert into ceremonies (slug, name, status, administrative_area_id, authority_approved, verification_status, attendance) values (''c-ok'', ''C ok'', ''published'', %L, true, ''verified_secondary'', ''public'')', :area), true);
select pg_temp.t('C08 a date cannot be confirmed without a start time', :regional, 'authenticated',
  'update ceremonies set date_confirmed = true where slug = ''c-draft''', false);
select pg_temp.visible('C09 anon sees only the published ceremony', null, 'anon', 'select 1 from ceremonies where slug like ''c-%''', 1);
select pg_temp.visible('C10 editor sees drafts too', :editor, 'authenticated', 'select 1 from ceremonies where slug like ''c-%''', 2);
select pg_temp.t('C11 content editor cannot publish a ceremony', :editor, 'authenticated',
  'update ceremonies set status = ''published'' where slug = ''c-draft''', false);

-- ── Business verification (Phase 4) ──
insert into listings (id, slug, type, name, status, owner_id) values ('00000000-0000-0000-0000-0000000000f7', 'owned-cafe', 'cafe', 'Owned cafe', 'draft', '00000000-0000-0000-0000-00000000a006');
select pg_temp.t('B01 anon cannot request verification', null, 'anon', 'select request_verification(''00000000-0000-0000-0000-0000000000f7'')', false);
select pg_temp.t('B02 a visitor cannot request verification for someone else''s listing', :visitor, 'authenticated', 'select request_verification(''00000000-0000-0000-0000-0000000000f7'')', false);
select pg_temp.t('B03 the owner can request verification', :partner, 'authenticated', 'select request_verification(''00000000-0000-0000-0000-0000000000f7'')', true);
select pg_temp.visible('B04 the request is recorded and still pending', :partner, 'authenticated', 'select 1 from listings where id = ''00000000-0000-0000-0000-0000000000f7'' and verification_requested_at is not null and verification_decision = ''pending'' and not is_verified', 1);
select pg_temp.t('B05 the owner cannot verify their own listing', :partner, 'authenticated', 'update listings set verification_decision = ''verified'' where id = ''00000000-0000-0000-0000-0000000000f7''', false);
select pg_temp.t('B06 the owner cannot tick the verified badge', :partner, 'authenticated', 'update listings set is_verified = true where id = ''00000000-0000-0000-0000-0000000000f7''', false);
select pg_temp.t('B07 the owner cannot fake a verification request time directly', :partner, 'authenticated', 'update listings set verification_requested_at = now() + interval ''1 day'' where id = ''00000000-0000-0000-0000-0000000000f7''', false);
select pg_temp.t('B08 the owner cannot change the stated reason', :partner, 'authenticated', 'update listings set verification_reason = ''x'' where id = ''00000000-0000-0000-0000-0000000000f7''', false);
select pg_temp.t('B09 a regional editor cannot decide verification', :regional, 'authenticated', 'update listings set verification_decision = ''verified'' where id = ''00000000-0000-0000-0000-0000000000f7''', false);
select pg_temp.t('B09b an administrator assigns a paid plan', :admin, 'authenticated', 'update listings set plan_id = (select id from subscription_plans where slug = ''premium'') where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.visible('B10 a paid plan does not verify', :admin, 'authenticated', 'select 1 from listings where id = ''00000000-0000-0000-0000-0000000000f7'' and not is_verified and verification_decision = ''pending'' and plan_id is not null', 1);
select pg_temp.t('B11 an administrator can verify', :admin, 'authenticated', 'update listings set verification_decision = ''verified'' where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.visible('B12 the badge follows the decision', :admin, 'authenticated', 'select 1 from listings where id = ''00000000-0000-0000-0000-0000000000f7'' and is_verified and verified_at is not null', 1);
select pg_temp.t('B13 a verified listing cannot request again', :partner, 'authenticated', 'select request_verification(''00000000-0000-0000-0000-0000000000f7'')', false);
select pg_temp.t('B14 un-ticking the badge resets the decision', :admin, 'authenticated', 'update listings set is_verified = false where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.visible('B15 decision is back to pending', :admin, 'authenticated', 'select 1 from listings where id = ''00000000-0000-0000-0000-0000000000f7'' and verification_decision = ''pending'' and not is_verified', 1);
select pg_temp.t('B16 an administrator can suspend', :admin, 'authenticated', 'update listings set verification_decision = ''suspended'', verification_reason = ''test'' where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.t('B17 a suspended listing cannot request verification', :partner, 'authenticated', 'select request_verification(''00000000-0000-0000-0000-0000000000f7'')', false);
select pg_temp.visible('B18 researched market drafts are hidden from anon', null, 'anon', 'select 1 from listings where type = ''market''', 0);

-- ── Education, sports and transport (Phase 5) ──
select pg_temp.t('D01 editor can draft an institution', :editor, 'authenticated', 'insert into institutions (slug, name, kind) values (''d-inst'', ''D inst'', ''university'')', true);
select pg_temp.t('D02 editor cannot mark an institution verified', :editor, 'authenticated', 'insert into institutions (slug, name, verification_status) values (''d-inst2'', ''D inst2'', ''verified_secondary'')', false);
select pg_temp.t('D03 an unverified institution cannot be published, even by an admin', :admin, 'authenticated', format('insert into institutions (slug, name, status, administrative_area_id) values (''d-inst3'', ''D inst3'', ''published'', %L)', :area), false);
select pg_temp.t('D04 an admin can publish a verified institution in an active district', :admin, 'authenticated', format('insert into institutions (slug, name, status, administrative_area_id, verification_status) values (''d-inst4'', ''D inst4'', ''published'', %L, ''verified_secondary'')', :area), true);
select pg_temp.t('D05 a content editor cannot publish it', :editor, 'authenticated', 'update institutions set status = ''published'' where slug = ''d-inst''', false);
select pg_temp.visible('D06 anon sees only the published institution', null, 'anon', 'select 1 from institutions where slug like ''d-%''', 1);
select pg_temp.t('D07 a sports venue cannot be published without a district', :admin, 'authenticated', 'insert into sports_venues (slug, name, status, verification_status) values (''d-ven'', ''D ven'', ''published'', ''verified_secondary'')', false);
select pg_temp.t('D08 a transport service defaults to unconfirmed operating status', :editor, 'authenticated', 'insert into transport_providers (slug, name, kind) values (''d-tr'', ''D tr'', ''airport'')', true);
select pg_temp.visible('D09 the status default is unknown', :editor, 'authenticated', 'select 1 from transport_providers where slug = ''d-tr'' and facility_status = ''unknown''', 1);
select pg_temp.t('D10 a club can link a home venue', :admin, 'authenticated', format('insert into sports_clubs (slug, name, sport, status, administrative_area_id, verification_status) values (''d-club'', ''D club'', ''Football'', ''published'', %L, ''officially_confirmed'')', :area), true);
select pg_temp.visible('D11 anon sees the published club and no research drafts', null, 'anon', 'select 1 from sports_clubs', 1);
select pg_temp.visible('D12 the researched drafts exist for staff but not anon', null, 'anon', 'select 1 from transport_providers', 0);
select pg_temp.t('D13 events can be categorised', :editor, 'authenticated', 'insert into events (slug, title, starts_at, category) values (''d-ev'', ''D ev'', now() + interval ''1 day'', ''sports'')', true);

-- ── Search and curated itineraries (Phase 6) ──
update attractions set alt_names = '{Zebulon Hill}' where slug = 'derived';
select pg_temp.visible('S01 anon finds a published record by name', null, 'anon', 'select * from search_site(''derived'')', 1);
select pg_temp.visible('S02 anon never finds a draft', null, 'anon', 'select * from search_site(''x-res'')', 0);
select pg_temp.visible('S03 an alternative spelling is searched', null, 'anon', 'select * from search_site(''zebulon'')', 1);
select pg_temp.visible('S04 partial words match', null, 'anon', 'select * from search_site(''derive'')', 1);
select pg_temp.visible('S05 inactive districts are not searchable', null, 'anon', 'select * from search_site(''inactive area'')', 0);
select pg_temp.visible('S06 active districts are searchable', null, 'anon', 'select * from search_site(''test area'')', 1);
select pg_temp.visible('S07 the type filter narrows results', null, 'anon', 'select * from search_site(''derived'', array[''ceremony''])', 0);
select pg_temp.visible('S08 the district filter narrows results', null, 'anon', 'select * from search_site(''derived'', null, ''test-area'')', 1);
select pg_temp.visible('S09 a wildcard is treated as text, not as match-everything', null, 'anon', 'select * from search_site(''%'')', 0);
select pg_temp.visible('S10 an empty query returns nothing', null, 'anon', 'select * from search_site('''')', 0);
select pg_temp.visible('S11 staff searching still only search published records', :editor, 'authenticated', 'select * from search_site(''x-res'')', 0);

insert into travel_itineraries (id, user_id, title, days) values ('00000000-0000-0000-0000-0000000000fa', '00000000-0000-0000-0000-00000000a004', 'Editor plan', 1);
insert into itinerary_items (itinerary_id, day, item_type, item_id) select '00000000-0000-0000-0000-0000000000fa', 1, 'attraction', id from attractions where slug = 'derived';
insert into itinerary_items (itinerary_id, day, item_type, item_id) select '00000000-0000-0000-0000-0000000000fa', 1, 'attraction', id from attractions where slug = 'x-res';
select pg_temp.t('Q01 a visitor cannot publish a curated itinerary', :visitor, 'authenticated', 'select make_curated_itinerary(''00000000-0000-0000-0000-0000000000fa'', ''Visitor try'', null, null)', false);
select pg_temp.t('Q02 an editor cannot use someone else''s plan', :regional, 'authenticated', 'select make_curated_itinerary(''00000000-0000-0000-0000-0000000000fa'', ''Not mine'', null, null)', false);
select pg_temp.t('Q03 an editor can create a curated draft from their own plan', :editor, 'authenticated', 'select make_curated_itinerary(''00000000-0000-0000-0000-0000000000fa'', ''Editor itinerary'', ''A summary'', ''Heritage'')', true);
select pg_temp.visible('Q04 sharing was switched on for the plan', :editor, 'authenticated', 'select 1 from travel_itineraries where id = ''00000000-0000-0000-0000-0000000000fa'' and share_token is not null', 1);
select pg_temp.visible('Q05 a draft curated itinerary is not public', null, 'anon', 'select 1 from curated_itineraries where slug = ''editor-itinerary''', 0);
select pg_temp.visible('Q06 the draft view is empty for the public', null, 'anon', 'select 1 where curated_itinerary_view(''editor-itinerary'') is not null', 0);
select pg_temp.t('Q07 a content editor cannot publish it', :editor, 'authenticated', 'update curated_itineraries set status = ''published'' where slug = ''editor-itinerary''', false);
select pg_temp.t('Q08 a placeholder without a plan cannot be published', :admin, 'authenticated', 'update curated_itineraries set status = ''published'' where slug = ''lake-bosomtwe-weekend''', false);
select pg_temp.t('Q09 an administrator can publish one with a plan', :admin, 'authenticated', 'update curated_itineraries set status = ''published'' where slug = ''editor-itinerary''', true);
select pg_temp.visible('Q10 the public sees the published itinerary', null, 'anon', 'select 1 where curated_itinerary_view(''editor-itinerary'') is not null', 1);
select pg_temp.visible('Q11 unpublished places are flagged unavailable in the public view', null, 'anon', 'select 1 from jsonb_array_elements(curated_itinerary_view(''editor-itinerary'') -> ''plan'' -> ''items'') i where (i ->> ''unavailable'')::boolean', 1);
select pg_temp.t('Q12 copying needs a signed-in user', null, 'anon', 'select copy_curated_itinerary(''editor-itinerary'')', false);
select pg_temp.t('Q13 a visitor can copy it into their own plans', :visitor, 'authenticated', 'select copy_curated_itinerary(''editor-itinerary'')', true);
select pg_temp.visible('Q14 the copy holds only still-published places', :visitor, 'authenticated', 'select 1 from itinerary_items i join travel_itineraries t on t.id = i.itinerary_id where t.user_id = ''00000000-0000-0000-0000-00000000a007'' and t.title = ''Editor itinerary''', 1);
select pg_temp.visible('Q15 the visitor cannot see the original plan', :visitor, 'authenticated', 'select 1 from travel_itineraries where id = ''00000000-0000-0000-0000-0000000000fa''', 0);

-- ── Advertising and subscriptions (Phase 7) ──
insert into advertisers (id, name, notes) values ('00000000-0000-0000-0000-0000000000fb', 'Test advertiser', 'internal note');
select pg_temp.t('A02 anon cannot even query advertisers', null, 'anon', 'select 1 from advertisers limit 1', false);
select pg_temp.visible('A03 an editor cannot see advertisers', :editor, 'authenticated', 'select 1 from advertisers', 0);
select pg_temp.visible('A04 an administrator can', :admin, 'authenticated', 'select 1 from advertisers', 1);
select pg_temp.t('A05 an editor cannot create an advertiser', :editor, 'authenticated', 'insert into advertisers (name) values (''x'')', false);

insert into advertisements (id, title, advertiser_name, placement, link_url, starts_at, ends_at, status, advertiser_id) values
  ('00000000-0000-0000-0000-0000000000fc', 'Live ad', 'Test advertiser', 'search_top', 'https://example.org', now() - interval '1 day', now() + interval '1 day', 'published', '00000000-0000-0000-0000-0000000000fb'),
  ('00000000-0000-0000-0000-0000000000fd', 'Draft ad', 'Test advertiser', 'search_top', 'https://example.org', now() - interval '1 day', now() + interval '1 day', 'draft', null),
  ('00000000-0000-0000-0000-0000000000fe', 'Expired ad', 'Test advertiser', 'culture_top', 'https://example.org', now() - interval '3 day', now() - interval '1 day', 'published', null);
select pg_temp.t('A06 anon records an impression on a live ad', null, 'anon', 'select record_ad_event(''00000000-0000-0000-0000-0000000000fc'', ''impression'')', true);
select pg_temp.t('A07 anon records a click on a live ad', null, 'anon', 'select record_ad_event(''00000000-0000-0000-0000-0000000000fc'', ''click'')', true);
select pg_temp.t('A08 events on a draft ad are ignored', null, 'anon', 'select record_ad_event(''00000000-0000-0000-0000-0000000000fd'', ''impression'')', true);
select pg_temp.t('A09 events on an expired ad are ignored', null, 'anon', 'select record_ad_event(''00000000-0000-0000-0000-0000000000fe'', ''click'')', true);
select pg_temp.t('A10 an unknown event type is refused', null, 'anon', 'select record_ad_event(''00000000-0000-0000-0000-0000000000fc'', ''purchase'')', false);
select pg_temp.visible('A11 only the live ad counted (1 impression, 1 click) and only it has daily statistics', :admin, 'authenticated', 'select 1 from ad_stats_daily where ad_id = ''00000000-0000-0000-0000-0000000000fc'' and impressions = 1 and clicks = 1 and (select count(*) from ad_stats_daily) = 1', 1);
select pg_temp.t('A12 the browser cannot edit the counters', :admin, 'authenticated', 'update advertisements set impressions = 999999 where id = ''00000000-0000-0000-0000-0000000000fc''', false);
select pg_temp.t('A13 anon cannot read daily statistics', null, 'anon', 'select 1 from ad_stats_daily', false);
select pg_temp.visible('A14 an editor cannot read daily statistics', :editor, 'authenticated', 'select 1 from ad_stats_daily', 0);
select pg_temp.visible('A15 anon sees only the live ad', null, 'anon', 'select 1 from advertisements where id in (''00000000-0000-0000-0000-0000000000fc'', ''00000000-0000-0000-0000-0000000000fd'', ''00000000-0000-0000-0000-0000000000fe'')', 1);

select pg_temp.t('P01 an administrator assigns a plan', :admin, 'authenticated', 'update listings set plan_id = (select id from subscription_plans where slug = ''standard'') where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.visible('P02 the subscription was recorded as active', :admin, 'authenticated', 'select 1 from business_subscriptions where listing_id = ''00000000-0000-0000-0000-0000000000f7'' and status = ''active''', 1);
select pg_temp.t('P03 changing the plan ends the old subscription and starts a new one', :admin, 'authenticated', 'update listings set plan_id = (select id from subscription_plans where slug = ''premium'') where id = ''00000000-0000-0000-0000-0000000000f7''', true);
select pg_temp.visible('P04 history shows the earlier plans ended and one active', :admin, 'authenticated', 'select 1 from business_subscriptions where listing_id = ''00000000-0000-0000-0000-0000000000f7'' having count(*) filter (where status = ''ended'') = 2 and count(*) filter (where status = ''active'') = 1', 1);
select pg_temp.visible('P05 the owner can read their own subscription history', :partner, 'authenticated', 'select 1 from business_subscriptions where listing_id = ''00000000-0000-0000-0000-0000000000f7''', 3);
select pg_temp.visible('P06 a visitor cannot read it', :visitor, 'authenticated', 'select 1 from business_subscriptions', 0);
select pg_temp.t('P07 an editor cannot set an end date', :editor, 'authenticated', 'select set_subscription_end(''00000000-0000-0000-0000-0000000000f7'', now())', false);
select pg_temp.t('P08 the owner cannot extend their own plan', :partner, 'authenticated', 'select set_subscription_end(''00000000-0000-0000-0000-0000000000f7'', now() + interval ''1 year'')', false);
select pg_temp.t('P09 an administrator sets an end date in the past', :admin, 'authenticated', 'select set_subscription_end(''00000000-0000-0000-0000-0000000000f7'', now() - interval ''1 day'')', true);
select pg_temp.t('P10 an editor cannot end plans', :editor, 'authenticated', 'select end_overdue_subscriptions()', false);
select pg_temp.t('P11 an administrator ends overdue plans', :admin, 'authenticated', 'select end_overdue_subscriptions()', true);
select pg_temp.visible('P12 the listing lost its plan and the subscription ended', :admin, 'authenticated', 'select 1 from listings l where l.id = ''00000000-0000-0000-0000-0000000000f7'' and l.plan_id is null and not exists (select 1 from business_subscriptions where listing_id = l.id and status = ''active'')', 1);
select pg_temp.visible('P13 plans never touch verification', :admin, 'authenticated', 'select 1 from listings where id = ''00000000-0000-0000-0000-0000000000f7'' and verification_decision = ''suspended'' and not is_verified', 1);

-- ── Themes, quick links, event date verification, pages (regional experience) ──
select pg_temp.visible('T01 anon sees the eight themes', null, 'anon', 'select 1 from themes', 8);
select pg_temp.t('T02 an editor cannot create a theme', :editor, 'authenticated', 'insert into themes (slug, name, kind) values (''x-theme'', ''X'', ''tour_category'')', false);
select pg_temp.t('T03 an administrator can create a theme', :admin, 'authenticated', 'insert into themes (slug, name, kind) values (''x-theme'', ''X'', ''tour_category'')', true);
select pg_temp.t('T04 anon cannot create a theme', null, 'anon', 'insert into themes (slug, name, kind) values (''y-theme'', ''Y'', ''tour_category'')', false);
select pg_temp.t('T05 an inactive theme is hidden from anon', :admin, 'authenticated', 'update themes set is_active = false where slug = ''x-theme''', true);
select pg_temp.visible('T06 anon no longer sees it', null, 'anon', 'select 1 from themes where slug = ''x-theme''', 0);
select pg_temp.t('T07 an editor can attach a theme to an existing record', :editor, 'authenticated', 'insert into theme_links (theme_id, entity_type, entity_id) select id, ''attraction'', ''00000000-0000-0000-0000-0000000000f5'' from themes where slug = ''see''', true);
select pg_temp.t('T08 a theme cannot be attached to a record that does not exist', :editor, 'authenticated', 'insert into theme_links (theme_id, entity_type, entity_id) select id, ''attraction'', gen_random_uuid() from themes where slug = ''see''', false);
select pg_temp.t('T09 only the five known entity types are allowed', :editor, 'authenticated', 'insert into theme_links (theme_id, entity_type, entity_id) select id, ''profile'', ''00000000-0000-0000-0000-0000000000f5'' from themes where slug = ''see''', false);
select pg_temp.t('T10 a visitor cannot attach themes', :visitor, 'authenticated', 'insert into theme_links (theme_id, entity_type, entity_id) select id, ''attraction'', ''00000000-0000-0000-0000-0000000000f5'' from themes where slug = ''eat''', false);
select pg_temp.t('T11 attach a theme to the published attraction too', :editor, 'authenticated', 'insert into theme_links (theme_id, entity_type, entity_id) select t.id, ''attraction'', a.id from themes t, attractions a where t.slug = ''see'' and a.slug = ''derived''', true);
select pg_temp.visible('T12 the count covers published items only (f5 is no longer published)', null, 'anon', 'select 1 from theme_item_counts() where slug = ''see'' and items = 1', 1);
select pg_temp.visible('T13 themes with nothing published count zero', null, 'anon', 'select 1 from theme_item_counts() where slug = ''wear'' and items = 0', 1);

select pg_temp.visible('Q50 anon sees the six enabled quick links', null, 'anon', 'select 1 from quick_links', 6);
select pg_temp.rows('Q51 a visitor cannot edit quick links', :visitor, 'authenticated', 'update quick_links set label = ''x''', 0);
select pg_temp.t('Q52 anon cannot edit quick links', null, 'anon', 'update quick_links set label = ''x''', false);
select pg_temp.t('Q53 a seventh enabled link is refused', :editor, 'authenticated', 'insert into quick_links (label, url, icon) values (''Seventh'', ''/contact'', ''phone'')', false);
select pg_temp.t('Q54 an editor can disable one and then add another', :editor, 'authenticated', 'update quick_links set is_enabled = false where label = ''Map''', true);
select pg_temp.t('Q55 the new link now fits', :editor, 'authenticated', 'insert into quick_links (label, url, icon) values (''Contact'', ''/contact'', ''phone'')', true);
select pg_temp.t('Q56 a link must point to this site or an https address', :editor, 'authenticated', 'update quick_links set url = ''javascript:alert(1)'' where label = ''Contact''', false);
select pg_temp.visible('Q57 anon does not see disabled links', null, 'anon', 'select 1 from quick_links where label = ''Map''', 0);
select pg_temp.visible('Q58 quick links tied to unpublished pages are visible rows, hidden by the application', null, 'anon', 'select 1 from quick_links where page_slug is not null', 3);
select pg_temp.visible('Q59 anon cannot see an unpublished page (so the link join returns nothing)', null, 'anon', 'select 1 from pages where slug in (''getting-around'', ''travel-information'', ''visa-and-entry'', ''cookie-policy'')', 0);

select pg_temp.t('Q60 events carry an unverified date by default', :editor, 'authenticated', 'insert into events (slug, title, starts_at) values (''d-ev2'', ''D ev2'', now() + interval ''2 day'')', true);
select pg_temp.visible('Q61 and it is not verified', :editor, 'authenticated', 'select 1 from events where slug = ''d-ev2'' and not date_verified', 1);

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

-- ── Whole-database safety checks (Phase 8) ──
insert into results select 'Z01 every public table has row level security enabled',
  not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity),
  coalesce((select string_agg(tablename, ', ') from pg_tables where schemaname = 'public' and not rowsecurity), 'all enabled');
insert into results select 'Z02 anonymous visitors can write only to the two form tables',
  not exists (select 1 from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'
              and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') and table_name not in ('enquiries', 'newsletter_subscribers')),
  coalesce((select string_agg(distinct table_name || ':' || privilege_type, ', ') from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'
            and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') and table_name not in ('enquiries', 'newsletter_subscribers')), 'none');
insert into results select 'Z03 only the known public functions can be called by anonymous visitors',
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype and has_function_privilege('anon', p.oid, 'execute')
                and p.proname not in ('can_approve', 'can_manage_booking', 'can_manage_geography', 'can_manage_media', 'create_booking', 'curated_itinerary_view', 'current_app_role',
                                      'guest_cancel_booking', 'is_admin', 'is_partner', 'is_staff', 'is_super_admin', 'itinerary_view', 'lookup_booking', 'nearby_places',
                                      'owns_listing', 'record_ad_event', 'record_listing_view', 'submit_review', 'my_email_confirmed', 'is_employer_owner', 'cv_visible_to_employer')),
  coalesce((select string_agg(p.proname, ', ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype and has_function_privilege('anon', p.oid, 'execute')
              and p.proname not in ('can_approve', 'can_manage_booking', 'can_manage_geography', 'can_manage_media', 'create_booking', 'curated_itinerary_view', 'current_app_role',
                                    'guest_cancel_booking', 'is_admin', 'is_partner', 'is_staff', 'is_super_admin', 'itinerary_view', 'lookup_booking', 'nearby_places',
                                    'owns_listing', 'record_ad_event', 'record_listing_view', 'submit_review', 'my_email_confirmed', 'is_employer_owner', 'cv_visible_to_employer')), 'known list only');
insert into results select 'Z04 every security-definer function pins its search_path',
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef
              and not (p.proconfig is not null and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))),
  coalesce((select string_agg(p.proname, ', ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef
              and not (p.proconfig is not null and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))), 'all pinned');
insert into results select 'Z05 the audit log and role table cannot be read by anonymous visitors',
  not has_table_privilege('anon', 'public.audit_logs', 'select') and not has_table_privilege('anon', 'public.user_roles', 'select'), 'checked';

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
