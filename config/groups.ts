import { accommodationTypes, businessTypes, marketTypes, restaurantTypes, venueTypes } from "@/config/site";
import type { Group } from "@/components/listings/ListingPages";

export const accommodationGroup: Group = {
  base: "accommodation", detail: "accommodation", title: "Accommodation", types: accommodationTypes, noun: "place to stay", withPrice: true,
  intro: "Hotels, guesthouses, lodges and holiday homes across Asanteman.",
  emptyText: "Accommodation providers will appear here once they have been added and approved.",
};
export const restaurantGroup: Group = {
  base: "restaurants", detail: "restaurants", title: "Food and dining", types: restaurantTypes, noun: "restaurant",
  intro: "Restaurants, cafés, bakeries, traditional food vendors and caterers across Asanteman.",
  emptyText: "Restaurants will appear here once they have been added and approved.",
};
export const businessGroup: Group = {
  base: "business-directory", detail: "business", title: "Tourism business directory", types: businessTypes, noun: "business",
  intro: "Tour operators, guides, boat operators, artisans and other local tourism businesses.",
  emptyText: "Businesses will appear here once they have been added and approved.",
};
export const venuesGroup: Group = {
  base: "venues", detail: "venues", title: "Event venues", types: venueTypes, noun: "venue",
  intro: "Conference centres, event venues and wedding and reception venues across Asanteman.",
  emptyText: "Venues will appear here once they have been added and approved.",
};
export const marketsGroup: Group = {
  base: "markets", detail: "markets", title: "Markets and shopping", types: marketTypes, noun: "market",
  intro: "Traditional markets and shopping centres across Asanteman.",
  emptyText: "Markets will appear here once their details have been checked.",
};
