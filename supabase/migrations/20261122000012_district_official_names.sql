-- District names written in full (Metropolitan / Municipal / District), and Kwabre East corrected to Municipal.
-- Sources: Wikipedia "Districts of Ghana" and the template "Districts of the Ashanti Region" (the official Local Government
-- Service pages could not be reached). They agree on 1 metropolitan, 18 municipal and 24 ordinary assemblies, which this matches.
-- Slugs (URLs) are unchanged. The short name is kept in alt_names so search still finds it. Still UNVERIFIED: an editor must
-- check each against the Local Government Service list before activating.
update administrative_areas
set kind = 'municipal'
where slug = 'kwabre-east' and kind = 'district';

update administrative_areas a
set alt_names = (select array(select distinct x from unnest(a.alt_names || a.name) x)),
    name = case
      when a.slug = 'ejura-sekyedumase' then 'Ejura/Sekyedumase Municipal'
      when a.kind = 'metropolitan' then a.name || ' Metropolitan'
      when a.kind = 'municipal' then a.name || ' Municipal'
      else a.name || ' District'
    end
where a.region_id = (select id from regions where slug = 'ashanti')
  and a.source like 'UNVERIFIED. Secondary source: citypopulation.de%'
  and a.name !~ '(Metropolitan|Municipal|District)$';
