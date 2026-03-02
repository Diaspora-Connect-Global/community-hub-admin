/**
 * Opportunity Service — GraphQL API for community admin.
 * Queries and mutations require Bearer JWT (community admin scope).
 */

export * from "./types";
export * from "./fragments";
export {
  getOpportunity,
  listOpportunities,
  getApplications,
  getApplication,
} from "./queries";
export {
  createOpportunity,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  deleteOpportunity,
  reviewApplication,
  acceptApplication,
  rejectApplication,
} from "./mutations";
