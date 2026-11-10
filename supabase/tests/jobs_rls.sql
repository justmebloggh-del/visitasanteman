-- Jobs & Careers: employers, vacancies, applications, CV storage, reports.
-- Run against a local database; everything is rolled back:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/jobs_rls.sql
begin;
create temp table results (label text, ok boolean, detail text);
grant all on results to public;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
select ('00000000-0000-0000-0000-00000000b0' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       r || '@jobs.invalid', case when r = 'unverifiedemail' then null else now() end, '{}', now(), now()
from (values ('01','admin'), ('02','regional'), ('03','editor'), ('04','employer'), ('05','employer2'), ('06','seeker'), ('07','seeker2'), ('08','unverifiedemail')) v(n, r);
update user_roles set role = 'admin'           where user_id = '00000000-0000-0000-0000-00000000b001';
update user_roles set role = 'regional_editor' where user_id = '00000000-0000-0000-0000-00000000b002';
update user_roles set role = 'editor'          where user_id = '00000000-0000-0000-0000-00000000b003';

insert into regions (id, slug, name) values ('00000000-0000-0000-0000-0000000000c1', 'jobs-test-region', 'Jobs test region');
insert into administrative_areas (id, region_id, slug, name, kind, is_active) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000c1', 'jobs-test-area', 'Jobs test area', 'district', true);
insert into employer_profiles (id, owner_id, slug, name) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000b004', 'test-employer', 'Test employer'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-00000000b005', 'test-employer-two', 'Second employer');
insert into job_vacancies (id, employer_id, slug, title, employment_type, description, administrative_area_id, status) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'pub-job', 'Published test job', 'full_time', 'A test vacancy description long enough.', '00000000-0000-0000-0000-0000000000c2', 'published'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d1', 'draft-job', 'Draft test job', 'full_time', 'A draft vacancy description long enough.', '00000000-0000-0000-0000-0000000000c2', 'draft'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d2', 'other-job', 'Other employer job', 'part_time', 'Another published vacancy description.', '00000000-0000-0000-0000-0000000000c2', 'published');

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

\set admin    '''00000000-0000-0000-0000-00000000b001'''
\set regional '''00000000-0000-0000-0000-00000000b002'''
\set editor   '''00000000-0000-0000-0000-00000000b003'''
\set emp      '''00000000-0000-0000-0000-00000000b004'''
\set emp2     '''00000000-0000-0000-0000-00000000b005'''
\set seeker   '''00000000-0000-0000-0000-00000000b006'''
\set seeker2  '''00000000-0000-0000-0000-00000000b007'''
\set noemail  '''00000000-0000-0000-0000-00000000b008'''
\set e1 '''00000000-0000-0000-0000-0000000000d1'''
\set e2 '''00000000-0000-0000-0000-0000000000d2'''
\set v1 '''00000000-0000-0000-0000-0000000000e1'''
\set v2 '''00000000-0000-0000-0000-0000000000e2'''
\set v3 '''00000000-0000-0000-0000-0000000000e3'''
\set area '''00000000-0000-0000-0000-0000000000c2'''

-- Public visibility
select pg_temp.visible('J01 anonymous visitors see only published vacancies', null, 'anon', 'select 1 from job_vacancies where slug in (''pub-job'',''draft-job'',''other-job'')', 2);
select pg_temp.visible('J02 anonymous visitors cannot read applications', null, 'anon', 'select 1 from job_applications', 0);
select pg_temp.t('J03 anonymous visitors cannot insert vacancies', null, 'anon', format('insert into job_vacancies (employer_id, slug, title, employment_type, description) values (%L, ''x-anon'', ''Anon job'', ''full_time'', ''Long enough description here.'')', :e1), false);

-- Employers
select pg_temp.t('J10 a signed-in verified user can create an employer profile', :seeker, 'authenticated', format('insert into employer_profiles (owner_id, slug, name) values (%L, ''seeker-co'', ''Seeker Co'')', :seeker), true);
select pg_temp.t('J11 an unverified email cannot create an employer profile', :noemail, 'authenticated', format('insert into employer_profiles (owner_id, slug, name) values (%L, ''noemail-co'', ''No Email Co'')', :noemail), false);
select pg_temp.t('J12 a new employer cannot self-verify on insert', :seeker2, 'authenticated', format('insert into employer_profiles (owner_id, slug, name, verification_status) values (%L, ''sneaky'', ''Sneaky'', ''verified'')', :seeker2), false);
select pg_temp.t('J13 an employer cannot verify themselves', :emp, 'authenticated', format('update employer_profiles set verification_status = ''verified'' where id = %L', :e1), false);
select pg_temp.t('J14 an employer can request verification', :emp, 'authenticated', format('update employer_profiles set verification_status = ''pending'' where id = %L', :e1), true);
select pg_temp.rows('J15 an employer cannot edit another employer', :emp, 'authenticated', 'update employer_profiles set description = ''hijack'' where slug = ''test-employer-two''', 0);
select pg_temp.rows('J16 an administrator can verify an employer', :admin, 'authenticated', format('update employer_profiles set verification_status = ''verified'', verified_at = now() where id = %L', :e1), 1);
select pg_temp.rows('J17 an editor cannot suspend an employer', :editor, 'authenticated', 'update employer_profiles set verification_status = ''suspended'' where slug = ''test-employer-two''', 0);

-- Vacancies
select pg_temp.t('J20 an employer can create a draft vacancy', :emp, 'authenticated', format('insert into job_vacancies (employer_id, slug, title, employment_type, description) values (%L, ''new-draft'', ''New draft'', ''contract'', ''A new draft vacancy description.'')', :e1), true);
select pg_temp.t('J21 an employer cannot insert a published vacancy', :emp, 'authenticated', format('insert into job_vacancies (employer_id, slug, title, employment_type, description, status, administrative_area_id) values (%L, ''self-pub'', ''Self published'', ''contract'', ''A self published vacancy description.'', ''published'', %L)', :e1, :area), false);
select pg_temp.t('J22 an employer cannot publish their own draft', :emp, 'authenticated', format('update job_vacancies set status = ''published'' where id = %L', :v2), false);
select pg_temp.t('J23 an employer can submit a draft for review', :emp, 'authenticated', format('update job_vacancies set status = ''pending_review'' where id = %L', :v2), true);
select pg_temp.rows('J24 an editor cannot publish a vacancy', :editor, 'authenticated', format('update job_vacancies set status = ''published'' where id = %L', :v2), 0);
select pg_temp.rows('J25 a regional editor can publish a vacancy', :regional, 'authenticated', format('update job_vacancies set status = ''published'' where id = %L', :v2), 1);
select pg_temp.visible('J26 a published vacancy gets publication and expiry dates', :admin, 'authenticated', format('select 1 from job_vacancies where id = %L and expires_at is not null and published_at is not null', :v2), 1);
select pg_temp.rows('J27 an employer cannot edit another employer''s vacancy', :emp, 'authenticated', format('update job_vacancies set title = ''hijack'' where id = %L', :v3), 0);
select pg_temp.t('J28 an employer cannot move a vacancy to another employer', :emp, 'authenticated', format('update job_vacancies set employer_id = %L where id = %L', :e2, :v1), false);

-- Applications
select pg_temp.t('J30 a job seeker can apply to a published vacancy', :seeker, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name, cover_note) values (%L, %L, ''Test Seeker'', ''Hello'')', :v1, :seeker), true);
select pg_temp.t('J31 applying twice is refused', :seeker, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name) values (%L, %L, ''Test Seeker'')', :v1, :seeker), false);
select pg_temp.t('J32 nobody can apply as someone else', :seeker2, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name) values (%L, %L, ''Impostor'')', :v1, :seeker), false);
select pg_temp.t('J33 an application to an unpublished vacancy is refused', :seeker2, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name) values ((select id from job_vacancies where slug = ''new-draft''), %L, ''Test Seeker Two'')', :seeker2), false);
select pg_temp.t('J34 an employer cannot apply to their own vacancy', :emp, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name) values (%L, %L, ''Own Employer'')', :v1, :emp), false);
select pg_temp.t('J35 an applicant cannot insert a pre-shortlisted application', :seeker2, 'authenticated', format('insert into job_applications (vacancy_id, applicant_id, applicant_name, status) values (%L, %L, ''Test Seeker Two'', ''shortlisted'')', :v1, :seeker2), false);
select pg_temp.visible('J36 the applicant sees their own application', :seeker, 'authenticated', 'select 1 from job_applications', 1);
select pg_temp.visible('J37 another job seeker sees no applications', :seeker2, 'authenticated', 'select 1 from job_applications', 0);
select pg_temp.visible('J38 the receiving employer sees the application', :emp, 'authenticated', 'select 1 from job_applications', 1);
select pg_temp.visible('J39 a different employer sees no applications', :emp2, 'authenticated', 'select 1 from job_applications', 0);
select pg_temp.visible('J40 editors cannot read applications', :editor, 'authenticated', 'select 1 from job_applications', 0);
select pg_temp.visible('J41 administrators can read applications for complaints', :admin, 'authenticated', 'select 1 from job_applications', 1);
select pg_temp.rows('J42 the employer can shortlist', :emp, 'authenticated', 'update job_applications set status = ''shortlisted''', 1);
select pg_temp.t('J43 the employer cannot edit the cover note', :emp, 'authenticated', 'update job_applications set cover_note = ''edited''', false);
select pg_temp.t('J44 the applicant cannot promote themselves', :seeker, 'authenticated', 'update job_applications set status = ''offered''', false);
select pg_temp.t('J46 the employer cannot mark an application withdrawn', :emp, 'authenticated', 'update job_applications set status = ''withdrawn''', false);
select pg_temp.rows('J45 the applicant can withdraw', :seeker, 'authenticated', 'update job_applications set status = ''withdrawn''', 1);
select pg_temp.rows('J47 another job seeker cannot delete the application', :seeker2, 'authenticated', 'delete from job_applications', 0);
select pg_temp.rows('J48 the applicant can delete their own application', :seeker, 'authenticated', 'delete from job_applications', 1);

-- Reports and saved jobs
select pg_temp.t('J50 a signed-in user can report a vacancy', :seeker2, 'authenticated', format('insert into job_reports (vacancy_id, reporter_id, reason) values (%L, %L, ''asks_for_payment'')', :v1, :seeker2), true);
select pg_temp.t('J51 anonymous visitors cannot report', null, 'anon', format('insert into job_reports (vacancy_id, reporter_id, reason) values (%L, %L, ''looks_fake'')', :v1, :seeker2), false);
select pg_temp.visible('J52 job seekers cannot read reports', :seeker2, 'authenticated', 'select 1 from job_reports', 0);
select pg_temp.visible('J53 editors can read reports', :editor, 'authenticated', 'select 1 from job_reports', 1);
select pg_temp.t('J54 a user can save a vacancy', :seeker2, 'authenticated', format('insert into saved_jobs (user_id, vacancy_id) values (%L, %L)', :seeker2, :v1), true);
select pg_temp.visible('J55 saved vacancies are private', :seeker, 'authenticated', 'select 1 from saved_jobs', 0);

-- Suspension hides everything
select pg_temp.rows('J60 an administrator can suspend an employer', :admin, 'authenticated', format('update employer_profiles set verification_status = ''suspended'', suspended_reason = ''test'' where id = %L', :e1), 1);
select pg_temp.visible('J61 a suspended employer''s vacancies disappear from the public', null, 'anon', 'select 1 from job_vacancies where slug in (''pub-job'', ''draft-job'')', 0);

-- CV storage
insert into results select 'J70 the cvs bucket is private and limited to PDF and Word',
  (select not public and file_size_limit <= 5242880 and not ('image/png' = any(allowed_mime_types)) from storage.buckets where id = 'cvs'), 'checked';
select pg_temp.t('J71 a user can upload a CV into their own folder', :seeker, 'authenticated', format('insert into storage.objects (bucket_id, name, owner) values (''cvs'', %L, %L)', trim(both '''' from :seeker) || '/cv.pdf', trim(both '''' from :seeker)::uuid), true);
select pg_temp.t('J72 a user cannot upload into someone else''s folder', :seeker, 'authenticated', format('insert into storage.objects (bucket_id, name, owner) values (''cvs'', %L, %L)', trim(both '''' from :seeker2) || '/cv.pdf', trim(both '''' from :seeker)::uuid), false);

select label, case when ok then 'PASS' else 'FAIL' end as result, case when ok then '' else detail end as detail from results order by label;
do $$
declare bad int; total int;
begin
  select count(*) filter (where not ok), count(*) into bad, total from results;
  raise notice '% checks, % failed', total, bad;
  if bad > 0 then raise exception '% jobs checks failed', bad; end if;
end $$;
rollback;
