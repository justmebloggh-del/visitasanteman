-- Visitor-facing district summaries for the 43 Asanteman assemblies, compiled from each district's Wikipedia article
-- (which cites the Ghana Statistical Service for the 2021 Population and Housing Census) and, where noted, the tourism
-- sources already used elsewhere on this site. Facts only: location, capital, history of the district, notable places,
-- economy and the 2021 census population. UNVERIFIED until an editor checks each against the Local Government Service.
-- Fills only districts whose summary is empty, so editors' wording is never overwritten.
create temp table _ds (slug text primary key, summary text);
insert into _ds values
('kumasi', 'The capital of Asanteman and the heart of the Asante kingdom, founded in the 1680s by Osei Tutu I and known as the "Garden City of West Africa". Visit Manhyia Palace and its museum, the Prempeh II Jubilee Museum, the Yaa Asantewaa Museum and Kumasi Zoo, and meet the crowds of Kejetia and Asafo markets. Population: 443,981 (2021 Census).'),
('ahafo-ano-north', 'A rainforest district in western Asanteman with its capital at Tepa. It is a major cocoa-growing area, and about 85% of working people are farmers. Created in 1988 and made a municipality in 2018. Population: 92,742 (2021 Census).'),
('asante-akim-central', 'A municipal district in eastern Asanteman with its capital at Konongo-Odumase, usually called Konongo. It covers about 1,462 km² and was created in 1988 from the former Asante Akim district.'),
('asante-akim-south', 'A municipal district in eastern Asanteman with its capital at Juaso. Settlements include Ofoase, Obogu, Dampong, Banso, Bompata and Asankare. It covers 1,275 km². Population: 123,633 (2021 Census).'),
('asokore-mampong', 'A compact municipal district in the Kumasi area with its capital at Asokore Mampong. It covers just 24 km², was formerly Asawase and became a municipality in 2012. Population: 191,402 (2021 Census).'),
('asokwa', 'A municipal district in the Kumasi area with its capital at Asokwa, covering about 25 km². Formerly part of the Kumasi Metropolitan Assembly, it became a municipality in 2018. Population: 125,642 (2021 Census).'),
('atwima-nwabiagya', 'A municipal district in western Asanteman with its capital at Nkawie, covering about 2,411 km². Created in 1988 as Atwima, it was reshaped in 2018 when its northern part became Atwima Nwabiagya North. Population: 161,893 (2021 Census).'),
('bekwai', 'A municipal district in southern Asanteman with its capital at Bekwai, covering 1,937 km². Created in 1988 as Amansie East, it became a municipality in 2008. Population: 137,967 (2021 Census). The Nkyidwo Festival is held at Essumeja in this area, according to a tourism source.'),
('ejisu', 'A municipal district in central Asanteman with its capital at Ejisu. Tourism sources link this area with the Yaa Asantewaa Festival at Ejisu, honouring the queen mother who led the 1900 resistance, and the Kente Festival at Bonwire. It took its present name in 2018 when Juaben became a separate municipality.'),
('ejura-sekyedumase', 'A municipal district in northern Asanteman with its capital at Ejura. It covers 1,252 km², was created in 1988 and became a municipality in 2012. Population: 137,672 (2021).'),
('juaben', 'A municipal district in central Asanteman with its capital at Juaben. It became a separate municipality in 2018, splitting from Ejisu, and covers 372 km². Population: 63,929 (2021).'),
('kwabre-east', 'A municipal district in northern Asanteman with its capital at Mamponteng, covering 356 km². Created in 1988 as Kwabre District, it became a municipality in 2018. Population: 296,814 (2021 Census).'),
('kwadaso', 'A municipal district in the Kumasi area with its capital at Kwadaso. Formerly part of the Kumasi Metropolitan Assembly, it became a municipality in 2018. Population: 154,526 (2021).'),
('mampong', 'A municipal district about 52 km north of Kumasi with its capital at Mampong. Explore Kogyae Forest Reserve, the Mampong Scarp, the Sumanpa waterfall at Daamang and the Ninting valleys. Markets are held in Mampong on Wednesdays and in the market town of Kofiase on Fridays. Cashew, oil palm and cocoa are important crops. Population: 116,632 (2021 Census).'),
('obuasi', 'The home of the Obuasi Gold Mine and the gold-rush heritage of southern Asanteman. The district is hilly, with semi-deciduous forest and a double rainy season. Created in 2003 to 2004, it covers 53 villages. Population: 104,297 (2021).'),
('offinso', 'A municipal district in northern Asanteman with its capital at Offinso, covering 1,451 km². In the early 18th century the Offinso people were among the strongest armies of the Asante Empire, and their land was granted by Nana Osei Tutu I. The Mmoaninko festival draws people home from across Ghana and abroad. The paramount chief is the Offinsohene.'),
('oforikrom', 'A municipal district in the Kumasi area with its capital at Oforikrom, covering about 49 km². Formerly part of the Kumasi Metropolitan Assembly, it became a municipality in 2018. Population: 213,126 (2021 Census).'),
('old-tafo', 'A municipal district in the Kumasi area with its capital at Tafo, covering about 5 km². Formerly part of the Kumasi Metropolitan Assembly, it became a municipality in 2018. Population: 114,368 (2021 Census).'),
('suame', 'A municipal district in the Kumasi area with its capital at Suame. Formerly part of the Kumasi Metropolitan Assembly, it became a municipality in 2018. Population: 136,290 (2021).'),
('adansi-asokwa', 'A district in southern Asanteman with its capital at Adansi Asokwa, covering about 623 km². Created in 2018 from the south-east of Adansi North. Population: 71,844 (2021).'),
('adansi-north', 'A district in southern Asanteman with its capital at Fomena, covering 828 km². It is home to the Kwapia shrine, a major tourist attraction, six natural forest reserves and a share of the Obuasi gold-mining area. Population: 54,155 (2021).'),
('adansi-south', 'A forested district at the southern tip of Asanteman with its capital at New Edubiase. It is known for scenic waterfalls, mountain ranges and eco-tourism, and has eight forest reserves. It is one of Ghana''s largest cocoa-producing areas. Population: 85,200 (2021 Census).'),
('afigya-kwabre-north', 'A district in northern Asanteman with its capital at Boamang, covering about 268 km². Created in 2018 from the northern part of Afigya Kwabre. Population: 73,330 (2021).'),
('afigya-kwabre-south', 'A district in Asanteman with its capital at Kodie, covering about 160 km². Population: 234,667 (2021 Census).'),
('ahafo-ano-south-east', 'A district in western Asanteman covering about 1,126 km². Created in 2018 when Ahafo Ano South was divided. Population: 63,468 (2021 Census).'),
('ahafo-ano-south-west', 'A district in western Asanteman with its capital at Mankranso, covering about 1,126 km². Formed in 1988 and renamed in 2018 when Ahafo Ano South East was created. Population: 65,770 (2021 Census).'),
('akrofuom', 'A district in southern Asanteman with its capital at Akrofuom, covering about 568 km². Created in 2018 from the western part of Adansi South. Population: 49,291 (2021 Census).'),
('amansie-central', 'A district in southern Asanteman with its capital at Jacobu, covering about 710 km². Created in 2003 and effective from 2004. Population: 93,052 (2021 Census).'),
('amansie-south', 'A district in southern Asanteman with its capital at Manso Adubia, covering about 774 km². Created in 2018 from the south of Amansie West. Population: 116,366 (2021 Census).'),
('amansie-west', 'A district in southern Asanteman with its capital at Manso Nkwanta. Settlements include Mpatuam, Pakyi No. 1, Antoakrom and Esuowin. Population: 109,416 (2021 Census).'),
('asante-akim-north', 'A district in eastern Asanteman with its capital at Agogo. It became a district in 2012 when it separated from the former Asante Akim North Municipal. Population: 85,788 (2021).'),
('atwima-kwanwoma', 'A district in Asanteman with its capital at Twedie, created in 2007. Hwidiem is the burial place of the former head of state Ignatius Kutu Acheampong, and Trabuom is home to Afia Kobi Girls Senior High School, opened in 1975.'),
('atwima-mponua', 'The westernmost district of Asanteman, with its capital at Nyinahin, covering about 2,411 km². Created in 2004. Populated places include Tano Dumasi. Population: 155,254 (2021 Census).'),
('atwima-nwabiagya-north', 'A district in western Asanteman with its capital at Barekese, covering about 277 km². Created in 2018 from the northern part of Atwima Nwabiagya. Population: 155,025 (2021 Census).'),
('bosome-freho', 'A district in southern Asanteman with its capital at Asiwa, covering about 577 km². Created in 2008. It has a health centre, a senior high technical school and a budget lodge with a restaurant. Population: 62,259 (2021).'),
('bosomtwe', 'The district of Lake Bosomtwe, one of the world''s largest natural lakes and a popular resort destination, with its capital at Kuntanase. Gold, clay and sand are mined here. Population: 165,180 (2021 Census).'),
('obuasi-east', 'A district in southern Asanteman with its capital at Tutuka, covering about 96 km². Created in 2018 from Obuasi Municipal.'),
('offinso-north', 'A district in northern Asanteman with its capital at Akomadan, covering about 956 km². Created in 2008 from the northern part of Offinso. Population: 83,440 (2021).'),
('sekyere-afram-plains', 'A large district of the Afram Plains in the north-east of Asanteman, covering about 2,411 km². Created in 2012. Population: 32,640 (2021 Census).'),
('sekyere-central', 'A district in northern Asanteman with its capital at Nsuta, covering about 2,345 km². Created in 2007. Population: 73,228 (2021).'),
('sekyere-east', 'A district in eastern Asanteman with its capital at Effiduase, covering about 4,516 km². The Papa Festival at Kumawu is held in this area, usually in March, according to a tourism source. Population: 74,789 (2021).'),
('sekyere-kumawu', 'A district in eastern Asanteman with its capital at Kumawu. Towns include Bodomase, Oyoko, Banko, Dadease and Besoro. Population: 64,396 (2021).'),
('sekyere-south', 'A forested district in eastern Asanteman with its capital at Agona. Visit the Trobo Waterfall, and look out for the Aboye Festival. Kente weaving and pottery, some of it exported, are local crafts. Farming employs about two-thirds of the workforce, with cocoa, citrus, coffee and palm oil the main crops. Population: 120,076 (2021 Census).');

update administrative_areas a
set summary = d.summary,
    source = a.source || ' Summary from the Wikipedia article for this district (cites the 2021 Census); also UNVERIFIED.',
    source_url = coalesce(a.source_url, 'https://en.wikipedia.org/wiki/Ashanti_Region')
from _ds d
where a.slug = d.slug and (a.summary is null or a.summary = '');
drop table _ds;
