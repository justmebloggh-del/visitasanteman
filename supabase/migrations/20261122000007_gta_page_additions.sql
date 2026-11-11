-- Additions from the Ghana Tourism Authority page https://visitghana.com/ashanti-region/ (official tourism body).
-- Appends a short section to pages written by migration 20261122000004. Skips any page an editor has already
-- changed (source line no longer starts "Compiled from public sources") and runs only once per page.
-- The page gives no fees, hours or festival dates, so none are added. Promotional wording is not copied.
create temp table _gta (slug text primary key, extra text);
insert into _gta values
('why-ashanti', $b$

## From the Ghana Tourism Authority
- Kumasi is described as the ancient capital of the region and was founded in 1695 by the Asantehene Osei Tutu.
- At Manhyia Palace the Asante king sits in session every sixth Sunday, with processions, drumming and music.
- Other sites named include Kumasi Fort and the Military Museum, and the Besease Shrine, described as over 300 years old.
- The region is nicknamed the "Kingdom of Gold". Obuasi, about 50 km south-west of Kumasi, has a gold-mining heritage, and tours can be arranged.
- Akan and Twi are the main languages.$b$),
('culture', $b$

## From the Ghana Tourism Authority
- **Kente.** Traditional kente is woven by men and is known as *nwentoma* ("woven cloth"). It is described as originating in the Asante kingdom. Bonwire is called the royal kente weaving village.
- **Woodcarving** is practised in villages around Kumasi.
- **Besease Shrine** is described as over 300 years old.
- **Funerals and naming ceremonies** can be marked by drumming, dancing and pageantry. If you are invited, ask your host about dress and photography first.$b$),
('culture-history', $b$

## From the Ghana Tourism Authority
Kumasi is described as the ancient capital of the region, founded in 1695 by the Asantehene Osei Tutu. The Besease Shrine is described as over 300 years old. Kumasi Fort and the Military Museum are named among the historic sites to visit.$b$),
('culture-festivals', $b$

## Festivals named by the Ghana Tourism Authority
Akwasidae, Papa, Kente, Nkyidwo and Adae Kese are named as festivals honouring past Akan leaders and heroes. At Manhyia Palace the Asante king sits in session every sixth Sunday. The source gives no dates, so confirm them locally before you plan around one.$b$),
('travel-guide', $b$

## Natural attractions
The Ghana Tourism Authority names Lake Bosomtwi, Owabi Wildlife Sanctuary, Bobiri Forest Reserve (which has an arboretum) and Bomfobiri Wildlife Sanctuary (known for a seasonal waterfall). Monkeys and butterflies are mentioned among the wildlife.

## Shopping
Kejetia Market is described as the largest open-air market in West Africa. Haggling is a normal part of shopping there.

## Contact
The Ghana Tourism Authority's contact address for visitor enquiries is Info@ghana.travel.$b$);

update pages p
set body = p.body || g.extra,
    source_label = p.source_label || '; Ghana Tourism Authority (visitghana.com/ashanti-region)',
    updated_at = now()
from _gta g
where p.slug = g.slug
  and p.source_label like 'Compiled from public sources%'
  and p.body not like '%Ghana Tourism Authority%';
drop table _gta;
