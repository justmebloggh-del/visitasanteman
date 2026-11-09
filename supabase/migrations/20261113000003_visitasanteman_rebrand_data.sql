-- VisitAsanteman rebrand: stored copy and settings.
-- Updates only rows that still hold the original Lake Bosomtwe wording, so anything an
-- administrator has already edited is left alone.

update homepage_sections set
  title = 'Discover Ashanti. Experience Our Heritage.',
  subtitle = 'Plan your visit to the Ashanti Region of Ghana: its places, its people and its heritage, district by district.'
where key = 'hero' and title = 'Discover the Extraordinary. Experience the Beauty of Lake Bosomtwe.';
update homepage_sections set title = 'Welcome to VisitAsanteman' where key = 'intro' and title = 'Welcome to Lake Bosomtwe';
update homepage_sections set subtitle = 'Places to see and things to do across the Ashanti Region.' where key = 'attractions' and subtitle = 'Places to see and things to do around the lake.';
update homepage_sections set subtitle = 'Hotels, lodges and guesthouses across the Ashanti Region.' where key = 'accommodation' and subtitle = 'Hotels, lodges and guesthouses near the lake.';
update homepage_sections set title = 'Food and dining', subtitle = 'Local kitchens, restaurants and traditional dishes.' where key = 'restaurants' and title = 'Food and restaurants';
update homepage_sections set subtitle = 'Towns and villages of the Ashanti Region.' where key = 'communities' and subtitle = 'The towns and villages around the lake.';
update homepage_sections set title = 'Invest in Ashanti tourism' where key = 'investment' and title = 'Invest in Lake Bosomtwe';

-- New homepage sections (shown only when they have published content, except "plan" and "businesses").
insert into homepage_sections (key, title, subtitle, sort_order, config) values
  ('destinations', 'Explore the region', 'Featured destinations and the districts of the Ashanti Region.', 2, '{}'),
  ('culture', 'Experience Ashanti culture', 'Stories of heritage, festivals, crafts and food, published after they have been checked.', 4, '{}'),
  ('plan', 'Plan your visit', 'Build an itinerary, read the travel guide or find places on the map.', 9, '{}'),
  ('businesses', 'Local tourism businesses', 'Tour operators, guides, makers and other businesses. Every listing is reviewed before it is published.', 10, '{}')
on conflict (key) do nothing;

update site_settings set value = jsonb_set(jsonb_set(value, '{site_name}', '"VisitAsanteman"'), '{tagline}', '"Discover Ashanti. Experience Our Heritage."')
where key = 'general' and value ->> 'site_name' = 'Visit Lake Bosomtwe';

-- Regional map view (previously centred on the lake). This is only the starting view of the map,
-- not the coordinate of any place; administrators can change it under Settings.
update site_settings set value = '{"center_lat": 6.7, "center_lng": -1.6, "zoom": 8, "note": "Approximate regional map view only; not an attraction coordinate."}'::jsonb
where key = 'map' and (value ->> 'center_lat')::numeric = 6.5 and (value ->> 'center_lng')::numeric = -1.41;

update pages set title = 'About VisitAsanteman' where slug = 'about' and title = 'About Visit Lake Bosomtwe';
update pages set title = 'Explore the Ashanti Region' where slug = 'explore' and title = 'Explore Lake Bosomtwe';

-- New CMS pages, empty drafts: the site shows a "being prepared" notice until staff write and publish them.
insert into pages (slug, title, status) values
  ('about-our-mission', 'Our mission', 'draft'),
  ('about-partners', 'Our partners', 'draft'),
  ('culture', 'Culture & Heritage', 'draft'),
  ('culture-history', 'History', 'draft'),
  ('culture-traditions', 'Traditions', 'draft'),
  ('culture-festivals', 'Festivals', 'draft'),
  ('culture-crafts', 'Crafts', 'draft'),
  ('culture-food', 'Food', 'draft')
on conflict (slug) do nothing;

-- Regional attraction categories (names only; they describe kinds of place, not specific places).
insert into attraction_categories (slug, name, sort_order) values
  ('museums-galleries', 'Museums and galleries', 9),
  ('markets-crafts', 'Markets and craft centres', 10),
  ('parks-gardens', 'Parks and gardens', 11),
  ('waterfalls-forests', 'Waterfalls and forests', 12)
on conflict (slug) do nothing;

-- The region record. District (MMDA) records are loaded separately from an official source.
insert into regions (slug, name, country_code) values ('ashanti', 'Ashanti Region', 'GH') on conflict (slug) do nothing;
