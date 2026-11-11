-- Light use of https://us.trip.com/travel-guide/destination/ashanti-1699095/ (user posts, many errors; UNVERIFIED).
-- Used only for: the Centre for National Culture description, three missing Kumasi attractions as drafts, and a food note.
-- Deliberately NOT imported: hotels and restaurants (promotional posts, contradictory details, no owner consent),
-- the Lake Bosomtwi figures and "volcanic" origin (wrong), the distance claims (wrong), and non-Ashanti sights.
update attractions
set summary = 'Cultural centre in Kumasi with an open-air theatre and a craft room.',
    description = coalesce(description, 'Visitors can see crafts such as weaving, carving, embroidery and pottery. The Prempeh II Jubilee Museum stands on its grounds. Source: Trip.com travel posts, unverified.'),
    sources = coalesce(sources, 'us.trip.com Ashanti travel guide (user posts). UNVERIFIED'),
    source_organisation = coalesce(source_organisation, 'Trip.com'),
    source_url = coalesce(source_url, 'https://us.trip.com/travel-guide/destination/ashanti-1699095/'),
    researched_at = coalesce(researched_at, current_date)
where slug = 'kumasi-centre-for-national-culture' and summary is null;

insert into attractions (slug, name, summary, description, category_id, sources, source_organisation, source_url, researched_at, status, content_verified)
select v.slug, v.name, v.summary, v.description, (select id from attraction_categories where slug = v.cat), v.sources,
       'Wikipedia; Trip.com', 'https://en.wikipedia.org/wiki/Kumasi', current_date, 'draft', false
from (values
 ('kejetia-market', 'Kejetia Market', 'markets-crafts', 'Large central market in Kumasi.', 'Said to be the largest market in West Africa, with more than 10,000 stores and stalls. Haggling is a normal part of shopping. Opening times and safety advice to be added by an editor.', 'Wikipedia (Kumasi); Ghana Tourism Authority. UNVERIFIED'),
 ('asafo-market', 'Asafo Market', 'markets-crafts', 'Busy market in Kumasi.', 'Described by Trip.com posts as one of Kumasi''s busiest markets, selling handicrafts, souvenirs and food. Location and hours to be added after checking.', 'us.trip.com Ashanti travel guide (user posts). UNVERIFIED'),
 ('kumasi-zoo', 'Kumasi Zoo', 'recreation', 'Zoo in the centre of Kumasi.', 'Run by the Wildlife Division of the Forestry Commission. Trip.com posts mention animals such as monkeys and baboons; an editor should confirm the current animals, opening hours and condition before publishing.', 'Wikipedia (Kumasi); us.trip.com Ashanti travel guide. UNVERIFIED')
) v(slug, name, cat, summary, description, sources)
on conflict (slug) do nothing;
