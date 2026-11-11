-- Removes data created by the Playwright suite from the LOCAL database. Run automatically before and after the suite
-- (tests/e2e/global-cleanup.ts). Matches only clearly test-made rows: random ids like "mwarxyomj1wm", "e2e" slugs and
-- @example.com bookings. Real content, the 43 districts and the pages are never touched.
delete from booking_payments where booking_id in (select id from bookings where customer_email ~ 'mwa[a-z0-9]{5,}' or customer_email like '%@example.com');
delete from bookings where customer_email ~ 'mwa[a-z0-9]{5,}' or customer_email like '%@example.com';

do $$
declare t text; n int; i int;
  pat constant text := '(mwa[a-z0-9]{5,}|^e2e|e2e-|cover-test|import-falls|booking-test|zorbax|geomw|dscmw|cermw|dirmw|hosmw)';
begin
  for i in 1..6 loop
    for t in select table_name from information_schema.columns
             where table_schema = 'public' and column_name = 'slug' and table_name not in ('pages', 'regions', 'themes', 'administrative_areas') order by 1 loop
      begin execute format('delete from %I where slug ~ %L', t, pat);
      exception when foreign_key_violation or check_violation then null; end;
    end loop;
    for t in select table_name from information_schema.columns where table_schema = 'public' and column_name = 'administrative_area_id' loop
      begin execute format('delete from %I where administrative_area_id in (select id from administrative_areas where slug ~ %L)', t, pat);
      exception when foreign_key_violation or check_violation then null; end;
    end loop;
  end loop;
  delete from administrative_areas where slug ~ pat;
end $$;

-- Theme links point at content by id with no foreign key, so remove the ones whose target is gone.
delete from theme_links tl where not exists (
  select 1 from (
    select 'attraction' t, id from attractions union all select 'listing', id from listings union all select 'experience', id from experiences
    union all select 'event', id from events union all select 'article', id from articles
  ) e where e.t = tl.entity_type and e.id = tl.entity_id);

-- Test accounts, enquiries, subscribers, plans and ads made by the suite (matched by generated names and test email domains).
delete from newsletter_subscribers where email ~* '(mwa[a-z0-9]{5,}|e2e|@example\.com|\.invalid)';
delete from enquiries where email ~* '(mwa[a-z0-9]{5,}|e2e|@example\.com|\.invalid)' or name ~* '(mwa[a-z0-9]{5,}|e2e)' or message ~* '(mwa[a-z0-9]{5,}|e2e)';
delete from itinerary_items where custom_title ~* '(mwa[a-z0-9]{5,}|e2e)';
delete from travel_itineraries where title ~* '(mwa[a-z0-9]{5,}|e2e)' or title = 'Alice weekend';
delete from advertisements where title ~* '(mwa[a-z0-9]{5,}|e2e)' or advertiser_name ~* '(mwa[a-z0-9]{5,}|e2e)';
delete from advertisers where name ~* '(mwa[a-z0-9]{5,}|e2e)';
delete from media where uploaded_by in (select id from auth.users where email ~* '(mwa[a-z0-9]{5,}|e2e|@example\.com|\.invalid)');
delete from auth.users where email ~* '(mwa[a-z0-9]{5,}|e2e|@example\.com|\.invalid)';
