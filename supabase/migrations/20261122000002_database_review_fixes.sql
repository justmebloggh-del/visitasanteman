-- Database review fixes.
-- 1) Trigger-only functions are not meant to be called by anyone. Postgres grants EXECUTE to everyone by default, which made them
--    reachable as /rest/v1/rpc/<name>. Triggers do not need the caller to hold EXECUTE (it is checked only when the trigger is created),
--    so this changes nothing for normal use. Functions used inside policies and the public booking/search functions are NOT touched.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
-- New trigger functions created later are not covered automatically: revoke them in the migration that creates them.

-- 2) Index foreign keys that joins, filters and the "is this image still in use" check rely on. Audit-only columns
--    (who created, reviewed, handled or uploaded a row) are skipped on purpose: nothing queries by them.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace and array_length(c.conkey, 1) = 1
      and a.attname not in ('created_by', 'reviewed_by', 'uploaded_by', 'handled_by', 'assigned_by', 'updated_by', 'verified_by', 'reporter_id')
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index if not exists %I on %s (%I)', left('idx_' || replace(r.tbl::text, 'public.', '') || '_' || r.col, 63), r.tbl, r.col);
  end loop;
end $$;
