-- Two homepage blocks that were hard-coded are now editable in Admin > Homepage:
-- "glance" (label / value facts) and "highlights" (title / text / link cards). Items live in config.items.
-- Facts: Wikipedia (Ashanti Region, 2021 census) and the Ghana Tourism Authority.
insert into homepage_sections (key, title, subtitle, is_enabled, sort_order, config) values
('glance', 'Asanteman at a glance', 'Key facts about the region. Sources: 2021 census figures as reported on Wikipedia, and the Ghana Tourism Authority.', true, 25,
 '{"items":[{"label":"Capital","value":"Kumasi"},{"label":"Area","value":"24,389 km²"},{"label":"Population (2021 census)","value":"5,440,463"},{"label":"Districts","value":"43 assemblies"},{"label":"Main languages","value":"Akan and Twi"}]}'),
('highlights', 'Where to begin', 'Five good starting points.', true, 26,
 '{"items":[
  {"title":"Manhyia Palace","text":"The royal seat of the Asantehene in Kumasi, now also a museum.","href":"/culture/history"},
  {"title":"Kente and crafts","text":"Kente weaving at Bonwire, Adinkra at Ntonso, woodcarving at Ahwiaa.","href":"/culture"},
  {"title":"Akwasidae","text":"A Sunday ceremony remembering the ancestors, repeating every 40 to 42 days.","href":"/culture/festivals"},
  {"title":"Lake and forest","text":"Lake Bosomtwi, Bobiri, Owabi and Bomfobiri.","href":"/attractions"},
  {"title":"Getting here","text":"By air to Kumasi or by road, about 200 km from Accra.","href":"/getting-around"}]}')
on conflict (key) do nothing;
