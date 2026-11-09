-- VisitAsanteman Phase 2: research records, verification, access status and source tracking.
-- verification_status = how well the FACTS are established.
-- access_status       = whether visitors can actually go there (a site can be true and still closed).

create type verification_status as enum (
  'research_identified',   -- named in a source, nothing checked yet
  'awaiting_verification', -- being checked
  'verified_secondary',    -- confirmed through a credible secondary source
  'officially_confirmed'   -- confirmed by the responsible official body
);
create type access_status as enum (
  'unknown',               -- not yet established
  'open_to_visitors',
  'permission_required',   -- permit or permission needed from the managing body
  'restricted_access',     -- sacred, private or protected: not open to the public
  'temporarily_unavailable',
  'permanently_closed',
  'proposed'               -- planned or under development, not an existing facility
);

alter table attractions
  add column verification_status verification_status not null default 'awaiting_verification',
  add column access_status access_status not null default 'unknown',
  add column access_notes text,                -- permits, permissions, safety, photography rules (public)
  add column managing_institution text,        -- who is responsible for the site
  add column alt_names text[] not null default '{}',   -- alternative spellings, searched as well
  add column source_organisation text,
  add column source_url text,
  add column source_published_at date,
  add column researched_at date,
  add column reviewed_by uuid references auth.users (id) on delete set null,
  add column research_notes text;              -- internal: uncertainty, what still needs checking

alter table communities add column alt_names text[] not null default '{}';
alter table administrative_areas add column alt_names text[] not null default '{}';

create index attractions_verification_idx on attractions (verification_status) where deleted_at is null;

-- Verification fields are changed by approvers only (same rule as content_verified).
create or replace function guard_attraction_research() returns trigger
language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb := to_jsonb(new);
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not can_approve()
       and new.verification_status in ('verified_secondary', 'officially_confirmed') then
      raise exception 'Only regional editors and administrators can mark a record as verified';
    end if;
  else
    o := to_jsonb(old);
    if auth.uid() is not null and not can_approve()
       and (n -> 'verification_status') is distinct from (o -> 'verification_status')
       and new.verification_status in ('verified_secondary', 'officially_confirmed') then
      raise exception 'Only regional editors and administrators can mark a record as verified';
    end if;
  end if;

  -- Nothing is published on research alone, and a closed or proposed site is never published as visitable.
  if new.status = 'published' then
    if new.verification_status not in ('verified_secondary', 'officially_confirmed') then
      raise exception 'Verify the facts (and record the source) before publishing: status is %', new.verification_status;
    end if;
  end if;
  return new;
end $$;
create trigger tg_f_research before insert or update on attractions
  for each row execute function guard_attraction_research();
