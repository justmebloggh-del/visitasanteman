-- Welcome address supplied by the project owner replaces the first draft of the homepage introduction.
-- Only overwrites the earlier draft text exactly as migration 20261122000008 wrote it, so an editor's own edits are kept.
update homepage_sections
set title = 'Akwaaba to Asanteman',
    subtitle = 'A Kingdom of Heritage. A People of Pride. A Destination of Discovery.',
    body = $b$Welcome to Asanteman, the proud home of a remarkable kingdom, a rich cultural heritage and a people whose history continues to inspire the world.

Here, history is not simply remembered. It lives in our traditions, our institutions, our festivals, our craftsmanship and the enduring spirit of our people.

At the heart of Asanteman stands the revered Golden Stool, Sika Dwa Kofi, the sacred symbol of the unity, identity and sovereignty of the Asante people. Its story is inseparable from the founding of the Asante Kingdom and the enduring legacy of our ancestors.

Within the historic walls of Manhyia Palace resides the Asantehene, His Majesty Otumfuo Osei Tutu II, the 16th occupant of the Golden Stool. As the traditional ruler and custodian of Asante heritage, His Majesty represents a living institution whose influence extends beyond the boundaries of the Ashanti Region. Through his leadership, advocacy for education, peace, development and cultural preservation, Otumfuo continues to strengthen the legacy of Asanteman while inspiring future generations.

But Asanteman is much more than its royal history. It is a living experience waiting to be discovered.

It is the rhythm of Kente looms in Bonwire and Adanwomase, the artistry of Adinkra craftsmanship in Ntonso, the skill of wood carvers in Ahwiaa, and the energy of Kumasi's markets. It is the beauty of Lake Bosomtwe, the tranquillity of our forests, the splendour of our waterfalls and the stories held within our historic towns and communities.

It is the irresistible taste of fufu and light soup, ampesi, kontomire stew, nkatenkwan, abunabunu and other traditional Asante delicacies, prepared and shared with the warmth and generosity for which our people are known.

It is the colourful celebration of Akwasidae, the grandeur of traditional durbars, the sound of drums, the elegance of traditional regalia and the hospitality of communities that welcome visitors as friends.

From the historic streets of Kumasi to the peaceful shores of Lake Bosomtwe, from royal heritage sites to hidden natural treasures across our districts, every journey reveals another chapter of the Asante story.

VisitAsanteman invites you to experience it all.

Discover our history. Explore our destinations. Taste our food. Celebrate our culture. Meet our people. Experience our hospitality. Find opportunities to learn, connect, do business and invest.

Whether you are visiting for the first time, returning to reconnect with your roots, researching our heritage or discovering opportunities in our communities, there is a place for you in Asanteman.

We honour our past, celebrate our present and welcome the possibilities of our future.

Yɛma wo akwaaba!

Welcome to Asanteman. Welcome to our heritage. Welcome home.$b$,
    updated_at = now()
where key = 'intro'
  and title = 'Welcome to VisitAsanteman'
  and body like 'Asanteman, the Ashanti Region of Ghana, is the homeland of the Asante%';
