import { accommodationTypes, businessTypes, restaurantTypes } from "@/config/site";
import type { Group } from "@/components/listings/ListingPages";

export const accommodationGroup: Group = {
  base: "accommodation", detail: "accommodation", title: "Accommodation", types: accommodationTypes, noun: "place to stay", withPrice: true,
  intro: "Hotels, guesthouses, lodges and holiday homes near Lake Bosomtwe.",
  emptyText: "Accommodation providers will appear here once they have been added and approved.",
};
export const restaurantGroup: Group = {
  base: "restaurants", detail: "restaurants", title: "Restaurants and local food", types: restaurantTypes, noun: "restaurant",
  intro: "Local kitchens and restaurants serving Ghanaian dishes around the lake.",
  emptyText: "Restaurants will appear here once they have been added and approved.",
};
export const businessGroup: Group = {
  base: "business-directory", detail: "business", title: "Tourism business directory", types: businessTypes, noun: "business",
  intro: "Tour operators, guides, boat operators, artisans and other local tourism businesses.",
  emptyText: "Businesses will appear here once they have been added and approved.",
};
