/** Interest-based suggestions. Rule-based on purpose: transparent, free, and uses only published platform data. */
export const INTERESTS = [
  { id: "nature", label: "Nature" }, { id: "culture", label: "Culture and heritage" }, { id: "adventure", label: "Adventure" },
  { id: "relaxation", label: "Relaxation" }, { id: "family", label: "Family" }, { id: "photography", label: "Photography" },
  { id: "birdwatching", label: "Birdwatching" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];
export const interestIds = INTERESTS.map((i) => i.id) as string[];

const RULES: Record<InterestId, { attractionCategories: string[]; experienceCategories: string[] }> = {
  nature: { attractionCategories: ["natural", "eco-tourism"], experienceCategories: ["nature", "birdwatching", "hiking"] },
  culture: { attractionCategories: ["cultural-historical", "religious-heritage", "community"], experienceCategories: ["cultural", "community"] },
  adventure: { attractionCategories: ["adventure"], experienceCategories: ["hiking", "cycling", "boat_cruise", "fishing"] },
  relaxation: { attractionCategories: ["lakeside", "recreation"], experienceCategories: ["boat_cruise", "nature"] },
  family: { attractionCategories: ["recreation", "lakeside"], experienceCategories: ["family", "group_excursion"] },
  photography: { attractionCategories: ["natural", "lakeside"], experienceCategories: ["photography"] },
  birdwatching: { attractionCategories: ["natural", "eco-tourism"], experienceCategories: ["birdwatching"] },
};

interface HasCategory { id: string; category?: { slug: string } | null }
interface HasExpCategory { id: string; category: string }

export function recommend<A extends HasCategory, E extends HasExpCategory>(interests: string[], attractions: A[], experiences: E[], limit = 4) {
  const valid = interests.filter((i): i is InterestId => interestIds.includes(i));
  if (!valid.length) return { attractions: [] as A[], experiences: [] as E[] };
  const aCats = new Set(valid.flatMap((i) => RULES[i].attractionCategories));
  const eCats = new Set(valid.flatMap((i) => RULES[i].experienceCategories));
  return {
    attractions: attractions.filter((a) => a.category && aCats.has(a.category.slug)).slice(0, limit),
    experiences: experiences.filter((e) => eCats.has(e.category)).slice(0, limit),
  };
}
