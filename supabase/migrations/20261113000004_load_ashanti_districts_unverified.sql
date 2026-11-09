-- VisitAsanteman: Ashanti Region administrative areas, loaded as UNVERIFIED and INACTIVE.
--
-- Source: citypopulation.de, "Ghana: Administrative Division, Ashanti" (credits Ghana Statistical Service,
-- census of 2010 and 2021), retrieved 2026-11-09. https://www.citypopulation.de/php/ghana-admin.php?adm1id=06
-- This is a SECONDARY source. The Local Government Service and NDPC pages that would be authoritative could
-- not be reached when this was prepared. The 43 entries (1 metropolitan, 17 municipal, 25 district) may not
-- match the current official list: names, categories and the number of assemblies must be checked.
--
-- Safety: every row is inactive. Inactive districts are invisible to the public and content cannot be
-- published into them. A regional editor checks each against the official list, then edits the district
-- in Admin > Districts: tick Active, fix the name or type if needed, replace the source and set "Source checked on".
-- Names are stored without the words "Municipal" or "Metropolitan"; the type column carries that.

insert into administrative_areas (region_id, slug, name, kind, is_active, source, source_url, verified_at, sort_order)
select r.id, v.slug, v.name, v.kind::admin_area_kind, false,
       'UNVERIFIED. Secondary source: citypopulation.de (credits Ghana Statistical Service), retrieved 2026-11-09. Check against the Local Government Service list before activating.'
         || coalesce(' Note: ' || v.note || '.', ''),
       'https://www.citypopulation.de/php/ghana-admin.php?adm1id=06', null, v.ord
from regions r
cross join (values
  ('adansi-asokwa', 'Adansi Asokwa', 'district', $$Source lists it as formerly part of Adansi North$$, 1),
  ('adansi-north', 'Adansi North', 'district', null, 2),
  ('adansi-south', 'Adansi South', 'district', null, 3),
  ('afigya-kwabre-north', 'Afigya Kwabre North', 'district', null, 4),
  ('afigya-kwabre-south', 'Afigya Kwabre South', 'district', null, 5),
  ('ahafo-ano-north', 'Ahafo Ano North', 'municipal', null, 6),
  ('ahafo-ano-south-east', 'Ahafo Ano South East', 'district', null, 7),
  ('ahafo-ano-south-west', 'Ahafo Ano South West', 'district', null, 8),
  ('akrofuom', 'Akrofuom', 'district', $$Source lists it as formerly part of Obuasi Municipal$$, 9),
  ('amansie-central', 'Amansie Central', 'district', null, 10),
  ('amansie-south', 'Amansie South', 'district', $$Source lists it as formerly Amansie West$$, 11),
  ('amansie-west', 'Amansie West', 'district', null, 12),
  ('asante-akim-central', 'Asante Akim Central', 'municipal', null, 13),
  ('asante-akim-north', 'Asante Akim North', 'district', null, 14),
  ('asante-akim-south', 'Asante Akim South', 'municipal', null, 15),
  ('asokore-mampong', 'Asokore Mampong', 'municipal', null, 16),
  ('asokwa', 'Asokwa', 'municipal', $$Source lists it as formerly part of Kumasi Metropolitan$$, 17),
  ('atwima-kwanwoma', 'Atwima Kwanwoma', 'district', null, 18),
  ('atwima-mponua', 'Atwima Mponua', 'district', null, 19),
  ('atwima-nwabiagya', 'Atwima Nwabiagya', 'municipal', $$Source also shows the name Atwima Nwabiagya South Municipal; check which is current$$, 20),
  ('atwima-nwabiagya-north', 'Atwima Nwabiagya North', 'district', $$Source lists it as formerly part of Atwima Nwabiagya Municipal$$, 21),
  ('bekwai', 'Bekwai', 'municipal', null, 22),
  ('bosome-freho', 'Bosome Freho', 'district', null, 23),
  ('bosomtwe', 'Bosomtwe', 'district', null, 24),
  ('ejisu', 'Ejisu', 'municipal', null, 25),
  ('ejura-sekyedumase', 'Ejura-Sekyedumase', 'municipal', null, 26),
  ('juaben', 'Juaben', 'municipal', null, 27),
  ('kumasi', 'Kumasi', 'metropolitan', null, 28),
  ('kwabre-east', 'Kwabre East', 'district', null, 29),
  ('kwadaso', 'Kwadaso', 'municipal', $$Source lists it as formerly part of Kumasi Metropolitan$$, 30),
  ('mampong', 'Mampong', 'municipal', null, 31),
  ('obuasi-east', 'Obuasi East', 'district', $$Source lists it as formerly part of Obuasi Municipal$$, 32),
  ('obuasi', 'Obuasi', 'municipal', null, 33),
  ('offinso', 'Offinso', 'municipal', null, 34),
  ('offinso-north', 'Offinso North', 'district', null, 35),
  ('oforikrom', 'Oforikrom', 'municipal', $$Source lists it as formerly part of Kumasi Metropolitan$$, 36),
  ('old-tafo', 'Old Tafo', 'municipal', $$Source lists it as formerly part of Kumasi Metropolitan$$, 37),
  ('sekyere-afram-plains', 'Sekyere Afram Plains', 'district', null, 38),
  ('sekyere-central', 'Sekyere Central', 'district', null, 39),
  ('sekyere-east', 'Sekyere East', 'district', null, 40),
  ('sekyere-kumawu', 'Sekyere Kumawu', 'district', null, 41),
  ('sekyere-south', 'Sekyere South', 'district', null, 42),
  ('suame', 'Suame', 'municipal', $$Source lists it as formerly part of Kumasi Metropolitan$$, 43)
) as v(slug, name, kind, note, ord)
where r.slug = 'ashanti'
on conflict (slug) do nothing;

-- Lake Bosomtwe: the ten community drafts and a draft destination belong to the Bosomtwe district
-- (as stated in the project brief). The district row itself is still unverified and inactive, so nothing
-- here becomes public until a regional editor checks and activates it.
update communities set administrative_area_id = (select id from administrative_areas where slug = 'bosomtwe')
where administrative_area_id is null
  and slug in ('abono', 'abrodwum', 'amakom', 'ankaase', 'pipie', 'adwafo', 'kuntanase', 'esereso', 'brodekwano', 'old-brodekwano');

insert into destinations (slug, name, administrative_area_id, status)
select 'lake-bosomtwe', 'Lake Bosomtwe', id, 'draft' from administrative_areas where slug = 'bosomtwe'
on conflict (slug) do nothing;
