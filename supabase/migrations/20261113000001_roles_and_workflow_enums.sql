-- VisitAsanteman: new roles and editorial status.
-- Kept in its own file: Postgres cannot use a new enum value in the same
-- transaction that adds it, so everything that uses them is in the next file.
alter type app_role add value if not exists 'regional_editor';
alter type app_role add value if not exists 'media_manager';
-- Workflow: draft -> pending_review (in review) -> approved -> published -> archived.
-- Timed publishing for articles is still done with a future published_at.
alter type content_status add value if not exists 'approved';
