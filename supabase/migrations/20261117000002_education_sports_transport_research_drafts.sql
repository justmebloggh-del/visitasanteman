-- Phase 5 research drafts: education, sports, transport. UNPUBLISHED, UNCHECKED starting records.
-- Names come from the project owner's research summary; where web research was possible the source is recorded.
-- No programmes, contacts, capacities, fares, timetables, coordinates or recognition claims are entered.

insert into institutions (slug, name, kind, research_notes, source_organisation, source_url, status, verification_status, researched_at)
select v.slug, v.name, v.kind::institution_kind,
       $$Check the exact current name, recognition status, location and visitor arrangements against the Ghana Tertiary Education Commission (GTEC) or the relevant regulator and the institution's official website. A campus is not a tourist attraction unless the institution says visitors are welcome.$$,
       $$Project owner's research summary (name only; not yet checked against the regulator register or the institution's own site)$$,
       null, 'draft', 'awaiting_verification', date '2026-11-09'
from (values
  ('kwame-nkrumah-university-of-science-and-technology', 'Kwame Nkrumah University of Science and Technology', 'university'),
  ('kumasi-technical-university', 'Kumasi Technical University', 'technical_university'),
  ('presbyterian-university-agogo', 'Presbyterian University, Agogo', 'university'),
  ('christian-service-university', 'Christian Service University', 'university'),
  ('garden-city-university-college', 'Garden City University College', 'university'),
  ('wesley-college-of-education', 'Wesley College of Education', 'college_of_education'),
  ('st-monicas-college-of-education', 'St. Monica''s College of Education', 'college_of_education'),
  ('st-louis-college-of-education', 'St. Louis College of Education', 'college_of_education'),
  ('akrokerri-college-of-education', 'Akrokerri College of Education', 'college_of_education'),
  ('agogo-presbyterian-college-of-education', 'Agogo Presbyterian College of Education', 'college_of_education'),
  ('mampong-technical-college-of-education', 'Mampong Technical College of Education', 'college_of_education'),
  ('offinso-college-of-education', 'Offinso College of Education', 'college_of_education')
) as v(slug, name, kind)
on conflict (slug) do nothing;

insert into institutions (slug, name, kind, research_notes, source_organisation, source_url, status, verification_status, researched_at)
values ('university-of-skills-training-and-entrepreneurial-development', 'University of Skills Training and Entrepreneurial Development', 'university',
 $$Parliament reportedly renamed the university in 2025 (Act 1162) and the university has published a notice that it is now USTED. Earlier name: Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development (AAMUSTED), formed from former UEW campuses at Kumasi and Asante-Mampong. Sources word the new name slightly differently ("of" or "for"): use the university's own wording. A news report says its programmes are GTEC-accredited; confirm against the GTEC register before stating recognition.$$,
 $$University notice "Change of Name"; Ghanaian Times and allAfrica (secondary reports)$$,
 'https://aamusted.edu.gh/?p=19869', 'draft', 'awaiting_verification', date '2026-11-09')
on conflict (slug) do nothing;

insert into sports_venues (slug, name, sports, administrative_area_id, source_organisation, source_url, research_notes, status, verification_status, researched_at, facility_status)
values
('baba-yara-sports-stadium', 'Baba Yara Sports Stadium', '{Football}', (select id from administrative_areas where slug = 'kumasi'),
 $$Ghana Football Association (ghanafa.org): approved venues for the 2026/27 Ghana Premier League$$,
 'https://ghanafa.org/gfa-confirms-14-approved-venues-for-2026-27-ghana-premier-league',
 $$Reported on the GFA's list of approved 2026/27 Ghana Premier League venues. Secondary copies of that list disagree on its entries, and an undated report says the National Sports Authority closed the stadium for renovation and a club moved temporarily to Len Clay. The project owner's summary also mentions athletics. Status, capacity, ownership/management and other sports must be confirmed before publishing; status left as unknown.$$,
 'draft', 'awaiting_verification', date '2026-11-09', 'unknown'),
('len-clay-sports-stadium', 'Len Clay Sports Stadium', '{Football}', (select id from administrative_areas where slug = 'obuasi'),
 $$Ghana Football Association (ghanafa.org): approved venues for the 2026/27 Ghana Premier League$$,
 'https://ghanafa.org/gfa-confirms-14-approved-venues-for-2026-27-ghana-premier-league',
 $$Reported on the GFA's list of approved 2026/27 Ghana Premier League venues (Obuasi). Confirm status, capacity, management and other sports before publishing.$$,
 'draft', 'awaiting_verification', date '2026-11-09', 'unknown')
on conflict (slug) do nothing;

insert into transport_providers (slug, name, kind, source_organisation, source_url, research_notes, status, verification_status, researched_at, facility_status)
values
('prempeh-i-international-airport', 'Prempeh I International Airport', 'airport',
 $$Project owner's research summary (name only)$$, null,
 $$Named in the project owner's summary. A web search found nothing usable, so nothing about it is recorded. Confirm the operator (Ghana Airports Company Limited or other), location, airlines and routes with the operator's official site.$$,
 'draft', 'awaiting_verification', date '2026-11-09', 'unknown'),
('kumasi-railway-station', 'Kumasi Railway Station', 'railway',
 $$Project owner's research summary (name only)$$, null,
 $$Named in the project owner's summary. Confirm whether any passenger or freight rail service operates, who runs it, and its schedule. Do not imply rail services exist until confirmed.$$,
 'draft', 'awaiting_verification', date '2026-11-09', 'unknown'),
('boankra-inland-port', 'Boankra Inland Port (Boankra Integrated Logistics Terminal)', 'port',
 $$News reports (Ghanaweb, 5 May 2026; News Ghana; MyJoyOnline) and the project owner's summary$$,
 'https://mobile.ghanaweb.com/GhanaHomePage/business/Expedite-work-on-Boankra-Inland-Port-project-Otumfuo-urges-government-2032921',
 $$Reports describe a dry port near Kumasi that is still under construction: the Asantehene urged the government in May 2026 to speed up work, other reports describe funding delays and slow progress, and one reports it will not operate soon. Recorded as UNDER DEVELOPMENT, not operational. Check the current status with the responsible authority and confirm the district.$$,
 'draft', 'awaiting_verification', date '2026-11-09', 'under_development')
on conflict (slug) do nothing;
