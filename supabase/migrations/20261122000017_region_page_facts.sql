-- Facts from the Wikipedia "Ashanti Region" article (2021 Census) and general Ghana facts from ghana.africandiasporagroup.com
-- (a commercial relocation site with no Ashanti content: used only for currency, language and payment habits).
-- Not used: MPs and constituencies (they change after every election and are not tourism information).

-- 1. Capital settled by the region page: Drobonso (the district article spells it three ways).
update administrative_areas
set capital_name = 'Drobonso',
    summary = 'A large district of the Afram Plains in the north-east of Asanteman, with its capital at Drobonso, covering about 2,411 km². Created in 2012. Population: 32,640 (2021 Census).',
    alt_names = (select array(select distinct x from unnest(alt_names || array['Dobrosno','Dobronso']) x))
where slug = 'sekyere-afram-plains' and capital_name is null;

-- 2. Region facts on the Why Asanteman page (once).
update pages
set body = body || $b$

## Facts and figures
- **Area:** 24,389 km², about 10.2% of Ghana, the third largest of Ghana's 16 regions.
- **People:** 5,440,463 at the 2021 Census, the most populous region and roughly one-sixth of Ghana. About 223 people per km². Akan people make up 94.2% of citizens by birth.
- **Neighbours:** Bono, Bono East and Ahafo to the north, Eastern to the east, Central to the south and Western to the south-west.
- **Districts:** 43 assemblies today (1 metropolitan, 18 municipal and 24 district). The region had 10 districts before 1988, then 18 (1988), 21 (2004), 27 (2008), 30 (2012) and 43 (2018) as assemblies were divided.
- **Economy:** services, agriculture and natural resources. Cocoa, yam, manganese, bauxite and gold are among the region's products.
- **Learning and health:** three public universities, including KNUST in Kumasi, and about 1,650 health facilities, mostly community health posts and health centres.
- **Roads:** the N6 links Kumasi with Accra, and the N8 and N10 link the region with the Central Region.

Figures are from the 2021 Population and Housing Census as reported on Wikipedia (Ashanti Region).$b$,
    updated_at = now()
where slug = 'why-ashanti' and source_label like 'Compiled from public sources%' and body not like '%## Facts and figures%';

-- 3. Money and language on Travel Information (once).
update pages
set body = body || $b$

## Money and language
- The official currency is the Ghana cedi (GHS). Cash and mobile money are both widely used, so carry some cash for markets and taxis.
- English is the official language. In Asanteman most people also speak Akan (Twi).$b$,
    source_label = source_label || '; ghana.africandiasporagroup.com (currency and language only)',
    updated_at = now()
where slug = 'travel-information' and source_label like 'Compiled from public sources%' and body not like '%## Money and language%';
