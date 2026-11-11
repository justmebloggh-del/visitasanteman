-- Ceremonies and festivals from the Wikipedia category "Festivals in the Ashanti Region" (9 articles): Adae, Adae Kese, Akwasidae,
-- Akyempem, Ashanti Yam Festival, Awukudae, Mmoaninko, Nkyidwo and Yaa Asantewaa. Wikipedia is a secondary source and several of
-- these articles are stubs, so everything stays DRAFT and unconfirmed: dates are described as usual timings, never as confirmed dates.
-- Adds the four festivals that were missing, and enriches the existing drafts only where a field is empty or still holds
-- the exact text written earlier. Fully re-runnable.
insert into ceremonies (slug, name, kind, summary, significance, etiquette, date_note, source_organisation, source_url, researched_at, status)
values
('adae-festival', 'Adae Festival', 'ceremony',
 'The most important ancestral custom of the Asante: a day of rest and thanksgiving to the ancestors, observed nine times a year.',
 'Thanks the gods and ancestors for the new harvest. Each six-week cycle has two Adae days: Akwasidae on a Sunday and Awukudae on a Wednesday, and the ninth Adae of the year, Adae Kese, coincides with the New Year. On the preparation day, Dapaa, houses are cleaned and drumming begins at sunset. The chief eats yam or plantain without salt, food is offered to the ancestors and rum is poured over the ceremonial stool.',
 'Guests greet the chief with "Adae morn". Ask the palace or your host about dress and conduct before you go.',
 'Nine times a year, about every six weeks.',
 'Wikipedia (Category: Festivals in the Ashanti Region)', 'https://en.wikipedia.org/wiki/Adae_Festival', current_date, 'draft'),
('awukudae-festival', 'Awukudae Festival', 'ceremony',
 'The Wednesday Adae ("Wednesday ceremony"), observed about nine times a year, every 40 or 42 days.',
 'An ancestral rite by Akan chiefs and elders around Kumasi, seeking the protection of the ruling king''s ancestral deities and uniting the people. Drummers announce the festival the evening before, and ceremonies take place in the stool house in the morning. Charitable donations are common. After every eighth Awukudae, the Adae Butu ritual begins the Odwira festival.',
 'Many Akan people regard this as a day of rest and consider travel on it unwise, so expect people to stay at home.',
 'A Wednesday every 40 or 42 days; Akwasidae falls on the third Sunday after it. Confirm dates with Manhyia Palace.',
 'Wikipedia (Category: Festivals in the Ashanti Region)', 'https://en.wikipedia.org/wiki/Awukudae_Festival', current_date, 'draft'),
('akyempem-festival', 'Akyempem Festival', 'festival',
 'Annual festival of the chiefs and people of the Agona Traditional Area.',
 'A durbar of chiefs with drumming and dancing. The land''s stools are purified, traditional rites are performed and libations are poured for the wellbeing and prosperity of the community. Visitors are welcome to share food and drinks, and people wear traditional clothing.',
 null,
 'Usually September, sometimes October; confirm the date with the organisers.',
 'Wikipedia (Category: Festivals in the Ashanti Region)', 'https://en.wikipedia.org/wiki/Akyempem_Festival', current_date, 'draft'),
('ashanti-yam-festival', 'Ashanti Yam Festival', 'festival',
 'Annual festival marking the first yam harvest of the autumn season, a festival of purification and thanksgiving.',
 'Thanks the gods and ancestors for the new harvest. Rites include cleansing the chiefs'' thrones in the Draa River at Kumasi. Over five days the route to the chiefs'' burial ground is swept, priests lead a yam procession to the ancestors, there is a day of mourning and fasting, the chief hosts a dinner, and the festival ends with a grand parade through the streets.',
 null,
 'Between September and December. Lasts five days and starts on a Tuesday set by the local chief priest; confirm with the organisers.',
 'Wikipedia (Category: Festivals in the Ashanti Region)', 'https://en.wikipedia.org/wiki/Ashanti_Yam_Festival', current_date, 'draft')
on conflict (slug) do nothing;

-- Enrich existing drafts (only empty fields or the exact earlier wording).
update ceremonies set date_note = 'A Sunday about every six weeks, nine times a year. The last one of the year coincides with Adae Kese. Confirm dates with Manhyia Palace.'
 where slug = 'akwasidae' and date_note is null;
update ceremonies set date_note = 'Celebrated at the Asante New Year. Sources differ: the last Akwasidae of the year, or a period between July and October. One source says a fuller observance lasts two weeks every five years. Confirm with Manhyia Palace.'
 where slug = 'adae-kese' and date_note is null;
update ceremonies set date_note = 'Held once every four years (Wikipedia). Another source lists October; confirm the date with the organisers.'
 where slug = 'mmoaninko-festival' and (date_note is null or date_note = 'Usually October; confirm the date with the organisers.');
update ceremonies set significance = significance || ' Honours Nana Wiafe Akenten I for his courage and judgment: by tradition he asked Nana Osei Tutu I for land rather than jewellery after a war against the Dormaas, and that land now forms the Offinso Municipality. The programme includes a chiefs'' durbar, drumming and dancing, musket fire and a funfair.'
 where slug = 'mmoaninko-festival' and significance not like '%Dormaas%';
update ceremonies set significance = significance || ' Tradition says it marks the appearance of the first seven Asante ancestors from a huge hole in the ground, which stands for Asante origins. This is a traditional account, not established history.'
 where slug = 'nkyidwo-festival' and significance not like '%first seven%';
update ceremonies set date_note = 'Usually August, and lasts nine days (Wikipedia). Confirm the date with the organisers.'
 where slug = 'yaa-asantewaa-festival' and date_note in ('Usually August; confirm the date with the organisers.') or (slug = 'yaa-asantewaa-festival' and date_note is null);
update ceremonies set significance = significance || ' Honours her bravery in resisting British efforts to capture the Golden Stool, along with Queen Mother Yaa Akyaa and the kings exiled to the Seychelles. She died in the Seychelles on 17 October 1921. Sources date the war 1900 to 1901.'
 where slug = 'yaa-asantewaa-festival' and significance not like '%Seychelles%';
update ceremonies set research_notes = coalesce(research_notes || ' ', '') || 'Also checked against Wikipedia (Category: Festivals in the Ashanti Region); unconfirmed.'
 where slug in ('akwasidae','adae-kese','mmoaninko-festival','nkyidwo-festival','yaa-asantewaa-festival','papa-nantwi-festival','kente-festival')
   and coalesce(research_notes, '') not like '%Category: Festivals in the Ashanti Region%';

-- Festivals page: a short sourced section (once).
update pages
set body = body || $b$

## More festivals from Wikipedia's list
- **Adae and Awukudae.** The Adae is the Asante's most important ancestral custom, observed nine times a year. Each six-week cycle has two Adae days: Akwasidae on a Sunday and Awukudae on a Wednesday.
- **Akyempem Festival.** An annual festival of the Agona Traditional Area, usually in September, with a durbar of chiefs, drumming, dancing and the purification of the land's stools.
- **Ashanti Yam Festival.** A five-day festival of purification marking the first yam harvest, between September and December, with a yam procession and a grand parade.
- **Mmoaninko Festival.** Held in Offinso once every four years, honouring Nana Wiafe Akenten I.

These timings come from Wikipedia and other undated sources. Confirm each date with the organisers before you plan around it.$b$,
    source_label = source_label || '; Wikipedia (Category: Festivals in the Ashanti Region)',
    updated_at = now()
where slug = 'culture-festivals' and source_label like 'Compiled from public sources%' and body not like '%## More festivals from Wikipedia%';
