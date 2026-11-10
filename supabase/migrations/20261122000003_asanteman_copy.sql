-- Visitor-facing copy: "Ashanti" becomes "Asanteman" in our own wording.
-- Each update matches the exact original text, so anything an administrator has already edited is left alone.
-- NOT changed on purpose: the 'ashanti' region slug and its official name "Ashanti Region", page slugs (why-ashanti), URLs,
-- and the names of real institutions such as the Ashanti Regional Coordinating Council.

update homepage_sections set title = 'Discover Asanteman. Experience Our Heritage.' where key = 'hero' and title = 'Discover Ashanti. Experience Our Heritage.';
update homepage_sections set subtitle = 'Plan your visit to Asanteman, Ghana: its places, its people and its heritage, district by district.'
  where key = 'hero' and subtitle = 'Plan your visit to the Ashanti Region of Ghana: its places, its people and its heritage, district by district.';
update homepage_sections set subtitle = 'Featured destinations and the districts of Asanteman.' where key = 'destinations' and subtitle = 'Featured destinations and the districts of the Ashanti Region.';
update homepage_sections set subtitle = 'Places to see and things to do across Asanteman.' where key = 'attractions' and subtitle = 'Places to see and things to do across the Ashanti Region.';
update homepage_sections set subtitle = 'Hotels, lodges and guesthouses across Asanteman.' where key = 'accommodation' and subtitle = 'Hotels, lodges and guesthouses across the Ashanti Region.';
update homepage_sections set subtitle = 'Towns and villages of Asanteman.' where key = 'communities' and subtitle = 'Towns and villages of the Ashanti Region.';
update homepage_sections set title = 'Experience Asanteman culture' where key = 'culture' and title = 'Experience Ashanti culture';
update homepage_sections set title = 'Invest in Asanteman tourism' where key = 'investment' and title = 'Invest in Ashanti tourism';

update site_settings set value = jsonb_set(value, '{tagline}', '"Discover Asanteman. Experience Our Heritage."')
  where key = 'general' and value ->> 'tagline' = 'Discover Ashanti. Experience Our Heritage.';

update pages set title = 'Explore Asanteman' where slug = 'explore' and title = 'Explore the Ashanti Region';
update pages set title = 'Why Asanteman' where slug = 'why-ashanti' and title = 'Why Ashanti';
update pages set title = 'Getting Around Asanteman' where slug = 'getting-around' and title = 'Getting Around Ashanti';

-- Draft itinerary titles only (their slugs, which are part of their URLs, stay as they are).
update curated_itineraries set title = 'Three-day Asanteman discovery tour' where slug = 'three-day-ashanti-discovery-tour' and title = 'Three-day Ashanti discovery tour';
update curated_itineraries set title = 'Family holiday in Asanteman' where slug = 'family-holiday-in-ashanti' and title = 'Family holiday in Ashanti';
