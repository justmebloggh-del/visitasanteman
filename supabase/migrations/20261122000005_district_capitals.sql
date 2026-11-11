-- District capitals from the Wikipedia template "Districts of the Ashanti Region" (a secondary source).
-- Only fills capital_name where it is empty. Districts stay inactive: a regional editor must still check each one
-- against the Local Government Service list before activating it.
-- Left out on purpose: sekyere-afram-plains (the template spells the capital "Dobrosno", which looks like a typo).
update administrative_areas a
set capital_name = v.capital,
    source = a.source || ' Capital from Wikipedia template "Districts of the Ashanti Region" (also unverified).'
from (values
 ('kumasi','Kumasi'),('ahafo-ano-north','Tepa'),('asante-akim-central','Konongo-Odumase'),('asante-akim-south','Juaso'),
 ('asokore-mampong','Asokore Mampong'),('asokwa','Asokwa'),('atwima-nwabiagya','Nkawie'),('bekwai','Bekwai'),('ejisu','Ejisu'),
 ('ejura-sekyedumase','Ejura'),('juaben','Juaben'),('kwabre-east','Mamponteng'),('kwadaso','Kwadaso'),('mampong','Mampong'),
 ('obuasi','Obuasi'),('offinso','Offinso'),('oforikrom','Oforikrom'),('old-tafo','Tafo'),('suame','Suame'),
 ('adansi-asokwa','Adansi Asokwa'),('adansi-north','Fomena'),('adansi-south','New Edubiase'),('afigya-kwabre-north','Boamang'),
 ('afigya-kwabre-south','Kodie'),('ahafo-ano-south-east','Adugyama'),('ahafo-ano-south-west','Mankranso'),('akrofuom','Akrofuom'),
 ('amansie-central','Jacobu'),('amansie-south','Manso Adubia'),('amansie-west','Manso Nkwanta'),('asante-akim-north','Agogo'),
 ('atwima-kwanwoma','Twedie'),('atwima-mponua','Nyinahin'),('atwima-nwabiagya-north','Barekese'),('bosome-freho','Asiwa'),
 ('bosomtwe','Kuntanase'),('obuasi-east','Tutuka'),('offinso-north','Akomadan'),('sekyere-central','Nsuta'),
 ('sekyere-east','Effiduase'),('sekyere-kumawu','Kumawu'),('sekyere-south','Agona')
) v(slug, capital)
where a.slug = v.slug and a.capital_name is null;
