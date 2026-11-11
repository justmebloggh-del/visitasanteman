-- Content from https://touringghana.com/ahanti-region/ (undated, private travel site; treat as UNVERIFIED).
-- Where each item goes:
--   attractions   -> summary/description of the existing draft records (sights, museums, craft villages, nature sites)
--   destinations  -> Lake Bosomtwe
--   ceremonies    -> significance/date notes on existing festival drafts, plus three new draft festivals
--   pages         -> history, festivals, travel-information, getting-around, travel-guide (short sourced sections)
-- Nothing here is published. Records stay draft and unverified. Fills only empty fields, so editors' work is kept.
-- Left out on purpose: distances the page states two different ways (Bomfobiri, Pankrono, Ahwiaa), the 1991 Akwasidae
-- dates, fees, opening hours, and Digya National Park (outside what this site could confirm as Ashanti).

-- 1. Attractions
create temp table _att (slug text primary key, summary text, description text);
insert into _att values
('manhyia-palace-museum', 'Museum at the seat of the Asantehene in Kumasi.', 'The courtyard and museum hold statues of past Asante kings and queens.'),
('prempeh-ii-jubilee-museum', 'Museum of Asante history on the grounds of the Centre for National Culture in Kumasi.', 'Holds items from Asante history, including memorabilia of Okomfo Anokye and a treasure bag said to be 300 years old, which he is said to have forbidden anyone to open.'),
('armed-forces-museum-kumasi-fort', 'Military museum in Kumasi Fort.', 'Covers the 1900 British-Ashanti war, World War II and recent military history, with maps, photographs and regalia.'),
('okomfo-anokye-sword-site', 'Site in Kumasi where tradition says Okomfo Anokye pushed his sword into the ground.', 'By tradition the sword remains in the grounds of Okomfo Anokye Teaching Hospital and cannot be removed. It is said to have resisted many attempts.'),
('royal-mausoleum-at-manhyia', 'Asante royal mausoleums at Bantama and Breman.', 'Visits need the consent of Manhyia Palace.'),
('bonwire-kente-weaving-village', 'Kente weaving village about 18 km north-east of Kumasi.', 'A settlement of hundreds of weavers where you can watch kente being woven.'),
('ntonso-adinkra-village', 'Village known for Adinkra cloth making.', 'Adinkra cloth is made by hand here.'),
('ahwiaa-craft-village', 'Village known for wood carving, near Kumasi.', 'Wood carvings are made and sold here.'),
('foase-craft-traditions', 'Village known for wood carving, on the Kumasi to Ohwimase and Trabuom road.', 'About 20 km from Kumasi, according to the source.'),
('bobiri-forest-reserve-and-butterfly-sanctuary', 'Forest reserve and butterfly sanctuary about 20 km from Kumasi on the Kumasi to Accra highway.', 'A Forestry Research Institute centre with an arboretum, forest hiking trails and a butterfly sanctuary. Lodging, guiding and interpretive materials are available.'),
('bomfobiri-wildlife-sanctuary', 'Wildlife sanctuary of about 53 km² with waterfalls.', 'Mostly secondary semi-deciduous forest with open savannah and sandstone outcrops. Wildlife includes the rare bare-headed rock fowl, three crocodile species and 26 mammal species such as the red river hog. Help is available at the Wildlife Division office.'),
('owabi-wildlife-sanctuary-and-arboretum', 'Forest reserve and bird sanctuary of about 13 km² around a reservoir, west of Kumasi.', 'Birdlife includes the noisy pied hornbill, herons and kingfishers, with Mona monkeys and shy antelopes. Bird-watching and hiking are possible. Campers must bring their own tent, mosquito net, repellent and bedding.'),
('besease-traditional-shrine', 'Traditional shrine described as over 300 years old.', null);

update attractions a
set summary = t.summary,
    description = coalesce(a.description, t.description),
    sources = 'touringghana.com/ahanti-region (undated). UNVERIFIED' ||
              case when a.slug = 'besease-traditional-shrine' then '; age from the Ghana Tourism Authority (visitghana.com/ashanti-region)' else '' end,
    source_organisation = coalesce(a.source_organisation, 'Touring Ghana'),
    source_url = coalesce(a.source_url, 'https://touringghana.com/ahanti-region/'),
    researched_at = coalesce(a.researched_at, current_date)
from _att t
where a.slug = t.slug and a.summary is null;

-- New craft attractions not yet in the list (draft)
insert into attractions (slug, name, summary, description, category_id, sources, source_organisation, source_url, researched_at, status, content_verified)
select v.slug, v.name, v.summary, v.description, (select id from attraction_categories where slug = 'markets-crafts'),
       'touringghana.com/ahanti-region (undated). UNVERIFIED', 'Touring Ghana', 'https://touringghana.com/ahanti-region/', current_date, 'draft', false
from (values
 ('pankrono-pottery-village', 'Pankrono', 'Village north of Kumasi known for pottery.', 'Pottery is made here without a potter''s wheel.'),
 ('asuofia-asamang-bead-making', 'Asuofia and Asamang', 'Villages on the Barekese road known for bead making.', 'Beads are made by hand in these villages.')
) v(slug, name, summary, description)
on conflict (slug) do nothing;
drop table _att;

-- 2. Destination
update destinations
set summary = '31 km south-east of Kumasi, a lake in a meteorite crater surrounded by fishing and farming villages.',
    description = coalesce(description, 'Visitors can swim, dive, hike and relax by the lake. It can be reached by road. Source: touringghana.com (undated, unverified).')
where slug = 'lake-bosomtwe' and summary is null;

-- 3. Ceremonies
update ceremonies set significance = 'Held in Kumasi. A magnified form of the Sunday Adae, observed on the last Akwasidae of the year. Said to commemorate the founding of the Asante state after the 1697 to 1699 war against the Denkyira, and to reaffirm loyalty to the Golden Stool. Private rituals in the palace are followed by a public durbar with regalia, drumming, dancing and musketry. Source: touringghana.com, unverified.'
 where slug = 'adae-kese' and significance is null;
update ceremonies set significance = 'Held at Kumawu in Sekyere East, usually in March on an Akwasidae date. Includes rituals, a chiefs'' durbar and a sacrificial cow contest. Honours Nana Tweneboah Kodua I. Source: touringghana.com, unverified.',
 date_note = coalesce(date_note, 'Usually March; confirm the date with the organisers.')
 where slug = 'papa-nantwi-festival' and significance is null;
update ceremonies set significance = 'Held at Offinso, usually in October. Honours Nana Wiafe Akenten I. Source: touringghana.com, unverified.',
 date_note = coalesce(date_note, 'Usually October; confirm the date with the organisers.')
 where slug = 'mmoaninko-festival' and significance is null;

insert into ceremonies (slug, name, kind, administrative_area_id, summary, significance, date_note, source_organisation, source_url, researched_at, status)
select v.slug, v.name, 'festival', (select id from administrative_areas where slug = v.area), v.summary, v.significance, v.date_note,
       'Touring Ghana', 'https://touringghana.com/ahanti-region/', current_date, 'draft'
from (values
 ('kente-festival', 'Kente Festival', 'ejisu', 'Annual festival at Bonwire marking the origin of kente.', 'Commemorates the origin of kente, said to be over 300 years ago. Source: touringghana.com, unverified.', 'Usually July or August; confirm the date with the organisers.'),
 ('yaa-asantewaa-festival', 'Yaa Asantewaa Festival', 'ejisu', 'Annual festival at Ejisu honouring Yaa Asantewaa.', 'A chiefs'' durbar honouring Yaa Asantewaa, queen mother of Edweso (Ejisu), who led the Asante war effort against the British in 1900. Source: touringghana.com, unverified.', 'Usually August; confirm the date with the organisers.'),
 ('nkyidwo-festival', 'Nkyidwo Festival', 'bekwai', 'Annual festival at Essumeja with rituals and a durbar.', 'Rituals and a durbar at the Asantemanso forest, described as the Asante ancestral origin site. Source: touringghana.com, unverified.', 'Held on the last Monday in November or the first Monday in December; confirm with the organisers.')
) v(slug, name, area, summary, significance, date_note)
on conflict (slug) do nothing;

-- 4. Pages (appended once; skipped if an editor has changed the source line)
create temp table _tg (slug text primary key, extra text);
insert into _tg values
('culture-history', $b$

## From Touring Ghana
The Asante Empire followed the Bono and Denkyira empires and, at its height, is said to have covered over 70% of present-day Ghana. Kumasi's central position gave it control of trade routes. After several wars with the British, Prempeh I and key chiefs and generals were captured by 1896 and exiled, first to Sierra Leone and then the Seychelles. Yaa Asantewaa, queen mother of Edweso (Ejisu), led the 1900 war effort.$b$),
('culture-festivals', $b$

## Other festivals named by Touring Ghana
These come from an undated source and the dates are approximate. Confirm each with the organisers.
- **Papa Festival**, Kumawu: usually March, on an Akwasidae date. Chiefs' durbar and a sacrificial cow contest, honouring Nana Tweneboah Kodua I.
- **Kente Festival**, Bonwire: July or August, marking the origin of kente.
- **Yaa Asantewaa Festival**, Ejisu: August, a chiefs' durbar honouring Yaa Asantewaa.
- **Mmoa Nni Nko Festival**, Offinso: October, honouring Nana Wiafe Akenten I.
- **Nkyidwo Festival**, Essumeja: last Monday in November or first Monday in December, with rituals at the Asantemanso forest.

**Adae Kese** in Kumasi is described as commemorating the founding of the Asante state after the 1697 to 1699 war against the Denkyira. To work out an Akwasidae date, count six weeks forward from a known one.$b$),
('travel-information', $b$

## From Touring Ghana
- Visitors are greeted with *Akwaaba*, which means welcome.
- Mornings can be chilly, afternoons are sunny and nights cool for most of the year. Wear light clothing in the dry season and heavier clothing in the rainy season.
- Health facilities named: Komfo Anokye Teaching Hospital (Kumasi), Radiant Medical and Dental Center (Ayigya, Kumasi) and Agogo Hospital (Agogo). Confirm opening and emergency arrangements locally.
- Chop bars (local eating places) are found across the region, and Kumasi has restaurants serving Ghanaian and international food.$b$),
('getting-around', $b$

## From Touring Ghana (undated, check before you travel)
The source says Inter-City STC and Neoplan buses run hourly between Kumasi and Accra, that buses and trotros link Kumasi to other regional capitals and major towns, and that the Ghana Railway Corporation runs passenger trains from Kumasi to Accra and to Takoradi. Schedules and whether the trains are running should be confirmed with the operators.$b$),
('travel-guide', $b$

## Craft villages
Bonwire (kente weaving, about 18 km north-east of Kumasi), Ntonso (Adinkra cloth), Ahwiaa and Foase (wood carving), Pankrono (pottery made without a wheel), and Asuofia and Asamang (bead making). Brass, gold and silver smithing can be seen in Kumasi. See the [attractions](/attractions) for each village.

## Nature
Bobiri Forest Butterfly Sanctuary (about 20 km from Kumasi on the Accra road, with an arboretum and trails), Bomfobiri Wildlife Sanctuary (about 53 km², waterfalls), Owabi Wildlife Sanctuary (about 13 km², birdlife and Mona monkeys) and Lake Bosomtwe (31 km south-east of Kumasi). Source: Touring Ghana, undated.$b$);

update pages p
set body = p.body || g.extra,
    source_label = p.source_label || '; Touring Ghana (touringghana.com/ahanti-region, undated)',
    updated_at = now()
from _tg g
where p.slug = g.slug and p.source_label like 'Compiled from public sources%' and p.body not like '%Touring Ghana%';
drop table _tg;
