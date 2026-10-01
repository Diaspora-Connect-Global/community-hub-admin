/**
 * TypeScript types for Event Service GraphQL API.
 * Note: EventStatus values are lowercase (unlike Opportunity which uses UPPERCASE).
 */

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventLocationType = "physical" | "virtual" | "hybrid";
export type OwnerTypeEnum = "USER" | "COMMUNITY" | "ASSOCIATION";

export interface EventLocationDetails {
  type: string;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  virtualLink?: string | null;
  platform?: string | null;
}

export interface EventTicket {
  id: string;
  name: string;
  /** Price in cents — divide by 100 for display */
  priceInCents: number;
  description?: string | null;
  availableQuantity?: number | null;
}

/** Returned by createEventTicket / updateEventTicket (same shape as list tickets) */
export type EventTicketFull = EventTicket;

export interface EventType {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  startAt: string;
  endAt: string;
  eventCategory: string;
  locationType: EventLocationType;
  locationDetails: EventLocationDetails | null;
  isPaid: boolean;
  /** The event's currency; null when unset (the server then uses GHS for its tickets). */
  currency?: string | null;
  registrationCount: number;
  availableSpots?: number | null;
  isRegistered?: boolean | null;
  canRegister?: boolean | null;
  tickets?: EventTicket[] | null;
  coverImageUrl?: string | null;
  tags?: string[] | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  ticketId?: string | null;
  quantity: number;
  status: string;
  totalAmount?: number | null;
  currency?: string | null;
  /** Present when backend adds profile join */
  userName?: string | null;
  userEmail?: string | null;
  ticketName?: string | null;
  paymentStatus?: string | null;
  checkInStatus?: string | null;
  registeredAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
}

export interface EventListResponse {
  events: EventType[];
  total: number;
}

export interface EventRegistrationListResponse {
  registrations: EventRegistration[];
  total: number;
}

export interface DeleteEventResult {
  success: boolean;
  message?: string | null;
}

export interface ListEventsInput {
  ownerType?: OwnerTypeEnum;
  ownerId?: string;
  /** Lowercase values: "draft" | "published" | "cancelled" | "completed" */
  status?: EventStatus;
  limit?: number;
  offset?: number;
  /** Server-side text search when supported */
  searchTerm?: string;
}

/** locationDetails shape used in create/update — `type` must match locationType */
export interface EventLocationDetailsInput {
  type: string;
  /** Physical events: human-readable venue name */
  venue?: string;
  venueName?: string;
  address?: string;
  city?: string;
  country?: string;
  /** Virtual / hybrid events */
  virtualLink?: string;
  platform?: string;
}

export interface CreateEventInput {
  ownerType: OwnerTypeEnum;
  ownerId: string;
  title: string;
  description: string;
  eventCategory: string;
  /** Lowercase: "physical" | "virtual" | "hybrid" */
  locationType: EventLocationType;
  locationDetails: EventLocationDetailsInput;
  /** ISO 8601 — must be before endAt */
  startAt: string;
  /** ISO 8601 */
  endAt: string;
  isPaid?: boolean;
  /** Simple paid event price when not using ticket rows */
  ticketPrice?: number;
  currency?: string;
  timezone?: string;
  coverImageUrl?: string;
  tags?: string[];
  capacity?: number;
  visibility?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  eventCategory?: string;
  locationType?: EventLocationType;
  locationDetails?: EventLocationDetailsInput;
  startAt?: string;
  endAt?: string;
  isPaid?: boolean;
  ticketPrice?: number;
  currency?: string;
  timezone?: string;
  coverImageUrl?: string;
  tags?: string[];
  capacity?: number;
  visibility?: string;
}

/** Backend event analytics snapshot (field names align with getEventStats) */
/**
 * Mirrors the gateway's EventStatsGQL. The query used to select fields that
 * type doesn't have, so it failed validation on every call.
 */
export interface EventStats {
  totalRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  totalTicketsSold: number;
  totalCapacity: number;
  totalCheckIns: number;
  saveCount: number;
  /** Integer minor units, sent as a string. */
  totalRevenue?: string | null;
  currency?: string | null;
}

/**
 * Mirrors the gateway's CreateTicketInput. `priceInCents` is INTEGER minor
 * units (pesewas/cents) — convert major → minor once, at the form boundary.
 * Omit `currency` to use the event's currency.
 */
export interface CreateEventTicketInput {
  name: string;
  priceInCents: number;
  description?: string;
  ticketType?: string;
  quantity?: number;
  maxPerOrder?: number;
  currency?: string;
}

/**
 * Mirrors the gateway's UpdateTicketInput. Its `isActive` field is ignored by
 * event-service, so it is deliberately not offered here.
 */
export interface UpdateEventTicketInput {
  name?: string;
  priceInCents?: number;
  description?: string;
  quantity?: number;
  maxPerOrder?: number;
  currency?: string;
}

export interface TicketListResponse {
  tickets: EventTicket[];
  total?: number;
}
