import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
  cancelEvent,
  createEventTicket,
  updateEventTicket,
  markRegistrationCheckedIn,
  getEvent,
  getEventRegistrations,
} from "@/services/graphql/events";
import type { EventRegistration } from "@/services/graphql/events";
import type { Event, EventFormState, Attendee } from "@/pages/events/types";

// ---------------------------------------------------------------------------
// Local helpers (pure — no side-effects, moved here from the monolith)
// ---------------------------------------------------------------------------

function inferPaymentLabel(r: EventRegistration): string {
  if (r.paymentStatus) return r.paymentStatus;
  const s = r.status?.toUpperCase() ?? "";
  if (s.includes("REFUND")) return "Refunded";
  if (r.totalAmount != null && Number(r.totalAmount) > 0) return "Paid";
  if (s.includes("PENDING")) return "Pending";
  if (s.includes("CONFIRM")) return "Paid";
  return "—";
}

function inferCheckInLabel(r: EventRegistration): string {
  if (r.checkInStatus) {
    return /checked/i.test(r.checkInStatus) ? "Checked In" : "Not checked in";
  }
  const s = r.status?.toUpperCase() ?? "";
  if (
    s.includes("CHECKED_IN") ||
    s.includes("ATTENDED") ||
    /\bCHECK[\s_-]*IN\b/.test(s)
  ) {
    return "Checked In";
  }
  return "Not checked in";
}

function mapRegistrationToAttendee(
  r: EventRegistration,
  ticketLabel: string,
): Attendee {
  const name = r.userName?.trim() || `User ${r.userId.slice(0, 8)}…`;
  const email = r.userEmail?.trim() || "—";
  return {
    id: r.id,
    name,
    email,
    registrationDate: new Date(r.registeredAt).toLocaleString(),
    ticketType: ticketLabel,
    paymentStatus: inferPaymentLabel(r),
    checkInStatus: inferCheckInLabel(r),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseEventActionsOptions {
  scopeId: string;
  /** Replaces the full events list after a mutating operation. */
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  /** Replaces (or clears) the currently-selected event. */
  setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  /** Called after any mutation that requires a full re-fetch. */
  onRefetch: () => void;
}

export interface UseEventActionsReturn {
  createEventHandler: (
    form: EventFormState,
    onSuccess: () => void,
  ) => Promise<void>;
  saveEditHandler: (
    event: Event,
    form: EventFormState,
    onSuccess: () => void,
  ) => Promise<void>;
  confirmDeleteHandler: (event: Event, onSuccess: () => void) => Promise<void>;
  confirmCancelHandler: (
    event: Event,
    reason: string,
    onSuccess: () => void,
  ) => Promise<void>;
  checkInAttendeeHandler: (attendeeId: string) => Promise<void>;
  loadAttendeesForEvent: (eventId: string) => Promise<void>;
}

export function useEventActions({
  scopeId,
  setEvents,
  setSelectedEvent,
  onRefetch,
}: UseEventActionsOptions): UseEventActionsReturn {
  // -------------------------------------------------------------------------
  // Create + publish
  // -------------------------------------------------------------------------
  const createEventHandler = useCallback(
    async (form: EventFormState, onSuccess: () => void): Promise<void> => {
      if (!scopeId) return;

      if (!form.title.trim() || !form.description.trim()) {
        toast({
          title: "Validation",
          description: "Title and description are required.",
          variant: "destructive",
        });
        return;
      }
      if (form.description.trim().length < 20) {
        toast({
          title: "Validation",
          description: "Description must be at least 20 characters.",
          variant: "destructive",
        });
        return;
      }
      if (!form.startDateTime || !form.endDateTime) {
        toast({
          title: "Validation",
          description: "Start and end date/time are required.",
          variant: "destructive",
        });
        return;
      }
      const startIso = new Date(form.startDateTime).toISOString();
      const endIso = new Date(form.endDateTime).toISOString();
      if (new Date(startIso) >= new Date(endIso)) {
        toast({
          title: "Validation",
          description: "Start time must be before end time.",
          variant: "destructive",
        });
        return;
      }

      try {
        const locationType =
          form.eventType === "Physical"
            ? ("physical" as const)
            : ("virtual" as const);
        const created = await createEvent({
          ownerType: "COMMUNITY",
          ownerId: scopeId,
          title: form.title,
          description: form.description,
          eventCategory: form.category || "CONFERENCE",
          locationType,
          locationDetails: {
            type: locationType,
            venue: form.eventType === "Physical" ? form.venue : undefined,
            virtualLink:
              form.eventType === "Online" ? form.onlineLink : undefined,
          },
          startAt: startIso,
          endAt: endIso,
          isPaid: form.pricingType === "Paid",
          capacity:
            form.participantLimit === "Set Limit"
              ? form.maxParticipants
              : undefined,
          coverImageUrl: form.banner || undefined,
        });
        toast({ title: "Created", description: "Event created. Publishing…" });
        await publishEvent(created.id);
        toast({
          title: "Published",
          description: `"${form.title}" is now live.`,
        });
        onSuccess();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create event",
          variant: "destructive",
        });
      }
    },
    [scopeId, onRefetch],
  );

  // -------------------------------------------------------------------------
  // Update (edit)
  // -------------------------------------------------------------------------
  const saveEditHandler = useCallback(
    async (
      event: Event,
      form: EventFormState,
      onSuccess: () => void,
    ): Promise<void> => {
      try {
        const locationType =
          form.eventType === "Physical"
            ? ("physical" as const)
            : ("virtual" as const);
        await updateEvent(event.id, {
          title: form.title,
          description: form.description,
          eventCategory: form.category,
          locationType,
          locationDetails: {
            type: locationType,
            venue: form.eventType === "Physical" ? form.venue : undefined,
            virtualLink:
              form.eventType === "Online" ? form.onlineLink : undefined,
          },
          startAt: form.startDateTime
            ? new Date(form.startDateTime).toISOString()
            : undefined,
          endAt: form.endDateTime
            ? new Date(form.endDateTime).toISOString()
            : undefined,
          capacity:
            form.participantLimit === "Set Limit"
              ? form.maxParticipants
              : undefined,
          coverImageUrl: form.banner || undefined,
          isPaid: form.pricingType === "Paid",
        });

        if (form.pricingType === "Paid") {
          for (const cat of form.ticketCategories) {
            const name = cat.name.trim();
            if (!name) continue;
            const payload = {
              name,
              priceInCents: Math.round(cat.price * 100),
              description: cat.description?.trim() || undefined,
            };
            if (cat.id.startsWith("TC")) {
              await createEventTicket(event.id, payload);
            } else {
              await updateEventTicket(cat.id, payload);
            }
          }
        }

        toast({ title: "Saved", description: "Event updated successfully." });
        onSuccess();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update event",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const confirmDeleteHandler = useCallback(
    async (event: Event, onSuccess: () => void): Promise<void> => {
      try {
        await deleteEvent(event.id);
        toast({
          title: "Deleted",
          description: `"${event.title}" has been deleted.`,
        });
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        setSelectedEvent(null);
        onSuccess();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to delete event",
          variant: "destructive",
        });
      }
    },
    [setEvents, setSelectedEvent],
  );

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------
  const confirmCancelHandler = useCallback(
    async (
      event: Event,
      reason: string,
      onSuccess: () => void,
    ): Promise<void> => {
      const resolvedReason = reason.trim() || "Cancelled by organizer";
      try {
        await cancelEvent(event.id, resolvedReason);
        toast({
          title: "Event cancelled",
          description: `"${event.title}" has been cancelled.`,
        });
        onSuccess();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to cancel event",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  // -------------------------------------------------------------------------
  // Check-in
  // -------------------------------------------------------------------------
  const checkInAttendeeHandler = useCallback(
    async (attendeeId: string): Promise<void> => {
      try {
        await markRegistrationCheckedIn(attendeeId);
        toast({
          title: "Checked In",
          description: "Attendee has been checked in.",
        });
        // Update both selectedEvent and the events list optimistically
        setSelectedEvent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            attendees: prev.attendees.map((a) =>
              a.id === attendeeId ? { ...a, checkInStatus: "Checked In" } : a,
            ),
          };
        });
        setEvents((prev) =>
          prev.map((e) => ({
            ...e,
            attendees: e.attendees.map((a) =>
              a.id === attendeeId ? { ...a, checkInStatus: "Checked In" } : a,
            ),
          })),
        );
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to check in attendee",
          variant: "destructive",
        });
      }
    },
    [setSelectedEvent, setEvents],
  );

  // -------------------------------------------------------------------------
  // Load attendees
  // -------------------------------------------------------------------------
  const loadAttendeesForEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        const full = await getEvent(eventId);
        const ticketMap = new Map<string, string>();
        if (full?.tickets?.length) {
          for (const t of full.tickets) {
            ticketMap.set(t.id, t.name);
          }
        }
        const res = await getEventRegistrations(eventId, 500, 0);
        const attendees: Attendee[] = res.registrations.map((r) =>
          mapRegistrationToAttendee(
            r,
            (r.ticketId && ticketMap.get(r.ticketId)) || r.ticketId || "—",
          ),
        );
        setSelectedEvent((prev) =>
          prev?.id === eventId ? { ...prev, attendees } : prev,
        );
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, attendees } : e)),
        );
      } catch {
        toast({
          title: "Error",
          description: "Could not load registrations.",
          variant: "destructive",
        });
      }
    },
    [setSelectedEvent, setEvents],
  );

  return {
    createEventHandler,
    saveEditHandler,
    confirmDeleteHandler,
    confirmCancelHandler,
    checkInAttendeeHandler,
    loadAttendeesForEvent,
  };
}
