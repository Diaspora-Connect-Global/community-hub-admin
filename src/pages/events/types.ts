/**
 * Shared UI-level types and pure helpers for the Events admin pages.
 * These are the *view-model* types that sit on top of the raw API types
 * (ApiEventType, EventRegistration, etc.) from the GraphQL service layer.
 */
import type { EventType as ApiEventType } from "@/services/graphql/events";

export interface TicketCategory {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  ticketType: string;
  paymentStatus: string;
  checkInStatus: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  banner: string;
  eventType: "Physical" | "Online";
  venue?: string;
  onlineLink?: string;
  startDateTime: string;
  endDateTime: string;
  participantLimit: "Unlimited" | "Set Limit";
  maxParticipants?: number;
  pricingType: "Free" | "Paid";
  ticketCategories: TicketCategory[];
  refundPolicy?: string;
  createGroup: boolean;
  groupName?: string;
  registrations: number;
  remainingSlots: number | "Unlimited";
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  attendees: Attendee[];
}

/** The shape of both the create form and the edit form. */
export interface EventFormState {
  title: string;
  description: string;
  category: string;
  banner: string;
  eventType: "Physical" | "Online";
  venue: string;
  onlineLink: string;
  startDateTime: string;
  endDateTime: string;
  participantLimit: "Unlimited" | "Set Limit";
  maxParticipants: number;
  pricingType: "Free" | "Paid";
  ticketCategories: TicketCategory[];
  refundPolicy: string;
  createGroup: boolean;
  groupName: string;
}

export const initialEventForm: EventFormState = {
  title: "",
  description: "",
  category: "",
  banner: "",
  eventType: "Physical",
  venue: "",
  onlineLink: "",
  startDateTime: "",
  endDateTime: "",
  participantLimit: "Unlimited",
  maxParticipants: 100,
  pricingType: "Free",
  ticketCategories: [],
  refundPolicy: "No refunds",
  createGroup: false,
  groupName: "",
};

export const EVENT_CATEGORIES = [
  "All Categories",
  "Seminar",
  "Workshop",
  "Social Event",
  "Fundraiser",
  "Training",
  "Conference",
  "Meetup",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  Upcoming: "bg-primary/10 text-primary",
  Ongoing: "bg-success/10 text-success",
  Completed: "bg-secondary text-secondary-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Map a raw API event onto the local UI view-model. */
export function mapApiEvent(apiEvent: ApiEventType, fallbackBanner: string): Event {
  const now = new Date();
  const start = new Date(apiEvent.startAt);
  const end = new Date(apiEvent.endAt);

  let uiStatus: Event["status"] = "Upcoming";
  if (apiEvent.status === "cancelled") uiStatus = "Cancelled";
  else if (apiEvent.status === "completed") uiStatus = "Completed";
  else if (apiEvent.status === "published") {
    if (now >= end) uiStatus = "Completed";
    else if (now >= start) uiStatus = "Ongoing";
  }

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    category: apiEvent.eventCategory,
    banner: apiEvent.coverImageUrl ?? fallbackBanner,
    eventType:
      apiEvent.locationType === "physical" || apiEvent.locationType === "hybrid"
        ? "Physical"
        : "Online",
    venue: apiEvent.locationDetails?.venueName ?? undefined,
    onlineLink: apiEvent.locationDetails?.virtualLink ?? undefined,
    startDateTime: apiEvent.startAt,
    endDateTime: apiEvent.endAt,
    participantLimit: apiEvent.availableSpots != null ? "Set Limit" : "Unlimited",
    maxParticipants:
      apiEvent.availableSpots != null
        ? apiEvent.registrationCount + apiEvent.availableSpots
        : undefined,
    pricingType: apiEvent.isPaid ? "Paid" : "Free",
    ticketCategories: (apiEvent.tickets ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      price: Math.round(t.priceInCents / 100),
      description: t.description ?? undefined,
    })),
    createGroup: false,
    registrations: apiEvent.registrationCount,
    remainingSlots:
      apiEvent.availableSpots != null ? apiEvent.availableSpots : "Unlimited",
    status: uiStatus,
    attendees: [],
  };
}
