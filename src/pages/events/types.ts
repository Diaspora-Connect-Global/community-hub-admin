/**
 * Shared UI-level types and pure helpers for the Events admin pages.
 * These are the *view-model* types that sit on top of the raw API types
 * (ApiEventType, EventRegistration, etc.) from the GraphQL service layer.
 */
import type { EventType as ApiEventType } from "@/services/graphql/events";
import { resolveCurrency } from "@/lib/money";
import {
  defaultFieldDrafts,
  type RegistrationFieldDraft,
  type RegistrationFormField,
  type RegistrationMode,
} from "@/lib/eventRegistrationForm";
import type { AnswerValue } from "@/lib/eventRegistrationCsv";

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
  /** Tickets booked in this registration. */
  quantity: number;
  /** What the attendee answered, by question id (never shown as ids). */
  formResponses: Record<string, AnswerValue>;
  /** Raw registration standing (Awaiting approval, Waitlisted, Declined…); shown via RegistrationStatusBadge. */
  registrationStatus: string;
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
  /**
   * The currency its ticket prices are in: the event's own, else GHS — the
   * same fallback the server applies when a ticket is saved without one.
   */
  currency: string;
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
  /** Filled once the full event is loaded (the list query does not carry them). */
  registrationMode?: RegistrationMode;
  registrationLink?: string;
  registrationFormFields?: RegistrationFormField[];
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
  /** Where people register: DiaspoPlug's own form, or an organiser website. */
  registrationMode: RegistrationMode;
  registrationLink: string;
  /** The organiser-built form (IN_APP only). */
  registrationFields: RegistrationFieldDraft[];
  /**
   * Edit mode: whether the event's current registration setup has been loaded.
   * Until "ready" nothing about registration is sent, so a slow load can never
   * wipe an existing link or form.
   */
  registrationState: "loading" | "ready" | "error";
  /** Edit mode: signature of the form as loaded; the form is re-saved only when it differs. */
  registrationBaseline: string | null;
  /** Edit mode: the mode saved on the event, and how many people already registered. */
  savedRegistrationMode: RegistrationMode | null;
  registeredCount: number;
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
  registrationMode: "IN_APP",
  registrationLink: "",
  registrationFields: [],
  registrationState: "ready",
  registrationBaseline: null,
  savedRegistrationMode: null,
  registeredCount: 0,
};

/** A fresh create form: pre-populated with the four default registration fields. */
export function newEventForm(): EventFormState {
  return { ...initialEventForm, registrationFields: defaultFieldDrafts() };
}

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

/** An API ticket as an editable category: minor → major once, never rounded. */
export function ticketToCategory(t: { id: string; name: string; priceInCents: number; description?: string | null }): TicketCategory {
  return {
    id: t.id,
    name: t.name,
    // 12550 is 125.50 — rounding here would rewrite the price on the next save.
    price: t.priceInCents / 100,
    description: t.description ?? undefined,
  };
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
    currency: resolveCurrency(apiEvent.currency),
    ticketCategories: (apiEvent.tickets ?? []).map(ticketToCategory),
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
