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
  timezone?: string;
  coverImageUrl?: string;
  tags?: string[];
  capacity?: number;
  visibility?: string;
}
