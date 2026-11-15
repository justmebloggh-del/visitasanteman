-- VisitAsanteman International: hub and three pages for visitors from outside Ghana and the African diaspora.
-- Text is deliberately free of prices, schedules, flight routes, visa rules and partner names, none of which have been
-- verified; pages point to the verified-information pages instead. Programmes still being developed are described as such.
-- Only inserts missing pages and only fills pages whose body is still empty, so editors' work is never overwritten.

insert into pages (slug, title, status) values
  ('international', 'VisitAsanteman International', 'draft'),
  ('international-come-home', 'Come Home to Ashanti', 'draft'),
  ('international-heritage-travel', 'Heritage and ancestral travel', 'draft'),
  ('international-partnerships', 'International events and partnerships', 'draft')
on conflict (slug) do nothing;

create temp table _intl (slug text primary key, body text, descr text);
insert into _intl values
('international',
$b$VisitAsanteman International is for everyone outside Ghana who wants to discover Asanteman: Ghanaians living abroad, people of African descent in the Americas, the Caribbean and Europe, international travellers, students and researchers, cultural organisations, and businesses and institutions looking for partners in the region.

## Where to begin
- [Come Home to Ashanti](/international/come-home-to-ashanti), our welcome to visitors and returning families.
- [Heritage and ancestral travel](/international/heritage-travel), for those with a personal or historical interest in Asante history and culture.
- [International events and partnerships](/international/events-and-partnerships), for organisations that want to work with us.

## Plan your journey
- [Why Asanteman](/why-ashanti), [Travel information](/travel-information) and [Visa and entry](/visa-and-entry) explain the practical side. Always confirm entry rules with the official Ghanaian source before you travel.
- Use the [Travel planner](/travel-planner) to build an itinerary, and see [places to stay](/accommodation), [experiences](/experiences) and [events](/events).
- Read about [culture and heritage](/culture) and the [ceremonies and festivals](/culture/ceremonies) of the region.

## A welcome for everyone
Asanteman welcomes visitors of every background. Some people travel because their family history may connect to Ghana. Others come for the history, the festivals, the crafts, the food or the landscapes. Nobody is assumed to have Asante ancestry, and nobody needs to.

## Questions from abroad
Write to us through the [contact page](/contact) with your question, the dates you are considering and the country you are travelling from.$b$,
 'VisitAsanteman International: plan a visit to Asanteman from abroad, for the Ghanaian and African diaspora, international travellers, students and organisations.'),
('international-come-home',
$b$"Come Home to Ashanti" is our invitation to visitors from abroad, and to families returning to Ghana, to experience Asanteman for themselves.

## What you can explore
- **Royal and Asante history** in Kumasi, including [Manhyia Palace Museum](/attractions) and the other [attractions](/attractions) we list.
- **Craft villages**: kente weaving at Bonwire, Adinkra cloth at Ntonso and wood carving at Ahwiaa. See [crafts](/culture/crafts).
- **Lake Bosomtwe** and the region's forests, waterfalls and [destinations](/destinations).
- **Food**: traditional Asante dishes. See [food and culture](/culture/food) and [where to eat](/restaurants).
- **Festivals and ceremonies**: see the [cultural calendar](/culture/calendar). Dates must always be confirmed with the organisers, and some ceremonies are not open to visitors.

## Journeys we are developing
We plan to offer themed journeys, for example a royal heritage and history tour, a Lake Bosomtwe escape, a kente and Adinkra cultural journey, a food experience, a nature and waterfall adventure, and family heritage discovery. **None of these is bookable through this site yet.** When a verified operator offers one, it will appear under [experiences](/experiences) with its own details. We do not publish prices, availability or booking promises that a provider has not confirmed.

## Planning
Start with the [Travel planner](/travel-planner), then read [Travel information](/travel-information), [Visa and entry](/visa-and-entry) and [Getting around](/getting-around).$b$,
 'Come Home to Ashanti: our welcome to visitors from abroad and returning families, with places to explore and how to plan.'),
('international-heritage-travel',
$b$Heritage travel means visiting a place to understand its history, culture and living traditions. People travel to Asanteman for many reasons, including curiosity about the Asante Kingdom, interest in African history, research, or a search for family roots.

## A respectful approach
- Family histories are personal and records are often incomplete. We do not promise that a visit will reveal ancestry, and we do not assume that visitors of African descent have Asante roots.
- Asante traditions belong to their custodians. Some ceremonies and places are sacred or restricted, and attendance rules must be respected. See the [ceremonies and festivals](/culture/ceremonies) page.
- Ask permission before photographing people, rituals or regalia.

## Where to start
- [Culture and heritage](/culture), [history](/culture/history) and [traditions](/culture/traditions).
- [Attractions](/attractions) such as Manhyia Palace Museum and Fort Kumasi, where listed and verified.
- [Craft villages and communities](/communities), where you can see kente, Adinkra and carving traditions.
- [Education and research](/education), if you are a student or researcher.

## Researching family or community history
We do not offer genealogy services. Archives, universities and traditional authorities hold historical records, and we will link to verified institutions as they are confirmed. Until then, [contact us](/contact) and we will say honestly whether we can help.$b$,
 'Heritage and ancestral travel in Asanteman: how to visit with respect, where to start, and what we can and cannot promise.'),
('international-partnerships',
$b$VisitAsanteman works toward cultural events, exhibitions, educational programmes and exchanges in Ghana and abroad. This page explains how organisations can get in touch.

## Who we would like to hear from
- Cultural, heritage and educational institutions and universities.
- Tour operators and travel agencies outside Ghana.
- Event organisers, sponsors and exhibitors.
- Businesses and investors interested in the region (see [investment](/investment)).
- Diaspora associations and community groups.

## What is available now
- **Listings and visibility** for tourism businesses through the [partner portal](/partner-with-us).
- **Advertising and sponsorship** enquiries through [advertise](/advertise).
- **Events** listed on our [events page](/events), once their details are verified.

## What is still in planning
Large international expos, award programmes, ticketing and exhibitor booking, an inter-school festival and a diaspora ambassador programme are ideas for the future. They are **not yet operating**, and this site does not take registrations, tickets or sponsorship payments for them. Sponsorship will never buy a nomination or an award.

## Contact
Tell us who you are, what you would like to do together and in which country, through the [contact page](/contact).$b$,
 'Work with VisitAsanteman: how cultural, educational, travel and business organisations from abroad can get in touch.');

update pages p
set body = t.body,
    seo_description = coalesce(p.seo_description, t.descr),
    source_label = 'Written by the VisitAsanteman team. Not yet reviewed by the regional tourism office',
    status = 'published',
    updated_at = now()
from _intl t
where p.slug = t.slug and length(coalesce(p.body, '')) < 40;

drop table _intl;
