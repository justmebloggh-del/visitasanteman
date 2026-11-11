-- Homepage welcome text, from the same public sources as the page text (Wikipedia, Ghana Tourism Authority).
-- Only fills the intro if it is still empty.
update homepage_sections
set body = 'Asanteman, the Ashanti Region of Ghana, is the homeland of the Asante and one of the most visited heritage regions in the country. Its capital, Kumasi, is home to Manhyia Palace and the Asantehene, to Kejetia Market and to a living tradition of ceremony, kente weaving, Adinkra printing and woodcarving.

Beyond Kumasi, the region reaches from Lake Bosomtwi and the forest reserves to the old gold-mining town of Obuasi, across 43 districts. Use this site to find places to see, plan a route, check how to get here and meet the businesses and communities that make the region what it is.',
    updated_at = now()
where key = 'intro' and coalesce(body, '') = '';
