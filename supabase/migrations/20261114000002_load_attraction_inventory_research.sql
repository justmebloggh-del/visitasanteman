-- VisitAsanteman Phase 2: researched attraction inventory, loaded as UNPUBLISHED research records.
--
-- Source: a research summary supplied by the project owner, which cites the Ashanti Regional Coordinating
-- Council's Regional Profile 2023 (https://arcc.gov.gh/wp-content/uploads/2024/04/REGIONAL-PROFILE-ASHANTI-pdf.pdf).
-- The ARCC document could not be reached when this was loaded, so NOTHING here has been checked against it.
--
-- Every row is: status draft, verification 'research_identified', access 'unknown', no description,
-- no coordinates, no hours, no fees, no contacts. A district is linked only where the summary states it
-- and it matches a district name in the (itself unverified) working list. 52 records.
-- Nothing becomes public until a person researches it, records the source and an approver verifies and publishes it.

insert into attractions (slug, name, category_id, administrative_area_id, status, verification_status, access_status,
                         source_organisation, source_url, research_notes)
select v.slug, v.name,
       (select id from attraction_categories where slug = v.cat),
       (select id from administrative_areas where slug = v.area),
       'draft', 'research_identified', 'unknown',
       'Ashanti Regional Coordinating Council, Regional Profile 2023 (as summarised by the project owner; not yet checked against the document)',
       'https://arcc.gov.gh/wp-content/uploads/2024/04/REGIONAL-PROFILE-ASHANTI-pdf.pdf',
       v.note
from (values
  ($$manhyia-palace-museum$$, $$Manhyia Palace Museum$$, 'museums-galleries', null, $$Confirm location details, opening arrangements and fees with the museum.$$),
  ($$royal-mausoleum-at-manhyia$$, $$Royal Mausoleum at Manhyia$$, 'cultural-historical', null, $$Separate record from the museum. Verify its access arrangements separately; likely restricted.$$),
  ($$prempeh-ii-jubilee-museum$$, $$Prempeh II Jubilee Museum$$, 'museums-galleries', null, $$Confirm location, opening arrangements and fees.$$),
  ($$okomfo-anokye-sword-site$$, $$Okomfo Anokye Sword Site$$, 'cultural-historical', null, $$Listed as located at the Komfo Anokye Teaching Hospital (KATH). Confirm access with the hospital and traditional authority.$$),
  ($$armed-forces-museum-kumasi-fort$$, $$Armed Forces Museum / Kumasi Fort$$, 'museums-galleries', null, $$Confirm access arrangements with the Ghana Armed Forces.$$),
  ($$kumasi-centre-for-national-culture$$, $$Kumasi Centre for National Culture$$, 'cultural-historical', null, $$Confirm programmes, craft workshops and visitor arrangements.$$),
  ($$besease-traditional-shrine$$, $$Besease Traditional Shrine$$, 'religious-heritage', null, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules. Visitor access and photography permissions require confirmation.$$),
  ($$yaa-asantewaa-museum$$, $$Yaa Asantewaa Museum$$, 'museums-galleries', null, $$Listed in connection with the Juaben area and Sreso Tinpom. Verify the exact current location and visitor arrangements before assigning a district.$$),
  ($$bobiri-forest-reserve-and-butterfly-sanctuary$$, $$Bobiri Forest Reserve and Butterfly Sanctuary$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$owabi-wildlife-sanctuary-and-arboretum$$, $$Owabi Wildlife Sanctuary and Arboretum$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$bomfobiri-wildlife-sanctuary$$, $$Bomfobiri Wildlife Sanctuary$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$mampong-scarp$$, $$Mampong Scarp$$, 'natural', null, $$Confirm viewpoints, access and the district(s) it spans.$$),
  ($$nyinahin-waterfalls$$, $$Nyinahin Waterfalls$$, 'waterfalls-forests', null, $$Confirm location, access route, safety and any community or traditional-authority permission.$$),
  ($$tewobaabi-waterfalls$$, $$Tewobaabi Waterfalls$$, 'waterfalls-forests', $$adansi-north$$, $$Listed under Adansi North. Confirm access, safety and permissions.$$),
  ($$mpasaaso-waterfall$$, $$Mpasaaso Waterfall$$, 'waterfalls-forests', null, $$Listed in the Ahafo Ano South area (East and West are separate districts in the working list): confirm which, plus access and safety.$$),
  ($$nyankumasu-waterfalls$$, $$Nyankumasu Waterfalls$$, 'waterfalls-forests', null, $$Confirm location, access, safety and permissions.$$),
  ($$kyerewere-waterfalls$$, $$Kyerewere Waterfalls$$, 'waterfalls-forests', null, $$Confirm location, access, safety and permissions.$$),
  ($$kusa-scarp$$, $$Kusa Scarp$$, 'natural', null, $$Confirm location, access and permissions.$$),
  ($$mframabuom-caves$$, $$Mframabuom Caves$$, 'cultural-historical', null, $$Confirm location, access, safety and any sacred or traditional restrictions.$$),
  ($$gyamera-forest-reserve$$, $$Gyamera Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$tano-offin-forest-reserve$$, $$Tano Offin Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$anwiaso-east-forest-reserve$$, $$Anwiaso East Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$bomfoun-forest-reserve$$, $$Bomfoun Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$apamprama-forest-reserve$$, $$Apamprama Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$kunsimoa-bepo-shelter-belt-forest-reserve$$, $$Kunsimoa Bepo Shelter Belt Forest Reserve$$, 'waterfalls-forests', null, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$bosomtwe-forest-reserves$$, $$Bosomtwe Forest Reserves$$, 'waterfalls-forests', $$bosomtwe$$, $$Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$river-banko$$, $$River Banko$$, 'natural', null, $$Confirm location, access and whether it is a visitor destination.$$),
  ($$pra-riverside-at-nnadieso$$, $$Pra Riverside at Nnadieso$$, 'natural', null, $$Confirm location, access and safety.$$),
  ($$asuhyiae-confluence-and-sacred-grotto$$, $$Asuhyiae Confluence and sacred grotto$$, 'religious-heritage', $$ahafo-ano-north$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules.$$),
  ($$confluence-of-the-birim-and-pra-rivers$$, $$Confluence of the Birim and Pra rivers$$, 'natural', null, $$Confirm location, access and safety.$$),
  ($$gyadam-historical-cave$$, $$Gyadam Historical Cave$$, 'cultural-historical', $$asante-akim-south$$, $$Confirm access, safety and any traditional restrictions.$$),
  ($$elongated-cave-at-sabronum$$, $$Elongated Cave at Sabronum$$, 'cultural-historical', null, $$Confirm location, access, safety and any traditional restrictions.$$),
  ($$dwease-grottoes$$, $$Dwease Grottoes$$, 'religious-heritage', $$asante-akim-central$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules.$$),
  ($$kyekyebiase-traditional-shrines$$, $$Kyekyebiase Traditional Shrines$$, 'religious-heritage', $$asante-akim-central$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules.$$),
  ($$bonwire-kente-weaving-village$$, $$Bonwire Kente Weaving Village$$, 'markets-crafts', null, $$Research individual weaving workshops and artisans rather than one listing for the whole town. Confirm district.$$),
  ($$adanwomase-kente-weaving$$, $$Adanwomase Kente Weaving$$, 'markets-crafts', null, $$Research individual workshops. Confirm district.$$),
  ($$ntonso-adinkra-village$$, $$Ntonso Adinkra Village$$, 'markets-crafts', null, $$Research individual workshops. Confirm district. Do not publish symbol meanings without cultural review.$$),
  ($$ahwiaa-craft-village$$, $$Ahwiaa Craft Village$$, 'markets-crafts', null, $$Wood carving. Research individual workshops. Confirm district.$$),
  ($$krofrom-brass-and-metal-craft$$, $$Krofrom Brass and Metal Craft$$, 'markets-crafts', null, $$Research individual workshops. Confirm district.$$),
  ($$foase-craft-traditions$$, $$Foase Craft Traditions$$, 'markets-crafts', null, $$Wood and brass carving. Research individual workshops. Confirm district.$$),
  ($$asonomaso-craft-traditions$$, $$Asonomaso Craft Traditions$$, 'markets-crafts', null, $$Research the specific workshops and artisans. Confirm district.$$),
  ($$prempeh-ii-stone-brofoyedru$$, $$Prempeh II Stone, Brofoyedru$$, 'cultural-historical', $$adansi-north$$, $$Confirm exact location and access.$$),
  ($$treaty-of-fomena-fomena$$, $$Treaty of Fomena, Fomena$$, 'cultural-historical', $$adansi-north$$, $$Historical event and site: confirm what is physically visible and accessible.$$),
  ($$bonsam-shrine-patakro$$, $$Bonsam Shrine, Patakro$$, 'religious-heritage', $$adansi-north$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules.$$),
  ($$sasabonsam-kye-bodwesango$$, $$Sasabonsam Kye, Bodwesango$$, 'religious-heritage', $$adansi-north$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules.$$),
  ($$bonkro-bird-sanctuary$$, $$Bonkro Bird Sanctuary$$, 'waterfalls-forests', $$adansi-south$$, $$Includes White-necked Picathartes habitat per the inventory. Protected area: access, permits, safety and the managing institution (Forestry Commission, Wildlife Division or other) must be confirmed. A protected area is not automatically open to tourists.$$),
  ($$snake-palm-tree-pra-birim-aboi$$, $$Snake Palm Tree, Pra-Birim Aboi$$, 'natural', $$adansi-south$$, $$Confirm location, access and significance.$$),
  ($$boahu-sacred-grotto$$, $$Boahu Sacred Grotto$$, 'religious-heritage', null, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules. Listed under Afigya Kwabre (North and South are separate districts in the working list): confirm which.$$),
  ($$komfo-anokye-footprints-at-nkakom$$, $$Komfo Anokye Footprints at Nkakom$$, 'cultural-historical', $$atwima-nwabiagya-north$$, $$Confirm location, access and traditional permissions.$$),
  ($$golden-stool-cave-at-barekese$$, $$Golden Stool Cave at Barekese$$, 'cultural-historical', $$atwima-nwabiagya-north$$, $$Sacred or traditional site: treat as restricted until the responsible traditional authority confirms public access, etiquette and photography rules. Confirm location and access.$$),
  ($$osei-tutu-i-birthplace-at-kokofu-anyinam$$, $$Osei Tutu I Birthplace at Kokofu-Anyinam$$, 'cultural-historical', $$bekwai$$, $$Confirm location, access and traditional-authority arrangements.$$),
  ($$essumeja-heritage-locations$$, $$Essumeja Heritage Locations$$, 'cultural-historical', $$bekwai$$, $$Identify the specific heritage locations; confirm access.$$)
) as v(slug, name, cat, area, note)
on conflict (slug) do nothing;
