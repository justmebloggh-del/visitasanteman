-- Public "awaiting approval" listing of ceremonies and festivals.
-- Ceremonies cannot be PUBLISHED until the traditional authority approves the public information (guard_ceremony). To let
-- visitors still see which festivals exist, editors can switch on `show_preview` for a draft. The public view below exposes only
-- name, type, short summary and the "usual timing" note of those rows: never the research notes, sources, contacts or the full
-- description, and never a confirmed date. Default is off, so nothing appears unless an editor chooses it.
alter table ceremonies add column if not exists show_preview boolean not null default false;

create or replace view ceremony_previews with (security_barrier = true) as
select id, slug, name, kind, summary, date_note
from ceremonies
where show_preview and status <> 'published' and status <> 'archived' and deleted_at is null;

revoke all on ceremony_previews from public;
grant select on ceremony_previews to anon, authenticated;

-- The festival drafts compiled from public sources are offered as previews.
update ceremonies set show_preview = true
where slug in ('akwasidae','adae-kese','adae-festival','awukudae-festival','akyempem-festival','ashanti-yam-festival',
               'papa-nantwi-festival','mmoaninko-festival','nkyidwo-festival','kente-festival','yaa-asantewaa-festival')
  and status = 'draft';
