/**
 * Resource Service — GraphQL API for community / association admin.
 *
 * Staff/org-scoped management surface. All operations require a Bearer JWT; the
 * gateway membership-gates each call to staff of the resource owner (fail-closed).
 *
 * MONEY: `downloadFeeMinor` is integer minor units (×100 of the major unit);
 * 0 / omitted = free. Divide by 100 only at the display boundary.
 */

export * from "./types";
export * from "./fragments";
export { resourcesByOwner, resourceCategories } from "./queries";
export {
  createResource,
  updateResource,
  publishResource,
  unpublishResource,
  archiveResource,
  requestResourceUploadUrl,
  confirmResourceVersion,
} from "./mutations";
export type {
  CreateResourceInput,
  UpdateResourceInput,
} from "./mutations";
export { uploadResourceFile } from "./uploads";
