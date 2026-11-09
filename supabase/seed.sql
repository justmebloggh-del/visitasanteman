-- Seed: structure only. No invented facts, prices, coordinates or reviews.
-- Community names come from the project brief and are created as DRAFTS with no
-- descriptive content; administrators research, verify and publish them.

insert into attraction_categories (slug, name, sort_order) values
  ('natural', 'Natural attractions', 1),
  ('lakeside', 'Lakeside attractions', 2),
  ('cultural-historical', 'Cultural and historical sites', 3),
  ('adventure', 'Adventure activities', 4),
  ('eco-tourism', 'Eco-tourism', 5),
  ('recreation', 'Recreational facilities', 6),
  ('community', 'Community attractions', 7),
  ('religious-heritage', 'Religious and heritage sites', 8)
on conflict (slug) do nothing;

insert into article_categories (slug, name, sort_order) values
  ('destination-news', 'Destination News', 1),
  ('tourism-development', 'Tourism Development', 2),
  ('culture-heritage', 'Culture and Heritage', 3),
  ('travel-guides', 'Travel Guides', 4),
  ('community-stories', 'Community Stories', 5),
  ('local-business', 'Local Business', 6),
  ('events-festivals', 'Events and Festivals', 7),
  ('investment', 'Investment and Opportunities', 8)
on conflict (slug) do nothing;

insert into communities (slug, name, status, sort_order) values
  ('abono', 'Abono', 'draft', 1),
  ('abrodwum', 'Abrodwum', 'draft', 2),
  ('amakom', 'Amakom', 'draft', 3),
  ('ankaase', 'Ankaase', 'draft', 4),
  ('pipie', 'Pipie', 'draft', 5),
  ('adwafo', 'Adwafo', 'draft', 6),
  ('kuntanase', 'Kuntanase', 'draft', 7),
  ('esereso', 'Esereso', 'draft', 8),
  ('brodekwano', 'Brodekwano', 'draft', 9),
  ('old-brodekwano', 'Old Brodekwano', 'draft', 10)
on conflict (slug) do nothing;

insert into homepage_sections (key, title, subtitle, sort_order, config) values
  ('hero', 'Discover the Extraordinary. Experience the Beauty of Lake Bosomtwe.',
   'Plan your visit to Ghana''s only natural lake, set in the hills of the Ashanti Region.', 1, '{}'),
  ('intro', 'Welcome to Lake Bosomtwe', null, 2, '{}'),
  ('attractions', 'Explore attractions', 'Places to see and things to do around the lake.', 3, '{}'),
  ('experiences', 'Popular experiences', 'Tours and activities offered by local providers.', 4, '{}'),
  ('accommodation', 'Where to stay', 'Hotels, lodges and guesthouses near the lake.', 5, '{}'),
  ('restaurants', 'Food and restaurants', 'Eat well around Lake Bosomtwe.', 6, '{}'),
  ('communities', 'Discover our communities', 'The towns and villages around the lake.', 7, '{}'),
  ('events', 'Upcoming events', 'Festivals, celebrations and tourism events.', 8, '{}'),
  ('articles', 'Travel inspiration', 'Guides, stories and destination news.', 9, '{}'),
  ('testimonials', 'Visitor feedback', null, 10, '{}'),
  ('newsletter', 'Stay in the loop', 'Destination news and events, no spam.', 11, '{}')
on conflict (key) do nothing;

insert into site_settings (key, value) values
  ('general', '{"site_name": "Visit Lake Bosomtwe", "tagline": "Discover the Extraordinary. Experience the Beauty."}'),
  ('contact', '{"email": "", "phone": "", "whatsapp": "", "address": ""}'),
  ('social', '{"facebook": "", "instagram": "", "x": "", "youtube": ""}'),
  ('map', '{"center_lat": 6.5, "center_lng": -1.41, "zoom": 11, "note": "Approximate map centre only; not an attraction coordinate."}')
on conflict (key) do nothing;

-- Static pages start as empty drafts; the public site shows a "being prepared"
-- notice until an administrator writes and publishes them.
insert into pages (slug, title, status) values
  ('about', 'About Visit Lake Bosomtwe', 'draft'),
  ('explore', 'Explore Lake Bosomtwe', 'draft'),
  ('travel-guide', 'Travel Guide', 'draft'),
  ('privacy', 'Privacy Policy', 'draft'),
  ('terms', 'Terms and Conditions', 'draft')
on conflict (slug) do nothing;
