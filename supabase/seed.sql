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
  ('religious-heritage', 'Religious and heritage sites', 8),
  ('museums-galleries', 'Museums and galleries', 9),
  ('markets-crafts', 'Markets and craft centres', 10),
  ('parks-gardens', 'Parks and gardens', 11),
  ('waterfalls-forests', 'Waterfalls and forests', 12)
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
  ('hero', 'Discover Ashanti. Experience Our Heritage.',
   'Plan your visit to the Ashanti Region of Ghana: its places, its people and its heritage, district by district.', 1, '{}'),
  ('destinations', 'Explore the region', 'Featured destinations and the districts of the Ashanti Region.', 2, '{}'),
  ('intro', 'Welcome to VisitAsanteman', null, 3, '{}'),
  ('attractions', 'Explore attractions', 'Places to see and things to do across the Ashanti Region.', 4, '{}'),
  ('culture', 'Experience Ashanti culture', 'Stories of heritage, festivals, crafts and food, published after they have been checked.', 5, '{}'),
  ('experiences', 'Popular experiences', 'Tours and activities offered by local providers.', 6, '{}'),
  ('accommodation', 'Where to stay', 'Hotels, lodges and guesthouses across the Ashanti Region.', 7, '{}'),
  ('restaurants', 'Food and dining', 'Local kitchens, restaurants and traditional dishes.', 8, '{}'),
  ('communities', 'Discover our communities', 'Towns and villages of the Ashanti Region.', 9, '{}'),
  ('events', 'Upcoming events', 'Festivals, celebrations and tourism events.', 10, '{}'),
  ('plan', 'Plan your visit', 'Build an itinerary, read the travel guide or find places on the map.', 11, '{}'),
  ('businesses', 'Local tourism businesses', 'Tour operators, guides, makers and other businesses. Every listing is reviewed before it is published.', 12, '{}'),
  ('articles', 'Travel inspiration', 'Guides, stories and destination news.', 13, '{}'),
  ('testimonials', 'Visitor feedback', null, 14, '{}'),
  ('newsletter', 'Stay in the loop', 'Destination news and events, no spam.', 15, '{}')
on conflict (key) do nothing;

insert into site_settings (key, value) values
  ('general', '{"site_name": "VisitAsanteman", "tagline": "Discover Ashanti. Experience Our Heritage."}'),
  ('contact', '{"email": "", "phone": "", "whatsapp": "", "address": ""}'),
  ('social', '{"facebook": "", "instagram": "", "x": "", "youtube": ""}'),
  ('map', '{"center_lat": 6.7, "center_lng": -1.6, "zoom": 8, "note": "Approximate regional map view only; not an attraction coordinate."}')
on conflict (key) do nothing;

-- Static pages start as empty drafts; the public site shows a "being prepared"
-- notice until an administrator writes and publishes them.
insert into pages (slug, title, status) values
  ('about', 'About VisitAsanteman', 'draft'),
  ('explore', 'Explore the Ashanti Region', 'draft'),
  ('travel-guide', 'Travel Guide', 'draft'),
  ('privacy', 'Privacy Policy', 'draft'),
  ('terms', 'Terms and Conditions', 'draft')
on conflict (slug) do nothing;

