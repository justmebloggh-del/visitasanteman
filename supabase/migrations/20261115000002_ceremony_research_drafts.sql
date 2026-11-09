-- Temporary research drafts for four well-known Asante ceremonies, from web research on 2026-11-09.
-- These are DRAFTS ONLY: status draft, verification 'awaiting_verification', authority_approved false,
-- date_confirmed false. The publish triggers make it impossible for them to go live until the responsible
-- traditional authority has approved the public text and a regional editor has verified it.
-- The wording is a short neutral paraphrase of what the cited sources say; where sources disagree this is
-- stated in research_notes. Cultural meaning, rules and dates must be confirmed with the authorities.

insert into ceremonies (slug, name, kind, administrative_area_id, organiser, summary, significance, attendance, attendance_notes,
                        date_note, status, verification_status, authority_approved,
                        source_organisation, source_url, researched_at, research_notes)
values
('akwasidae', 'Akwasidae', 'ceremony', (select id from administrative_areas where slug = 'kumasi'),
 'The Asantehene and Manhyia Palace (the main observance); paramount chiefs observe it in their own areas',
 'An Asante ancestral festival centred on Manhyia Palace in Kumasi, held on a Sunday in the Akan calendar cycle.',
 'Sources describe it as a festival honouring ancestors and past kings and seeking their blessings, observed in a cycle of roughly six weeks (given as 40 or 42 days), with the Awukudae observed on a Wednesday in the same cycle.',
 'public_with_conditions',
 'Sources say the main event at Manhyia Palace is open to subjects and well-wishers who pay homage to the Asantehene, while the opening rituals in the throne room are restricted to initiates. Confirm current visitor rules, dress and photography with Manhyia Palace.',
 'Sources say it falls on a Sunday on a 40 or 42-day cycle according to the Asante calendar. The palace announces the dates.',
 'draft', 'awaiting_verification', false,
 'Manhyia Palace (manhyiapalace.org); Graphic Online; Face2Face Africa (secondary news sources)',
 'https://manhyiapalace.org/?p=116985', date '2026-11-09',
 'Sources differ on the cycle length (40 vs 42 days). Dates must come from Manhyia Palace announcements. Do not publish significance beyond what the palace approves. Some wiki-style sources found were low quality and were not relied on.'),
('adae-kese', 'Adae Kese', 'ceremony', (select id from administrative_areas where slug = 'kumasi'),
 'The Asantehene and Manhyia Palace',
 'The great Adae: the Akwasidae that closes the Asante ritual year, held at Manhyia Palace.',
 'Sources describe it as the final and largest Akwasidae of the year, associated with the cleansing of the Golden Stool. The last Akwasidae of 2025, named Adae Kese by Manhyia Palace, was reported as held on 21 December 2025.',
 'public_with_conditions',
 'As with Akwasidae, confirm with Manhyia Palace which parts are open to visitors and the rules that apply.',
 'Announced by the palace each year. Do not assume a date.',
 'draft', 'awaiting_verification', false,
 'Manhyia Palace (manhyiapalace.org); Graphic Online (secondary news sources)',
 'https://manhyiapalace.org/?p=116985', date '2026-11-09',
 'Sources disagree on whether it is "the largest" festival; do not claim a ranking. The 21 December 2025 date refers to a past occurrence and is deliberately not entered as a confirmed date.'),
('papa-nantwi-festival', 'Papa Nantwi (Papa) Festival', 'festival', null,
 'Kumawu Traditional Council',
 'The annual festival of the people of Kumawu, in the Sekyere area of the Ashanti Region.',
 'Reports describe it as commemorating the bravery and sacrifice of the ancestor Barima Tweneboa Kodua, linked in oral tradition to resistance against Denkyira, and as a modern occasion for unity, cultural education and development. Reported activities include a procession of chiefs and militia, a ritual with a sacrificed cow, food contests, clean-up and tree-planting activities, and a grand durbar.',
 'unknown', null,
 'Reports say it usually falls in March. News in 2026 described the festival returning after a long suspension, with activities reported from 3 to 15 March 2026. Confirm each year with the Kumawu Traditional Council.',
 'draft', 'awaiting_verification', false,
 'Ghana News Agency (Kumawu Traditional Council launch, 2026); Graphic Online; MyJoyOnline; KNUST repository (secondary sources)',
 'https://gna.org.gh/2026/02/kumawu-traditional-council-launches-2026-papa-nantwie-festival/', date '2026-11-09',
 'Spelling varies (Papa, Papa Nantwi, Papa Nantwie). The sources call the district Sekyere East (formerly Sekyere Kumawu); the working district list has both Sekyere East and Sekyere Kumawu, so no district is linked until it is checked. Exact dates and the 2026 schedule come from news reports and are not confirmed. Attendance rules unknown.'),
('mmoaninko-festival', 'Mmoaninko Festival', 'festival', (select id from administrative_areas where slug = 'offinso'),
 'Offinso Traditional Council',
 'A festival of the Offinso people in the Ashanti Region.',
 'Sources tie it to a request by Nana Wiafe Akenten I to the Asantehene after an Asante victory over Dormaa, when land was chosen over gold, and describe it as honouring the bravery and wisdom of past leaders and now also as an occasion for peace, education and development. Reported activities include a durbar of chiefs, drumming and dancing, and musketry.',
 'unknown', null,
 'Sources disagree on how often it is held (every two years in some reports, every four years in another) and one reports a November timing, with funerals reportedly banned in Offinsoman during that month in 2018. Do not assume a schedule; confirm with the Offinso Traditional Council.',
 'draft', 'awaiting_verification', false,
 'Ghana Remembers; Graphic Online; News Ghana (secondary sources)',
 'https://ghanaremembers.com/stories/history/mmoaninko-festival-a-celebration-of-tradition-and-history-in-offinso.html', date '2026-11-09',
 'Frequency and month are inconsistent across sources. District linked as Offinso (the sources say Offinso Municipality) but the district itself is unverified. Attendance rules unknown.')
on conflict (slug) do nothing;
