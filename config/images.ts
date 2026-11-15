/**
 * Photographs kept in public/Asante, with plain descriptions that say only what the picture shows.
 * Names of people and places are deliberately left out unless the picture itself names them, because
 * nothing here has been verified by the regional tourism office. Replace or add pictures in Admin, Media library;
 * pictures uploaded there always win over these built-in ones.
 *
 * Not used as a photograph of the Golden Stool: the Golden Stool is sacred, and none of these pictures is
 * confirmed to show it. The gold items below are described as royal regalia only.
 */
export interface StaticImage {
  src: string;
  alt: string;
  /** Short line shown under the picture when it is displayed as a figure. */
  caption?: string;
  /** CSS object-position, so a banner crop keeps the interesting part. */
  position?: string;
  width: number;
  height: number;
}

const at = (file: string) => encodeURI(`/Asante/${file}`);

const raw = {
  lake: { src: at("Lake Bosomtwe.jpeg"), width: 415, height: 739, position: "center 45%",
    alt: "Aerial view of a large, deep-blue crater lake ringed by forested hills, with a small settlement along its shore",
    caption: "Lake Bosomtwe from above" },
  festival: { src: at("Asante festivals and cultural celebrations.jpeg"), width: 415, height: 739, position: "center 50%",
    alt: "Aerial view of a large outdoor gathering: decorated umbrellas and crowds in colourful cloth seated in rows",
    caption: "A cultural gathering seen from above" },
  kenteLoom: { src: at("Kente weaving communities.jpeg"), width: 554, height: 554, position: "center 60%",
    alt: "A strip of kente cloth in yellow, green, red and black taking shape on a hand loom",
    caption: "Kente on the loom" },
  kenteDisplay: { src: at("kentedisplay.jpeg"), width: 678, height: 452, position: "center 35%",
    alt: "Chiefs and elders in colourful kente cloth and gold jewellery at a public ceremony",
    caption: "Elders in kente and gold at a public ceremony" },
  regalia: { src: at("goldenstool.jpeg"), width: 586, height: 385, position: "center 50%",
    alt: "Gold ornaments and a bell displayed on a black stool studded with brass nails at a royal ceremony",
    caption: "Gold regalia displayed at a royal ceremony" },
  regaliaBearer: { src: at("goldenstoolcareer.jpeg"), width: 683, height: 449, position: "center 40%",
    alt: "An attendant carrying a large gold ornament on his shoulder at a royal ceremony",
    caption: "An attendant carrying gold regalia" },
  chief: { src: at("sika dwa kofi.jpeg"), width: 659, height: 465, position: "center 40%",
    alt: "A seated chief in kente cloth and gold jewellery beside a stool carrying gold ornaments",
    caption: "A chief in kente and gold at a ceremony" },
  fufu: { src: at("traditionalfoodpounding.jpeg"), width: 399, height: 501, position: "center 45%",
    alt: "Fufu being pounded in a wooden mortar with a long pestle",
    caption: "Pounding fufu" },
  celebration: { src: at("Traditional cuisine.jpeg"), width: 678, height: 452, position: "center 40%",
    alt: "Guests in kente and traditional cloth at a celebration, with clay pots and calabashes of food in the foreground. The logo reads Otumfuo Osei Tutu II Silver Jubilee Celebration",
    caption: "Guests at the Otumfuo Osei Tutu II Silver Jubilee Celebration" },
  waterfall: { src: at("agona tabre waterfall.jpeg"), width: 409, height: 488, position: "center 35%",
    alt: "A tall waterfall dropping into a pool, with a crowd of visitors gathered at its base",
    caption: "Visitors at a waterfall" },
  artisans: { src: at("Artisans and traditional craftsmanship.jpeg"), width: 739, height: 415, position: "center 45%",
    alt: "People gathered around a long table of cloth strips stamped with Adinkra symbols, with hanging cloths behind them",
    caption: "Cloth stamped with Adinkra symbols" },
  adinkraChart: { src: at("Gyaman_Adinkra_Symbols.jpg"), width: 1580, height: 1492,
    alt: "A chart of 108 Adinkra symbols, each labelled with its name",
    caption: "A chart of Adinkra symbols and their names. Their meanings are not given here: ask a cultural custodian or the craftspeople who print them." },
  districtMap: { src: at("Historic towns and communities.png"), width: 533, height: 375,
    alt: "Outline map of the districts of the Ashanti Region, each district labelled and shaded in a different colour",
    caption: "An outline of the region's districts. The shading comes from the original picture and means nothing on this site. Names and boundaries change, so use the district list as the reference." },
  jetty: { src: at("lakeside-jetty.jpg"), width: 450, height: 280, position: "center 55%",
    alt: "A wooden jetty with shaded seating reaching out over calm lake water, with hills beyond",
    caption: "A lakeside jetty with seating" },
} satisfies Record<string, StaticImage>;

export type ImageKey = keyof typeof raw;
export const images: Record<ImageKey, StaticImage> = raw;

/** Built-in picture for a theme, used only while the theme has no uploaded cover. */
export const themeImages: Record<string, ImageKey> = {
  eat: "fufu", wear: "kenteLoom", see: "lake", feel: "festival",
  culture: "kenteDisplay", heritage: "regalia", nature: "waterfall", lifestyle: "jetty",
};

/** Built-in picture for an attraction category. Categories without a matching picture are left out on purpose. */
export const categoryImages: Record<string, ImageKey> = {
  lakeside: "lake", natural: "lake", "waterfalls-forests": "waterfall", "markets-crafts": "artisans",
  "cultural-historical": "regalia", recreation: "jetty",
};

export const destinationImages: Record<string, ImageKey> = { "lake-bosomtwe": "lake" };

/** Picture shown under the banner of a CMS page, by page slug (only when the page has text and no uploaded cover). */
export const pageImages: Record<string, ImageKey> = {
  culture: "kenteDisplay", "culture-festivals": "festival", "culture-history": "regalia", "culture-traditions": "chief",
  "culture-crafts": "kenteLoom", "culture-food": "fufu", "why-ashanti": "lake", about: "kenteDisplay",
  "international-come-home": "lake", "international-heritage-travel": "regaliaBearer", international: "festival",
};

/** A MediaRef-shaped value, so every existing image slot can show a built-in picture. */
export function asMedia(key: ImageKey | undefined) {
  if (!key) return null;
  const i = images[key];
  return { path: i.src, alt_text: i.alt };
}
