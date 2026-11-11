-- Ten main towns of Asanteman as DRAFT community entries. Only facts from the cited sources are stated.
-- Elevations come from geocountries.com, an aggregator that was found to contain errors elsewhere, so they are marked unverified.
-- Nothing here is published: an editor must verify each entry and the linked district must be active before publishing.
insert into communities (slug, name, summary, administrative_area_id, sources, content_verified, status, alt_names)
select v.slug, v.name, v.summary, (select id from administrative_areas where slug = v.area), v.sources, false, 'draft', v.alts
from (values
 ('kumasi-city','Kumasi','Capital of the Ashanti Region and seat of the Asantehene. Elevation about 270 m (unverified).','kumasi','Wikipedia (Kumasi); geocountries.com for elevation. UNVERIFIED.', '{}'::text[]),
 ('obuasi-town','Obuasi','Town in Asanteman. Elevation about 215 m (unverified).','obuasi','geocountries.com (elevation only). UNVERIFIED.', array['Obuase']),
 ('ejura-town','Ejura','Town in Asanteman and capital of Ejura-Sekyedumase Municipal. Elevation about 224 m (unverified).','ejura-sekyedumase','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[]),
 ('mampong-town','Mampong','Town in Asanteman and capital of Mampong Municipal. Elevation about 395 m (unverified).','mampong','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[]),
 ('tafo-town','Tafo','Town in Kumasi and capital of Old Tafo Municipal. Elevation about 292 m (unverified).','old-tafo','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[]),
 ('agogo-town','Agogo','Town in Asanteman and capital of Asante Akim North. Elevation about 418 m (unverified).','asante-akim-north','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[]),
 ('konongo-town','Konongo','Town in Asanteman; the Asante Akim Central capital is given as Konongo-Odumase. Elevation about 230 m (unverified).','asante-akim-central','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', array['Konongo-Odumase']),
 ('ahwiaa-town','Ahwiaa','Sub-town of Kumasi known for wood carving and arts. Elevation about 309 m (unverified). Sources disagree on which district it belongs to, so it is not linked to one yet.',null,'Wikipedia (Kumasi) for wood carving; geocountries.com (elevation, district claim differs). UNVERIFIED.', '{}'::text[]),
 ('bekwai-town','Bekwai','Town in Asanteman and capital of Bekwai Municipal. Elevation about 219 m (unverified).','bekwai','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[]),
 ('effiduase-town','Effiduase','Town in Asanteman and capital of Sekyere East. Elevation about 328 m (unverified).','sekyere-east','Wikipedia template Districts of the Ashanti Region (capital); geocountries.com (elevation). UNVERIFIED.', '{}'::text[])
) as v(slug, name, summary, area, sources, alts)
on conflict (slug) do nothing;
