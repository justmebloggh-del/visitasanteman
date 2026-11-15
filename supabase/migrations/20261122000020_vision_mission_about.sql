-- Vision, mission and who the platform serves, from the project description supplied by the owner.
-- Guarded and re-runnable: each update only applies while the page still holds the earlier text.

-- About us: add the project description once, above "About this website".
update pages
set body = replace(body, '## About this website', $b$## Our vision

To become a leading global gateway for discovering, experiencing, preserving and promoting Asanteman's heritage, tourism, culture, opportunities and people.

## Who VisitAsanteman is for

VisitAsanteman is a digital tourism, cultural heritage, business, education and community platform for Asanteman. It is meant for people in Ghana and for visitors from around the world, including Ghanaians living abroad and people of African descent, such as Caribbean communities, African Americans and Black Europeans, who feel a cultural, ancestral or historical connection to Ghana and the Ashanti Region.

It showcases the history of the Asante Kingdom, the Golden Stool, Manhyia Palace, the traditional institutions led by the Asantehene, Otumfuo Osei Tutu II, our festivals and ceremonies, historic communities, attractions, landscapes, food, arts and crafts, and the hospitality of the Ashanti people.

## Beyond tourism

Over time we aim to grow the platform into a home for cultural festivals, exhibitions, educational programmes, inter-school competitions, youth empowerment, business and investment conferences and cultural exchange programmes in Ghana and abroad. We also connect visitors with hotels, restaurants, tour operators, transport providers and local businesses, and open opportunities for entrepreneurs, students, schools, employers, artists and cultural practitioners.

## About this website$b$),
    updated_at = now()
where slug = 'about' and body like '%## About this website%' and body not like '%## Our vision%';

-- Our mission: replace the first draft with the fuller statement.
update pages
set body = $b$## Our mission

To connect Asanteman with the world through tourism, heritage preservation, digital innovation, cultural exchange, education, business development, youth empowerment and international engagement.

## Our vision

To become a leading global gateway for discovering, experiencing, preserving and promoting Asanteman's heritage, tourism, culture, opportunities and people.

## What we aim to do
- **Show the whole region**, district by district, not only Kumasi.
- **Share heritage accurately**, working with custodians and traditional authorities for cultural content.
- **Back local businesses**, giving them a free, honest place to be found.
- **Keep information trustworthy**, with sources and review dates on practical pages.
- **Open up work**, with a jobs board that does not charge applicants.
- **Welcome the world**, including the African diaspora, with a secure, fast, accessible and mobile-friendly experience.

Discover Asanteman. Experience Our Heritage.$b$,
    updated_at = now()
where slug = 'about-our-mission' and body like '%Open up work%' and body not like '%## Our vision%';
