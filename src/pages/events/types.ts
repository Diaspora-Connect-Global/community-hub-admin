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
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Draft";
  /**
   * The raw API status, preserved so the UI can detect drafts (which would
   * otherwise be indistinguishable from "Upcoming"). Use `isDraft` for the
   * common "show the publish action" check.
   */
  apiStatus: "draft" | "published" | "cancelled" | "completed";
  /** Convenience flag — true when the event is still a DRAFT (not yet published). */
  isDraft: boolean;
  attendees: Attendee[];
}

/** The shape of both the create form and the edit form. */
export interface EventFormState {
  title: string;
  description: string;
  category: string;
  /**
   * The image preview source for the banner. Either:
   *   - An https URL (for events being edited where the cover already lives in GCS), or
   *   - A blob/object URL when the user has just picked a new file (paired with
   *     `bannerFile` below).
   *
   * Submit-time handlers should NOT send this value to the API directly when
   * `bannerFile` is present — upload the file first and replace the URL.
   */
  banner: string;
  /**
   * The raw `File` the user picked, when applicable. When set, the create/edit
   * handlers must upload this via `uploadEventCoverImage(...)` and use the
   * returned public URL as `coverImageUrl`, instead of inlining a base64 data
   * URL into the GraphQL mutation.
   */
  bannerFile?: File | null;
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
  bannerFile: null,
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
  Draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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

  // Preserve the raw API status so drafts stay detectable. Anything that is
  // not one of the known terminal/published states is treated as a draft.
  const apiStatus: Event["apiStatus"] =
    apiEvent.status === "cancelled" ||
    apiEvent.status === "completed" ||
    apiEvent.status === "published"
      ? apiEvent.status
      : "draft";
  const isDraft = apiStatus === "draft";

  let uiStatus: Event["status"] = "Upcoming";
  if (apiStatus === "cancelled") uiStatus = "Cancelled";
  else if (apiStatus === "completed") uiStatus = "Completed";
  else if (apiStatus === "draft") uiStatus = "Draft";
  else if (apiStatus === "published") {
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
    apiStatus,
    isDraft,
    attendees: [],
  };
}
