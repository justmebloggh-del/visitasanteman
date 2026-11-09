export const siteConfig = {
  name: "Visit Lake Bosomtwe",
  tagline: "Discover the Extraordinary. Experience the Beauty.",
  description:
    "Plan your visit to Lake Bosomtwe in Ghana's Ashanti Region: attractions, communities, places to stay, food, experiences and events.",
};

export const mainNav = [
  { href: "/explore", label: "Explore" },
  { href: "/attractions", label: "Attractions" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/experiences", label: "Experiences" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/events", label: "Events" },
  { href: "/travel-guide", label: "Travel Guide" },
  { href: "/travel-planner", label: "Planner" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export type ListingType =
  | "hotel" | "resort" | "guesthouse" | "lodge" | "eco_lodge" | "holiday_home" | "apartment"
  | "restaurant"
  | "tour_operator" | "tour_guide" | "boat_operator" | "transport" | "event_organiser"
  | "photography" | "artisan" | "souvenir_shop" | "travel_agency" | "supplier";

export const listingTypeLabels: Record<ListingType, string> = {
  hotel: "Hotel", resort: "Resort", guesthouse: "Guesthouse", lodge: "Lodge", eco_lodge: "Eco-lodge",
  holiday_home: "Holiday home", apartment: "Apartment", restaurant: "Restaurant",
  tour_operator: "Tour operator", tour_guide: "Tour guide", boat_operator: "Boat operator",
  transport: "Transport provider", event_organiser: "Event organiser", photography: "Photography service",
  artisan: "Artisan", souvenir_shop: "Souvenir shop", travel_agency: "Travel agency", supplier: "Local supplier",
};

export const accommodationTypes: ListingType[] = [
  "hotel", "resort", "guesthouse", "lodge", "eco_lodge", "holiday_home", "apartment",
];
export const restaurantTypes: ListingType[] = ["restaurant"];
export const businessTypes: ListingType[] = [
  "tour_operator", "tour_guide", "boat_operator", "transport", "event_organiser",
  "photography", "artisan", "souvenir_shop", "travel_agency", "supplier",
];

export const experienceCategoryLabels: Record<string, string> = {
  boat_cruise: "Boat cruises", guided_tour: "Guided lake tours", fishing: "Fishing", hiking: "Hiking",
  cycling: "Cycling", birdwatching: "Birdwatching", photography: "Photography tours", cultural: "Cultural tours",
  community: "Community experiences", nature: "Nature exploration", group_excursion: "Group excursions",
  family: "Family activities",
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
  accommodation: accommodationTypes, restaurant: restaurantTypes, tour_operator: ["tour_operator", "travel_agency", "transport"],
  boat_operator: ["boat_operator"], tour_guide: ["tour_guide"], general: businessTypes,
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
