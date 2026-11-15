-- Videos for events. The media bucket now also accepts short MP4 and WebM files (up to 50 MB; large films should be
-- hosted on YouTube and linked instead). Videos are ordinary media rows (mime_type video/*) attached to an event through
-- media_links, so the existing storage and table permissions apply: only staff can upload, anyone can watch published pages.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
where id = 'media';

alter table media drop constraint if exists media_mime_type_check;
alter table media add constraint media_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm')) not valid;
