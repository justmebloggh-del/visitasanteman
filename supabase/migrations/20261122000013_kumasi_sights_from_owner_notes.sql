-- Descriptions of the main Kumasi sights from a summary supplied by the project owner (search-engine snippet, UNVERIFIED).
-- Ratings, "closed" labels and phone/direction links in that summary are NOT copied: they change and need the venue's own details.
-- Appends one sentence to each draft attraction (once), and adds Rattray Park as a draft. Nothing is published.
create temp table _k (slug text primary key, extra text);
insert into _k values
('manhyia-palace-museum', 'Described as the seat of the Asantehene, with royal history, artifacts, regalia and photographs of past kings.'),
('prempeh-ii-jubilee-museum', 'Described as showing a replica of the Golden Stool (Sika Dwa Kofi), royal jewellery, weapons and historical garments of the Asante Empire.'),
('okomfo-anokye-sword-site', 'Local legend dates the event to the 17th century and says the sword has never been pulled out.'),
('kumasi-centre-for-national-culture', 'Described as having craft workshops (pottery, brass-working, woodcarving), a library and live music or dance performances.'),
('armed-forces-museum-kumasi-fort', 'Described as a colonial-era fort connected with the 1900 War of the Golden Stool, now showing military artifacts, weaponry and regional history.'),
('kumasi-zoo', 'Described as housing native West African wildlife including primates, big cats, reptiles and many birds. Confirm the current animals before publishing.'),
('bonwire-kente-weaving-village', 'Described as the historic home and origin of authentic kente weaving.'),
('ntonso-adinkra-village', 'Described as famous for Adinkra symbol stamping using natural calabash stamps and custom dyes.');
update attractions a
set description = trim(coalesce(a.description || ' ', '') || t.extra),
    sources = coalesce(a.sources || '; ', '') || 'Owner-supplied summary of Kumasi sights (unverified)'
from _k t
where a.slug = t.slug and coalesce(a.description, '') not like '%' || t.extra || '%';
drop table _k;

update destinations
set description = trim(coalesce(description || ' ', '') || 'Described as a sacred lake in an ancient meteorite impact crater, popular for boat rides, hiking and lakeside relaxation.')
where slug = 'lake-bosomtwe' and coalesce(description, '') not like '%sacred lake in an ancient meteorite%';

insert into attractions (slug, name, summary, description, category_id, sources, source_organisation, researched_at, status, content_verified)
select 'rattray-park', 'Rattray Park', 'Family-friendly recreational park in Kumasi.',
  'Described as having a musical dancing fountain, an artificial lake, a playground, a sports area and restaurants. Opening hours and entry details to be added by an editor.',
  (select id from attraction_categories where slug = 'parks-gardens'),
  'Owner-supplied summary of Kumasi sights (unverified)', 'Project owner notes', current_date, 'draft', false
on conflict (slug) do nothing;

-- Restores the Manhyia Palace Museum draft if a test run or cleanup removed it (it comes from the attraction inventory migration).
insert into attractions (slug, name, summary, description, category_id, sources, source_organisation, researched_at, status, content_verified)
select 'manhyia-palace-museum', 'Manhyia Palace Museum', 'Museum of Asante royal history at Manhyia Palace in Kumasi.',
  'The palace building dates from 1925 and is now a museum. Described as showing royal history, artifacts, regalia and photographs of past kings, with statues of past Asante kings and queens in the courtyard. Confirm location details, opening arrangements and fees with the museum.',
  (select id from attraction_categories where slug = 'museums-galleries'),
  'Lonely Planet; Touring Ghana; owner-supplied summary (all unverified)', 'Compiled from public sources', current_date, 'draft', false
on conflict (slug) do nothing;
