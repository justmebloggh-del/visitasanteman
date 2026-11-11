#!/usr/bin/env bash
# ONE-TIME: tells the hosted Supabase project which migrations it already contains, so that the automatic workflow
# (.github/workflows/supabase-migrations.yml) only applies NEW ones from here on.
#
# Why: the hosted database was built by pasting SQL into the dashboard, so it has no migration history. Without this
# step `supabase db push` would try to run every migration again from the beginning and fail.
#
# Marks 20261108000001 .. 20261122000003 as applied. Migrations 20261122000004 and later are all written to be safe to
# re-run (they only fill empty fields and use ON CONFLICT DO NOTHING), so the workflow applies those itself.
#
# Needs: the Supabase CLI, `supabase login`, and your database password. Run from the repository root:
#   SUPABASE_PROJECT_REF=<ref> ./scripts/baseline-hosted-migrations.sh
set -euo pipefail

: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF to your project reference (Project Settings > General)}"
LAST_BASELINE="20261122000003"

supabase link --project-ref "$SUPABASE_PROJECT_REF"   # asks for the database password

versions=()
for f in supabase/migrations/*.sql; do
  v="$(basename "$f" | cut -d_ -f1)"
  if [[ "$v" -le "$LAST_BASELINE" ]]; then versions+=("$v"); fi
done

echo "Marking ${#versions[@]} migrations (up to $LAST_BASELINE) as already applied on the hosted project."
read -r -p "Continue? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "Cancelled."; exit 1; }

supabase migration repair --status applied "${versions[@]}"
supabase migration list
echo "Done. From now on, new migrations merged to main are applied automatically."
