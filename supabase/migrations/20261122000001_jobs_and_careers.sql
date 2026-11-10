-- Jobs & Careers.
-- Any signed-in, email-verified user can be a job seeker. Anyone can ask to become an employer by creating an employer profile; the profile
-- starts "unverified" and only an administrator can verify or suspend it. Vacancies reach the public only after an approver publishes them.
-- Applications and CVs are private to the applicant, the employer who received them and administrators. Job seekers are never charged.

-- Signed-in users cannot read auth.users directly, so the check lives in a definer function.
create or replace function my_email_confirmed() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null)
$$;
grant execute on function my_email_confirmed() to authenticated;

-- ───────────── Employers ─────────────
create table employer_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 150),
  description text check (char_length(description) <= 3000),
  website text check (website is null or website ~* '^https?://'),
  administrative_area_id uuid references administrative_areas (id) on delete set null,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'suspended')),
  verification_requested_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users (id),
  suspended_reason text,                       -- visible to the owner and administrators only in practice (no public page reads it)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger set_updated_at before update on employer_profiles for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on employer_profiles for each row execute function audit_row();

-- Owners may edit their profile and ask for verification (unverified -> pending). Everything else is administrator-only.
create or replace function guard_employer_privileged_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.verification_status <> 'unverified' or new.verified_at is not null or new.verified_by is not null or new.suspended_reason is not null then
      raise exception 'New employer profiles start unverified';
    end if;
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by or new.suspended_reason is distinct from old.suspended_reason then
    raise exception 'Only administrators can change verification or ownership fields';
  end if;
  if new.verification_status is distinct from old.verification_status
     and not (old.verification_status = 'unverified' and new.verification_status = 'pending') then
    raise exception 'Only administrators can change the verification status';
  end if;
  return new;
end $$;
create trigger tg_a_employer_guard before insert or update on employer_profiles for each row execute function guard_employer_privileged_fields();

alter table employer_profiles enable row level security;
create policy employers_public_read on employer_profiles for select using (verification_status <> 'suspended' and deleted_at is null);
create policy employers_owner_read on employer_profiles for select using (owner_id = auth.uid());
create policy employers_staff_read on employer_profiles for select using (is_staff());
create policy employers_owner_insert on employer_profiles for insert to authenticated
  with check (owner_id = auth.uid() and my_email_confirmed());
create policy employers_owner_update on employer_profiles for update using (owner_id = auth.uid() and verification_status <> 'suspended') with check (owner_id = auth.uid());
create policy employers_admin_all on employer_profiles for all using (is_admin()) with check (is_admin());

create or replace function is_employer_owner(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from employer_profiles where id = eid and owner_id = auth.uid())
$$;

-- ───────────── Categories ─────────────
create table job_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);
alter table job_categories enable row level security;
create policy job_categories_read on job_categories for select using (is_active or is_staff());
create policy job_categories_admin on job_categories for all using (is_admin()) with check (is_admin());
insert into job_categories (slug, name, sort_order) values
  ('administration', 'Administration', 1), ('engineering', 'Engineering', 2), ('technology', 'Technology', 3), ('healthcare', 'Healthcare', 4),
  ('education', 'Education', 5), ('hospitality', 'Hospitality', 6), ('tourism', 'Tourism', 7), ('construction', 'Construction', 8),
  ('finance', 'Finance', 9), ('sales-and-marketing', 'Sales and marketing', 10), ('transport-and-logistics', 'Transport and logistics', 11),
  ('agriculture', 'Agriculture', 12), ('security', 'Security', 13), ('manufacturing', 'Manufacturing', 14), ('skilled-trades', 'Skilled trades', 15),
  ('customer-service', 'Customer service', 16), ('management', 'Management', 17), ('creative-industries', 'Creative industries', 18)
on conflict (slug) do nothing;

-- ───────────── Vacancies ─────────────
create table job_vacancies (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references employer_profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 150),
  category_id uuid references job_categories (id) on delete set null,
  employment_type text not null check (employment_type in
    ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'national_service', 'graduate_trainee', 'apprenticeship', 'remote', 'hybrid')),
  description text not null check (char_length(description) between 20 and 8000),
  requirements text check (char_length(requirements) <= 4000),
  qualifications text check (char_length(qualifications) <= 1000),
  experience_required text check (char_length(experience_required) <= 300),
  salary_min numeric(12, 2) check (salary_min >= 0),
  salary_max numeric(12, 2) check (salary_max >= 0),
  salary_currency char(3) not null default 'GHS',
  salary_period text check (salary_period in ('hour', 'day', 'week', 'month', 'year')),
  administrative_area_id uuid references administrative_areas (id) on delete set null,
  location_note text check (char_length(location_note) <= 200),
  application_deadline date,
  status content_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  is_filled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (salary_max is null or salary_min is null or salary_max >= salary_min)
);
create index job_vacancies_public_idx on job_vacancies (status, published_at desc) where deleted_at is null;
create index job_vacancies_employer_idx on job_vacancies (employer_id);
create index job_vacancies_area_idx on job_vacancies (administrative_area_id);
create trigger set_updated_at before update on job_vacancies for each row execute function set_updated_at();
create trigger audit_row after insert or update or delete on job_vacancies for each row execute function audit_row();
create trigger tg_b_publish_area before insert or update on job_vacancies for each row execute function guard_publish_requires_area();
create trigger tg_c_workflow before insert or update on job_vacancies for each row execute function guard_editorial_workflow();

-- Vacancy rules: owners cannot move their own vacancy past "in review" (the workflow trigger covers approved/published),
-- cannot change the employer, and a suspended or deleted employer cannot get anything published. Published vacancies expire.
create or replace function guard_vacancy() returns trigger
language plpgsql security definer set search_path = public as $$
declare emp employer_profiles;
begin
  select * into emp from employer_profiles where id = new.employer_id;
  if tg_op = 'UPDATE' and new.employer_id is distinct from old.employer_id and auth.uid() is not null and not is_admin() then
    raise exception 'A vacancy cannot be moved to another employer';
  end if;
  if new.status = 'published' and (emp.verification_status = 'suspended' or emp.deleted_at is not null) then
    raise exception 'A suspended employer cannot have published vacancies';
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
    new.expires_at := coalesce(new.expires_at, new.published_at + interval '30 days');
  end if;
  return new;
end $$;
create trigger tg_d_vacancy before insert or update on job_vacancies for each row execute function guard_vacancy();

alter table job_vacancies enable row level security;
create policy vacancies_public_read on job_vacancies for select using (
  status = 'published' and deleted_at is null and not is_filled and (expires_at is null or expires_at > now())
  and (application_deadline is null or application_deadline >= current_date)
  and exists (select 1 from employer_profiles e where e.id = employer_id and e.verification_status <> 'suspended' and e.deleted_at is null)
);
create policy vacancies_owner_read on job_vacancies for select using (is_employer_owner(employer_id));
create policy vacancies_owner_insert on job_vacancies for insert to authenticated with check (is_employer_owner(employer_id) and status in ('draft', 'pending_review'));
create policy vacancies_owner_update on job_vacancies for update using (is_employer_owner(employer_id)) with check (is_employer_owner(employer_id));
create policy vacancies_staff_read on job_vacancies for select using (is_staff());
create policy vacancies_approver_write on job_vacancies for update using (can_approve()) with check (can_approve());
create policy vacancies_admin_all on job_vacancies for all using (is_admin()) with check (is_admin());

-- ───────────── Applications ─────────────
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references job_vacancies (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  applicant_name text not null check (char_length(applicant_name) between 2 and 120),
  applicant_phone text check (char_length(applicant_phone) <= 40),
  cover_note text check (char_length(cover_note) <= 3000),
  cv_path text check (cv_path is null or cv_path like applicant_id::text || '/%'),     -- file in the private "cvs" bucket, inside the applicant's own folder
  status text not null default 'submitted' check (status in ('submitted', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn')),
  interview_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vacancy_id, applicant_id)
);
create index job_applications_applicant_idx on job_applications (applicant_id);
create trigger set_updated_at before update on job_applications for each row execute function set_updated_at();

create or replace function guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare vac job_vacancies; own_vacancy boolean;
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    select * into vac from job_vacancies where id = new.vacancy_id;
    if vac.id is null or vac.status <> 'published' or vac.deleted_at is not null or vac.is_filled
       or (vac.expires_at is not null and vac.expires_at <= now()) or (vac.application_deadline is not null and vac.application_deadline < current_date) then
      raise exception 'This vacancy is not open for applications';
    end if;
    if is_employer_owner(vac.employer_id) then raise exception 'You cannot apply to your own vacancy'; end if;
    if new.status <> 'submitted' or new.interview_at is not null then raise exception 'New applications start as submitted'; end if;
    return new;
  end if;
  -- updates
  if new.vacancy_id is distinct from old.vacancy_id or new.applicant_id is distinct from old.applicant_id
     or new.cover_note is distinct from old.cover_note or new.cv_path is distinct from old.cv_path
     or new.applicant_name is distinct from old.applicant_name or new.applicant_phone is distinct from old.applicant_phone then
    raise exception 'Submitted applications cannot be edited; withdraw and apply again instead';
  end if;
  select exists (select 1 from job_vacancies v join employer_profiles e on e.id = v.employer_id where v.id = old.vacancy_id and e.owner_id = auth.uid()) into own_vacancy;
  if old.applicant_id = auth.uid() and not own_vacancy then
    if new.status <> 'withdrawn' or new.interview_at is distinct from old.interview_at then raise exception 'Applicants can only withdraw an application'; end if;
  elsif own_vacancy then
    if new.status = 'withdrawn' then raise exception 'Only the applicant can withdraw an application'; end if;
  end if;
  return new;
end $$;
create trigger tg_a_application_guard before insert or update on job_applications for each row execute function guard_application();

alter table job_applications enable row level security;
create policy applications_applicant_read on job_applications for select using (applicant_id = auth.uid());
create policy applications_employer_read on job_applications for select using (
  exists (select 1 from job_vacancies v where v.id = vacancy_id and is_employer_owner(v.employer_id)));
create policy applications_admin_read on job_applications for select using (is_admin());
create policy applications_applicant_insert on job_applications for insert to authenticated with check (
  applicant_id = auth.uid() and my_email_confirmed());
create policy applications_applicant_update on job_applications for update using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());
create policy applications_employer_update on job_applications for update using (
  exists (select 1 from job_vacancies v where v.id = vacancy_id and is_employer_owner(v.employer_id)))
  with check (exists (select 1 from job_vacancies v where v.id = vacancy_id and is_employer_owner(v.employer_id)));
create policy applications_applicant_delete on job_applications for delete using (applicant_id = auth.uid());     -- the applicant controls their data
create policy applications_admin_write on job_applications for all using (is_admin()) with check (is_admin());

-- ───────────── Saved vacancies and reports ─────────────
create table saved_jobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  vacancy_id uuid not null references job_vacancies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vacancy_id)
);
alter table saved_jobs enable row level security;
create policy saved_jobs_own on saved_jobs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table job_reports (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references job_vacancies (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('asks_for_payment', 'looks_fake', 'discriminatory', 'misleading', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (vacancy_id, reporter_id)
);
create trigger audit_row after insert or update or delete on job_reports for each row execute function audit_row();
alter table job_reports enable row level security;
create policy job_reports_insert on job_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy job_reports_staff_read on job_reports for select using (is_staff());
create policy job_reports_admin_write on job_reports for update using (is_admin()) with check (is_admin());

-- ───────────── Private CV storage ─────────────
-- PDF and Word only, 5 MB, never public. Files live under <applicant id>/ and are readable by that applicant, the employer who received
-- the application that references the file, and administrators.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function cv_visible_to_employer(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from job_applications a join job_vacancies v on v.id = a.vacancy_id join employer_profiles e on e.id = v.employer_id
    where a.cv_path = object_name and e.owner_id = auth.uid())
$$;
create policy cvs_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy cvs_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy cvs_read on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin() or cv_visible_to_employer(name)));
