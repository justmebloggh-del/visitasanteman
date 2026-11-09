export const siteConfig = {
  /** Brand name, always written exactly like this. */
  name: "VisitAsanteman",
  /** Spoken / spaced form, for sentences. */
  displayName: "Visit Asanteman",
  shortName: "Asanteman",
  tagline: "Discover Ashanti. Experience Our Heritage.",
  description:
    "Plan your visit to the Ashanti Region of Ghana: attractions, culture and heritage, places to stay, food, experiences and events across every district.",
  region: "Ashanti Region",
};

// Main menu (desktop bar and mobile menu). "Plan Your Visit" is shown separately as the main action.
export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Ashanti" },
  { href: "/attractions", label: "Attractions" },
  { href: "/culture", label: "Culture & Heritage" },
  { href: "/experiences", label: "Experiences" },
  { href: "/accommodation", label: "Where to Stay" },
  { href: "/restaurants", label: "Food & Dining" },
  { href: "/events", label: "Events" },
  { href: "/travel-guide", label: "Travel Guide" },
  { href: "/business-directory", label: "Business Directory" },
  { href: "/about", label: "About Us" },
];
export const planVisit = { href: "/travel-planner", label: "Plan Your Visit" };

export type ListingType =
  | "hotel" | "resort" | "guesthouse" | "lodge" | "eco_lodge" | "holiday_home" | "apartment"
  | "restaurant"
  | "tour_operator" | "tour_guide" | "boat_operator" | "transport" | "event_organiser"
  | "photography" | "artisan" | "souvenir_shop" | "travel_agency" | "supplier"
  | "boutique_hotel" | "homestay" | "conference_centre" | "event_venue" | "wedding_venue"
  | "cafe" | "bakery" | "food_vendor" | "caterer"
  | "market" | "shopping_centre" | "craft_producer" | "jeweller" | "manufacturer" | "agribusiness" | "food_producer" | "professional_services";

export const listingTypeLabels: Record<ListingType, string> = {
  hotel: "Hotel", resort: "Resort", guesthouse: "Guesthouse", lodge: "Lodge", eco_lodge: "Eco-lodge",
  holiday_home: "Holiday home", apartment: "Apartment", restaurant: "Restaurant",
  tour_operator: "Tour operator", tour_guide: "Tour guide", boat_operator: "Boat operator",
  transport: "Transport provider", event_organiser: "Event organiser", photography: "Photography service",
  artisan: "Artisan", souvenir_shop: "Souvenir shop", travel_agency: "Travel agency", supplier: "Local supplier",
  boutique_hotel: "Boutique hotel", homestay: "Homestay", conference_centre: "Conference centre", event_venue: "Event venue",
  wedding_venue: "Wedding and reception venue", cafe: "Café", bakery: "Bakery", food_vendor: "Traditional food vendor", caterer: "Catering provider",
  market: "Market", shopping_centre: "Shopping centre", craft_producer: "Craft producer", jeweller: "Jewellery and goldsmith",
  manufacturer: "Local manufacturer", agribusiness: "Agribusiness and farm", food_producer: "Food producer", professional_services: "Professional services",
};

export const priceRangeLabels: Record<string, string> = { budget: "Budget", mid_range: "Mid-range", upscale: "Upscale" };

export const accommodationTypes: ListingType[] = [
  "hotel", "resort", "guesthouse", "lodge", "eco_lodge", "boutique_hotel", "homestay", "holiday_home", "apartment",
];
export const restaurantTypes: ListingType[] = ["restaurant", "cafe", "bakery", "food_vendor", "caterer"];
export const venueTypes: ListingType[] = ["conference_centre", "event_venue", "wedding_venue"];
export const marketTypes: ListingType[] = ["market", "shopping_centre"];
export const businessTypes: ListingType[] = [
  "tour_operator", "tour_guide", "boat_operator", "transport", "event_organiser",
  "photography", "artisan", "souvenir_shop", "travel_agency", "supplier",
  "craft_producer", "jeweller", "manufacturer", "agribusiness", "food_producer", "professional_services",
];

export type ListingSection = "accommodation" | "restaurants" | "venues" | "markets" | "business";
/** Which public section (and URL base) a listing type belongs to. One place, used by pages, map and sitemap. */
export function listingSection(type: string): ListingSection {
  if (accommodationTypes.includes(type as ListingType)) return "accommodation";
  if (restaurantTypes.includes(type as ListingType)) return "restaurants";
  if (venueTypes.includes(type as ListingType)) return "venues";
  if (marketTypes.includes(type as ListingType)) return "markets";
  return "business";
}

export const experienceCategoryLabels: Record<string, string> = {
  boat_cruise: "Boat cruises", guided_tour: "Guided tours", fishing: "Fishing", hiking: "Hiking",
  cycling: "Cycling", birdwatching: "Birdwatching", photography: "Photography tours", cultural: "Cultural tours",
  community: "Community experiences", nature: "Nature exploration", group_excursion: "Group excursions",
  family: "Family activities",
  heritage_tour: "Heritage tours", craft_workshop: "Craft workshops", food_experience: "Food experiences", city_tour: "City tours",
  festival_experience: "Festival experiences", farm_visit: "Farm visits", educational_excursion: "Educational excursions",
  wildlife_viewing: "Wildlife viewing", waterfall_visit: "Waterfall visits",
};

export const ceremonyKindLabels: Record<string, string> = {
  ceremony: "Traditional ceremony", festival: "Festival", durbar: "Durbar", performance: "Music, dance or performance",
  craft_demonstration: "Craft demonstration", exhibition: "Cultural exhibition", other: "Other cultural occasion",
};
export const attendanceLabels: Record<string, string> = {
  unknown: "Public attendance has not been confirmed",
  public: "Open to the public",
  public_with_conditions: "Open to the public, with conditions",
  by_invitation: "By invitation only",
  restricted: "Restricted: sacred or private, not open to visitors",
};

export const eventStatusLabels: Record<string, string> = {
  scheduled: "Scheduled", cancelled: "Cancelled", postponed: "Postponed", completed: "Completed",
};

export const PAGE_SIZE = 12;

export type BusinessAccountType = "accommodation" | "restaurant" | "tour_operator" | "boat_operator" | "tour_guide" | "general";

export const accountTypeLabels: Record<BusinessAccountType, string> = {
  accommodation: "Accommodation provider", restaurant: "Restaurant owner", tour_operator: "Tour operator",
  boat_operator: "Boat operator", tour_guide: "Tour guide", general: "General tourism business",
};

/** Listing types a partner of each account type may create. */
export const accountListingTypes: Record<BusinessAccountType, ListingType[]> = {
  accommodation: [...accommodationTypes, ...venueTypes], restaurant: restaurantTypes, tour_operator: ["tour_operator", "travel_agency", "transport"],
  boat_operator: ["boat_operator"], tour_guide: ["tour_guide"], general: [...businessTypes, ...marketTypes],
};

export type ProjectStage = "operational" | "approved" | "proposed" | "under_consideration";

export const stageLabels: Record<ProjectStage, string> = {
  operational: "Existing operational facility", approved: "Approved project",
  proposed: "Proposed development concept", under_consideration: "Opportunity under consideration",
};

/** Shown on every project page so a concept is never mistaken for an approved or funded project. */
export const stageNotice: Record<ProjectStage, string | null> = {
  operational: null,
  approved: "Approved status is reported by the source named below. It does not mean the project is funded or under construction.",
  proposed: "This is a concept only. It has not been approved, funded or scheduled, and no commitment has been made by any authority.",
  under_consideration: "This opportunity is being considered. No decision has been made, and it is not an approved or funded project.",
};
