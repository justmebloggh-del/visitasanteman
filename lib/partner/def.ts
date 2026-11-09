import { accommodationTypes, accountListingTypes, type BusinessAccountType } from "@/config/site";
import { listingFields, type ResourceDef } from "@/config/admin-resources";

/** Form definition for a partner's own listings. No status, verification, featured or plan fields. */
export function partnerListingDef(accountType: BusinessAccountType): ResourceDef {
  const types = accountListingTypes[accountType];
  const stay = types.some((t) => accommodationTypes.includes(t));
  return {
    key: "partner-listings", table: "listings", label: "Listings", singular: "listing", titleField: "name",
    hasSlug: false, hasStatus: false, hasCover: true, galleryEntity: "listing", seo: false, softDelete: true,
    orderBy: { column: "updated_at", ascending: false }, listColumns: [],
    typeFilter: { column: "type", values: types },
    fields: listingFields(types, types.includes("restaurant"), stay).filter((f) => !f.adminOnly && f.name !== "status"),
  };
}
