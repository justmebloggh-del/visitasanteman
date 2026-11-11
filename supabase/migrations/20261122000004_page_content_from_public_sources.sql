-- First-draft text for the empty menu pages, compiled from public sources (named in each page's source line).
-- Only pages whose body is still empty are touched, so anything an editor has written is never overwritten.
-- Figures that change (fares, fees, opening hours, flight schedules, visa fees) are deliberately left out and
-- each page points readers to the official source. last_verified_at stays empty: nobody at the regional
-- tourism office has checked these pages yet. Editors can revise or unpublish them in Admin.

create temp table _page_text (slug text primary key, body text, descr text, src_label text, src_url text);

insert into _page_text values
('why-ashanti',
$b$Asanteman, known on maps as the Ashanti Region, lies in the middle belt of southern Ghana. Its capital is Kumasi, about 200 km from Accra. It covers 24,389 km², and at the 2021 census it was Ghana's most populous region, with 5,440,463 people. It is organised into 43 metropolitan, municipal and district assemblies.

## The heart of the Asante kingdom
Asanteman is the homeland of the Asante, the dominant group among the Akan people. The Asantehene, currently Otumfuo Osei Tutu II, is the head of the Asante kingdom and lives in Kumasi. The kingdom's history, regalia and ceremonies are still a living part of life here, not only a museum subject.

## What you can do
- **Visit Manhyia Palace Museum** in Kumasi, the former royal residence built in 1925, now a museum. The Asantehene lives in a newer palace beside it.
- **Walk through Kejetia Market**, often described as the largest open-air market in West Africa, with more than 10,000 stalls and shops.
- **See the Asante crafts**, including kente weaving at Bonwire, Adinkra cloth printing at Ntonso and wood carving at Ahwiaa.
- **Time your visit with an Adae ceremony**, held on a repeating 40 to 42 day cycle (see the Cultural calendar).
- **Get into nature** at Lake Bosumtwi, Bobiri Forest Butterfly Sanctuary, Owabi Forest Reserve and Bird Sanctuary, Bomfobiri Wildlife Sanctuary and Kogyae Strict Nature Reserve.

## Plan well
Use the [Travel Planner](/travel-planner) to build an itinerary, read [Getting Around](/getting-around) for how to reach and move around the region, and check [Visa and Entry](/visa-and-entry) before you book.$b$,
 'Why visit Asanteman: the Asante homeland in Ghana, with Kumasi, royal heritage, craft villages and nature reserves.',
 'Compiled from public sources: Wikipedia (Ashanti Region, Kumasi), Lonely Planet. Not yet reviewed by the regional tourism office',
 'https://en.wikipedia.org/wiki/Ashanti_Region'),

('about',
$b$VisitAsanteman is a digital guide to tourism, heritage, business and jobs across Asanteman, the Ashanti Region of Ghana. It brings places, culture, events, places to stay, food, businesses and vacancies together in one site, organised by district.

## What you will find here
- Destinations, attractions and a map of the region.
- Culture and heritage, including ceremonies and festivals.
- Experiences, places to stay and places to eat.
- A business directory and a jobs board.
- A travel planner that turns what you pick into an itinerary.

## How we handle information
Content is written and checked by editors before it is published. Practical details such as prices, opening hours and entry rules change, so where we are not sure we say so and link to the official source. Cultural content is shared with respect for the traditional institutions that own it.

## Get involved
Businesses can list with us through the [partner portal](/partner-with-us), employers can post vacancies through [Jobs](/jobs), and anyone can [contact us](/contact) with a correction or a suggestion.$b$,
 'About VisitAsanteman, the tourism, heritage, business and jobs guide to Asanteman in Ghana.',
 'Written by the VisitAsanteman team. Not yet reviewed by the regional tourism office', null),

('about-our-mission',
$b$Our mission is to help visitors discover Asanteman, and to help the people and businesses of the region benefit from tourism.

## What we aim to do
- **Show the whole region**, district by district, not only Kumasi.
- **Share heritage accurately**, working with custodians and traditional authorities for cultural content.
- **Back local businesses**, giving them a free, honest place to be found.
- **Keep information trustworthy**, with sources and review dates on practical pages.
- **Open up work**, with a jobs board that does not charge applicants.

Discover Asanteman. Experience Our Heritage.$b$,
 'The mission of VisitAsanteman: show the whole region, share heritage accurately, back local business and keep information trustworthy.',
 'Written by the VisitAsanteman team. Not yet reviewed by the regional tourism office', null),

('culture',
$b$Asanteman is the homeland of the Asante, the largest group among the Akan people. According to the 2021 census figures reported on Wikipedia, 94.2% of citizens by birth in the Ashanti Region are Akan. The royal court at Kumasi, the Golden Stool, the Adae ceremonies and the craft traditions of the villages around the city are central to how Asante identity is expressed.

## Explore
- [History](/culture/history)
- [Traditions](/culture/traditions)
- [Festivals](/culture/festivals) and [Ceremonies and festivals](/culture/ceremonies)
- [Cultural calendar](/culture/calendar)

## Places to start
- **Manhyia Palace Museum**, Kumasi. The building dates from 1925 and is now a museum of Asante royal history.
- **Centre for National Culture and the Prempeh II Jubilee Museum**, Kumasi, which holds Asante regalia.
- **Fort Kumasi**, built in 1896 and now a military museum.
- **Craft villages**: Bonwire (kente weaving), Ntonso (Adinkra cloth) and Ahwiaa (wood carving).

Please ask permission before photographing people, shrines and ceremonies, and follow your guide's advice on dress and conduct.$b$,
 'Culture and heritage in Asanteman: the Asante kingdom, royal ceremonies, museums and craft villages.',
 'Compiled from public sources: Wikipedia (Ashanti Region, Kumasi), Lonely Planet. Cultural content awaits review by custodians',
 'https://en.wikipedia.org/wiki/Kumasi'),

('culture-history',
$b$Asanteman was the centre of the Asante kingdom, later called the Asante Empire. Sources linked from the regional record describe the Anglo-Ashanti wars, the War of the Golden Stool and the later Ashanti protectorate under British rule. Kumasi remains the seat of the Asantehene.

## Landmarks of this history in Kumasi
- **Manhyia Palace**, built by the British in 1925 to receive the Asantehene Prempeh I on his return from exile. It is now a museum.
- **Fort Kumasi**, built in 1896 to replace an earlier Asante fort, now a museum.
- **Prempeh II Jubilee Museum**, within the Centre for National Culture, which displays Asante regalia and a reproduction of the Golden Stool.

A fuller, custodian-reviewed history of the founding of the kingdom is still being prepared. Until then, the museums above are the best place to hear it from the people who keep it.$b$,
 'A short history of Asanteman and the Asante kingdom, with the Kumasi landmarks that tell it.',
 'Compiled from public sources: Wikipedia (Ashanti Region, Kumasi), Lonely Planet. Awaits review by custodians',
 'https://en.wikipedia.org/wiki/Ashanti_Region'),

('culture-traditions',
$b$Asante tradition is held together by the royal court, the chiefs and the calendar of ancestral ceremonies. The Asantehene is the head of the kingdom, and chiefs across Asanteman take part in ceremonies at Manhyia Palace in Kumasi.

## The Adae
The Adae is a ceremony to honour ancestors. It is held twice in each cycle of the Akan calendar:
- **Akwasidae** falls on a Sunday.
- **Awukudae** falls on a Wednesday.

The cycle is roughly 40 to 42 days, so Akwasidae returns every six weeks or so. See the [Cultural calendar](/culture/calendar).

## Crafts as tradition
Kente weaving, Adinkra cloth printing and wood carving are traditional crafts practised in villages around Kumasi. See [Crafts](/culture/crafts).

Customs differ between places and families. Ask your host or guide about dress, greetings and photography.$b$,
 'Asante traditions: the Asantehene, the chiefs and the Adae ceremonies.',
 'Compiled from public sources: Wikipedia (Akwasidae Festival, Akan calendar). Awaits review by custodians',
 'https://en.wikipedia.org/wiki/Akwasidae_Festival'),

('culture-festivals',
$b$Festivals in Asanteman follow the Akan calendar as well as the seasons of the year.

## Akwasidae and Awukudae
Akwasidae is a Sunday festival that remembers the ancestors. On Akwasidae the Asantehene receives subjects and chiefs at Manhyia Palace. Visitors may see a durbar, drumming, dancing and singing, with the king arriving in a decorated palanquin. Awukudae is the Wednesday observance in the same cycle.

## Adae Kese
The last Akwasidae of the year coincides with the Adae Kese festival, described as the largest festival in Asante religion, centred on the cleansing of the Golden Stool.

## Before you go
Dates move on a 40 to 42 day cycle, so confirm the date with Manhyia Palace or your tour operator. Visitor access, dress and photography rules are set by the palace, not by this site.$b$,
 'Akwasidae, Awukudae and Adae Kese: the main royal festivals of Asanteman.',
 'Compiled from public sources: Wikipedia (Akwasidae Festival), Lonely Planet. Awaits review by custodians',
 'https://en.wikipedia.org/wiki/Akwasidae_Festival'),

('getting-around',
$b$## Getting to Asanteman
- **By air.** Kumasi is served by Prempeh I International Airport, about 6 km from the city. Africa World Airlines and Passion Air have flown the short route from Accra. Check current schedules with the airlines.
- **By road.** Kumasi is about 200 km from Accra. Travel sites suggest roughly 4 to 6 hours by bus or car, depending on traffic. Coach companies such as STC and VIP run between the two cities. Confirm timetables and fares with the operator.

## Moving around Kumasi
Kumasi is a large, busy city. Taxis and ride-hailing apps are the simplest way for visitors to move between sights, and many guides offer day tours that include transport. Agree the fare before a taxi trip. Allow extra time on market days and at rush hour.

## Moving between districts
Most attractions outside Kumasi, such as the craft villages and Lake Bosumtwi, are reached by road. A hired car with a driver or an organised tour is the easiest option for a first visit.

## Good to know
- Rainy seasons are major (March to July) and minor (September to November). Some roads are harder after heavy rain.
- Fares, schedules and routes change, so treat the notes above as a starting point and confirm locally.

See also [Travel Information](/travel-information), [Visa and Entry](/visa-and-entry) and the [Travel Planner](/travel-planner).$b$,
 'How to reach Kumasi and move around Asanteman: by air, road and local transport.',
 'Compiled from public sources: Wikipedia (Kumasi), Rome2rio, MileHacker. Fares and schedules not included. Awaits review by the regional tourism office',
 'https://en.wikipedia.org/wiki/Kumasi'),

('travel-information',
$b$Practical points for planning a trip to Asanteman. Rules and prices change, so confirm each point with the official source before you travel.

## Climate and when to go
Kumasi has a tropical climate with two rainy seasons: a major one from March to July and a minor one from September to November. Temperatures are warm all year.

## Before you travel
- Check [Visa and Entry](/visa-and-entry) for passport, visa and vaccination rules.
- Ask your doctor or a travel clinic about vaccinations and malaria prevention.
- Take out travel insurance that covers medical care.

## Money
Declare large amounts of foreign currency on arrival. Official guidance on limits is on the Visa and Entry page. Carry some cash in cedis for markets and taxis.

## Respect and safety
- Ask permission before photographing people, shrines and ceremonies.
- Follow the dress and conduct guidance given by palaces, museums and your guide.
- Keep copies of your passport and important documents.

Emergency numbers and health facilities will be added here once verified by the regional authorities.$b$,
 'Practical travel information for Asanteman: climate, before you travel, money, respect and safety.',
 'Compiled from public sources: Wikipedia (Kumasi), GOV.UK foreign travel advice for Ghana. Awaits review by the regional tourism office',
 'https://www.gov.uk/foreign-travel-advice/ghana'),

('visa-and-entry',
$b$**Entry rules depend on your nationality and can change at short notice. Always confirm with an official source before you book.**

## What UK government advice says (British citizens)
- You must have a visa to visit Ghana. Apply through the online form on the Ghana High Commission website, pay online and send supporting documents as instructed. Processing can take 10 to 15 days.
- Your passport must be valid for at least 6 months after the date you arrive.
- You must have a certificate to prove you have had a yellow fever vaccination.
- Border points may carry out health screening, and you may need to complete the online Ghana Health Declaration before you travel.
- You must declare hard currency on arrival, and large amounts of cash may be confiscated if undeclared.

## If you hold another passport
Rules differ by country. Check with the Ghana Immigration Service, your nearest Ghana embassy or high commission, or your own government's travel advice.

## Official sources
- [Ghana Immigration Service](https://gis.gov.gh)
- [GOV.UK: Ghana entry requirements](https://www.gov.uk/foreign-travel-advice/ghana/entry-requirements)

VisitAsanteman cannot issue visas or confirm that you will be admitted.$b$,
 'Visa and entry notes for Ghana, based on UK government advice, with links to the official sources.',
 'GOV.UK foreign travel advice for Ghana (British citizens). Check the live page and Ghana Immigration Service before travelling',
 'https://www.gov.uk/foreign-travel-advice/ghana/entry-requirements'),

('travel-guide',
$b$A short guide to planning a trip to Asanteman.

## 1. Choose your focus
Heritage and royal culture in Kumasi, craft villages, markets, nature around Lake Bosumtwi and the forest reserves, or a mix.

## 2. Pick your dates
Adae ceremonies repeat on a 40 to 42 day cycle, and the biggest festival, Adae Kese, falls on the last Akwasidae of the year. See the [Cultural calendar](/culture/calendar) and [Events](/events). Remember the rainy seasons: March to July and September to November.

## 3. Sort entry and travel
Read [Visa and Entry](/visa-and-entry) and [Getting Around](/getting-around).

## 4. Book a base
Browse [Where to stay](/accommodation) and [Food and dining](/restaurants).

## 5. Build your itinerary
Use the [Travel Planner](/travel-planner) or a ready-made [itinerary](/travel-planner/itineraries).

## Must-see starting points
Manhyia Palace Museum, Centre for National Culture and the Prempeh II Jubilee Museum, Fort Kumasi, Kejetia Market, Bonwire, Ntonso and Ahwiaa, and Lake Bosumtwi.$b$,
 'A step-by-step travel guide for planning a trip to Asanteman.',
 'Compiled from public sources: Wikipedia (Kumasi, Ashanti Region, Akwasidae Festival). Awaits review by the regional tourism office',
 'https://en.wikipedia.org/wiki/Ashanti_Region');

update pages p
set body = t.body,
    seo_description = coalesce(p.seo_description, t.descr),
    source_label = t.src_label,
    source_url = t.src_url,
    status = 'published',
    updated_at = now()
from _page_text t
where p.slug = t.slug and length(coalesce(p.body, '')) < 40;

drop table _page_text;
