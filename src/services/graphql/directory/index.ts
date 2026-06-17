/**
 * Directory Service — GraphQL API for community/association admin.
 *
 * Staff/org-scoped surface only. All queries and mutations require a Bearer JWT;
 * the api-gateway asserts the caller is active org staff of the listing owner
 * (community/association admin or officer) before forwarding to directory-service.
 *
 * System-admin operations (verify/reject/suspend/category CRUD/pending review)
 * are intentionally NOT exposed here — they live in the super-admin hub.
 */

export * from "./types";
export * from "./fragments";
export {
  ownerDirectoryListings,
  directoryListing,
  directoryCategories,
  searchDirectory,
  type OwnerDirectoryListingsArgs,
} from "./queries";
export {
  createDirectoryListing,
  updateDirectoryListing,
  publishDirectoryListing,
  unpublishDirectoryListing,
  archiveDirectoryListing,
} from "./mutations";
