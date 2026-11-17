/**
 * "The rise of the Asante Empire, 1680 to 1750", written in our own words from one secondary source:
 * Nick Richwagen, "The Rise of the Asante Empire (1680-1750)", Seventh Coalition, 10 September 2017
 * (https://seventhcoalition.org/2017/09/10/the-rise-of-the-asante-empire-1680-1750/).
 * Nothing here is added from memory. Dates and figures are the source's and are marked as such; where other sources on this site
 * differ, that is said. It awaits review by the custodians of Asante history before it can be marked verified.
 */
const sections: { id: string; title: string; paragraphs: string[] }[] = [
  {
    id: "akan-forest", title: "The Akan and the forest",
    paragraphs: [
      "The Asante are Akan. About 20 million people speak Akan languages today, across what is now Ghana and Côte d'Ivoire, and Akan peoples share descent through the mother's line, a system of chieftaincy and a body of related folklore. The article dates the first Akan movement from the Sahel into the forests of the Gold Coast to the 11th century. Akan tradition itself also looks much further east for the origin of the people.",
      "The forest was not an easy place to build a state. Its soils were poor for grain, so people grew yams, tree crops and oil palms, and the arrival of iron tools made it possible for those crops to feed larger communities. The article notes that most forest states appeared only in the 17th century, and ties that to the changes the Atlantic trade brought to the region.",
    ],
  },
  {
    id: "first-states", title: "Bonoman and the first Akan states",
    paragraphs: [
      "Bonoman, founded in the 12th century according to the article, became a trading power with its own gold. Its rise followed the slow decline, from the 13th century, of the Sahel gold mines that had supported the Mali Empire. Akan groups spread out from Bonoman, and political power gathered around the gold mines.",
      "By the 17th century a number of small Akan kingdoms had emerged, among them Denkyira, Akyem and Akwamu.",
    ],
  },
  {
    id: "atlantic", title: "The Atlantic trade changes the balance of power",
    paragraphs: [
      "Portuguese ships reached the Gold Coast in the 15th century, and in 1482 the Portuguese founded Mina Castle at Elmina, which the Dutch took in 1637. Europeans could not travel far inland and suffered heavily from tropical disease, so they built coastal forts that became places to process and load enslaved people. Rather than seize captives themselves, they traded manufactured goods to African states in exchange for them.",
      "Firearms decided who held power. States that obtained muskets grew strong at the expense of their neighbours. Denkyira built the first great Akan empire and, by the article's account, controlled the Gold Coast by 1660, ruling through subordinate chiefs who kept their position as long as they paid tribute. Akwamu, north of present-day Accra, conquered Accra in 1681 and by shortly after 1700 controlled much of the eastern Gold Coast. Wars between Denkyira and Akwamu divided the Akan, and Denkyira's loose, tribute-based empire grew weaker as its subjects slipped away.",
    ],
  },
  {
    id: "early-asante", title: "Kumasi and the early Asante",
    paragraphs: [
      "Smaller Akan groups left the reach of Denkyira and settled around Kumasi. By the late 17th century they were led by one ruler, the Kumasehene, a title that later became Asantehene. Obiri Yeboa was the first prominent Kumasehene, and he strengthened the Oyoko clan through a mixture of force and diplomacy, drawing other Akan nobles into his circle.",
    ],
  },
  {
    id: "osei-tutu", title: "Osei Tutu and the defeat of Denkyira",
    paragraphs: [
      "The article gives Osei Tutu's reign as 1680 to 1717 and calls him the first Kumasi ruler to take the title Asantehene. Before that he had lived at the Akwamu court as a resident prince, where he learned their ways of fighting and made them his allies. With Akwamu support he rose against Denkyira. The Asante developed a pincer formation that struck an enemy's flanks and rear.",
      "The article says the war turned especially bitter after 1698, when Osei Tutu's favourite wife, sent to Denkyira as an envoy of goodwill, was assaulted by the Denkyira king. At the Battle of Feyiase in 1701 the Asante defeated Denkyira decisively. The Denkyirahene was killed, and Denkyira never regained its former power. The Asante were now the leading force in the Gold Coast trade.",
    ],
  },
  {
    id: "golden-stool", title: "The Golden Stool and the Kotoko Council",
    paragraphs: [
      "The article places the beginning of the Golden Stool tradition in Osei Tutu's time. In Asante tradition the Golden Stool, Sika Dwa Kofi, came to the Asante by a miraculous route: the chief priest Okomfo Anokye is believed to have called it down from the heavens. It is held to carry the soul of the Asante nation, and the Asantehene does not sit on it. According to the article, Akan peoples who joined the Asante were asked to bury their own stools as a mark of respect.",
      "To bring newly joined peoples into the state, Osei Tutu used the Kotoko Council. Those peoples could join the Asante directly or remain as semi-autonomous client states.",
      "The Golden Stool is sacred. How its story is told belongs to the Asante and their custodians, and this summary is only a pointer to it.",
    ],
  },
  {
    id: "opoku-ware", title: "Opoku Ware and the push north",
    paragraphs: [
      "In 1717, during a campaign against Akyem, Osei Tutu was shot by an enemy sharpshooter as he crossed the Pra River in a canoe, and he died. Opoku Ware succeeded him and extended Asante power to the north. By about 1730, Bonoman and the non-Akan Gonja and Dagomba peoples had been brought into the empire, with Dagomba keeping some independence as a client state. Taking Bonoman gave the Asante access to the Lobi gold fields. The article says Dagomba supplied more than a thousand enslaved people each year. Opoku Ware died in 1750.",
    ],
  },
  {
    id: "society", title: "Asante society",
    paragraphs: [
      "The article describes a society of clear ranks. The nobility and royal court were the sikapo, a Twi word that it translates as people of wealth, and they displayed their gold openly. Free commoners, the ahiato, mostly farmed and lived in simple huts. The upper class held large estates worked by many enslaved people.",
      "Slavery was central to the economy, and selling enslaved people to Europeans was part of that trade. The article describes harsh conditions for people enslaved in the gold mines and on farms, and several levels of servitude, including labourers bound for a fixed term. It adds that freed people could be absorbed into Asante society and that freedmen could become influential. It connects this to the proverb \"Obi nkyere obi ase\", which holds that no one should reveal another person's origins.",
      "According to the article, most of the kingdom's gold belonged personally to the Asantehene, and when a wealthy sikapo died only a small share passed to heirs while the rest went to the king. A police force watched movement in and out of the kingdom, and punishments could be severe. Akan traditional religion was practised, and Muslim advisers from the Sahel and Arab visitors were a familiar presence at court.",
    ],
  },
  {
    id: "in-1750", title: "The empire in 1750",
    paragraphs: [
      "By the time of Opoku Ware's death the empire reached far north towards the Sahel. The article puts it at about 100,000 square miles with roughly three million subjects, and says no other state in West Africa matched its wealth and power.",
      "It also lists the tensions ahead. The Fante Federation of States, on the coast near Elmina, wanted to control the coastal trade with Europeans and was allied with the British, who disliked Asante interference in Fante trade. Subject Akan chiefs had varied loyalties and a good deal of freedom. The Gonja and Dagomba resented Asante rule. Osei Kwadwo took the throne in 1764.",
      "Later in the same article, the author notes that Britain annexed the Asante as a protectorate in 1902, after a series of hard-fought wars in the 19th century. The Asante today number about seven million people, with Kumasi at the centre, and the article says the position of the Asantehene is protected by Ghana's constitution.",
    ],
  },
];

export function AsanteRise() {
  return (
    <article aria-labelledby="rise-title" className="mt-14 border-t border-line pt-10">
      <h2 id="rise-title" className="font-serif text-3xl font-semibold text-forest">The rise of the Asante Empire, 1680 to 1750</h2>
      <p className="mt-3 max-w-3xl rounded-xl bg-mist p-4 text-sm text-muted">
        <strong className="text-ink">Source:</strong> written in our own words from Nick Richwagen, “The Rise of the Asante Empire (1680-1750)”, Seventh Coalition, 10 September 2017
        {" "}(<a href="https://seventhcoalition.org/2017/09/10/the-rise-of-the-asante-empire-1680-1750/" className="underline" rel="noopener noreferrer" target="_blank">link</a>).
        This is a secondary source and has not yet been reviewed by the custodians of Asante history. Other sources on this site give different dates in places: the Ghana Tourism Authority, for example, describes Kumasi as founded in 1695 by Osei Tutu. Dates here are the article&rsquo;s.
      </p>
      <nav aria-label="In this history" className="mt-6">
        <ul className="flex flex-wrap gap-2 text-sm">
          {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="rounded-full border border-line px-3 py-1.5 hover:bg-forest-soft">{s.title}</a></li>)}
        </ul>
      </nav>
      <div className="mt-8 max-w-3xl space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-40">
            <h3 id={`${s.id}-h`} className="font-serif text-2xl font-semibold text-forest">{s.title}</h3>
            <div className="mt-3 space-y-4 text-lg leading-relaxed text-ink">{s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
