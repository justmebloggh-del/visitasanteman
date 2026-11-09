-- The earlier column-level REVOKE on advertisements.impressions/clicks had no effect while the table-level UPDATE
-- privilege was granted. Replace the table-level grant with column grants that exclude the counters, so they can only
-- be changed by record_ad_event().
revoke update on advertisements from authenticated, anon;
grant update (title, advertiser_name, advertiser_id, placement, headline, body, link_url, cover_media_id, starts_at, ends_at, status, deleted_at, updated_at)
  on advertisements to authenticated;
