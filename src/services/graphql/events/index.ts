/**
 * Event Service — GraphQL API for community admin.
 * All queries and mutations require Bearer JWT (community admin scope).
 */

export * from "./types";
export * from "./fragments";
export {
  listEvents,
  getEvent,
  getEventRegistrations,
} from "./queries";
export {
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
  markRegistrationCheckedIn,
  removeEventRegistration,
} from "./mutations";
