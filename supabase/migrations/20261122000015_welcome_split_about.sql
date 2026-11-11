-- The homepage welcome now ends at "...waiting to be discovered." and a "Read more" button leads to About us,
-- where the rest of the address ("It is the rhythm of Kente looms..." to "Welcome home.") continues.
-- Guarded: only changes the intro if it still holds the full address from migration 20261122000014, and only
-- adds the text to About once.
update homepage_sections
set body = split_part(body, E'\n\nIt is the rhythm of Kente looms', 1), updated_at = now()
where key = 'intro' and body like '%It is the rhythm of Kente looms%';

update pages
set body = $b$## Akwaaba to Asanteman, continued

It is the rhythm of Kente looms in Bonwire and Adanwomase, the artistry of Adinkra craftsmanship in Ntonso, the skill of wood carvers in Ahwiaa, and the energy of Kumasi's markets. It is the beauty of Lake Bosomtwe, the tranquillity of our forests, the splendour of our waterfalls and the stories held within our historic towns and communities.

It is the irresistible taste of fufu and light soup, ampesi, kontomire stew, nkatenkwan, abunabunu and other traditional Asante delicacies, prepared and shared with the warmth and generosity for which our people are known.

It is the colourful celebration of Akwasidae, the grandeur of traditional durbars, the sound of drums, the elegance of traditional regalia and the hospitality of communities that welcome visitors as friends.

From the historic streets of Kumasi to the peaceful shores of Lake Bosomtwe, from royal heritage sites to hidden natural treasures across our districts, every journey reveals another chapter of the Asante story.

**VisitAsanteman invites you to experience it all.**

Discover our history. Explore our destinations. Taste our food. Celebrate our culture. Meet our people. Experience our hospitality. Find opportunities to learn, connect, do business and invest.

Whether you are visiting for the first time, returning to reconnect with your roots, researching our heritage or discovering opportunities in our communities, there is a place for you in Asanteman.

We honour our past, celebrate our present and welcome the possibilities of our future.

**Yɛma wo akwaaba!**

**Welcome to Asanteman. Welcome to our heritage. Welcome home.**

## About this website

$b$ || body,
    updated_at = now()
where slug = 'about' and body not like '%It is the rhythm of Kente looms%' and length(body) > 40;
