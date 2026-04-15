import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { EVENT_LOCATION_FRAGMENT } from "./fragments";
import type {
  EventType,
  EventRegistration,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventResult,
  EventTicketFull,
  CreateEventTicketInput,
  UpdateEventTicketInput,
} from "./types";

const CREATE_EVENT = `
  ${EVENT_LOCATION_FRAGMENT}
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      status
      startAt
      endAt
      locationType
      locationDetails {
        ...EventLocationInfo
      }
      isPaid
      registrationCount
    }
  }
`;

const UPDATE_EVENT = `
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      status
      startAt
      endAt
      coverImageUrl
      tags
    }
  }
`;

const PUBLISH_EVENT = `
  mutation PublishEvent($id: ID!) {
    publishEvent(id: $id) {
      id
      title
      status
    }
  }
`;

const DELETE_EVENT = `
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      success
      message
    }
  }
`;

const MARK_CHECKED_IN = `
  mutation MarkRegistrationCheckedIn($registrationId: ID!) {
    markRegistrationCheckedIn(registrationId: $registrationId) {
      id
      status
    }
  }
`;

const REMOVE_REGISTRATION = `
  mutation RemoveEventRegistration($registrationId: ID!) {
    removeEventRegistration(registrationId: $registrationId) {
      success
      message
    }
  }
`;

const CANCEL_EVENT = `
  mutation CancelEvent($id: ID!, $reason: String!) {
    cancelEvent(id: $id, reason: $reason) {
      id
      title
      status
    }
  }
`;

const CREATE_EVENT_TICKET = `
  mutation CreateEventTicket($eventId: ID!, $input: CreateEventTicketInput!) {
    createEventTicket(eventId: $eventId, input: $input) {
      id
      name
      priceInCents
      description
      availableQuantity
    }
  }
`;

const UPDATE_EVENT_TICKET = `
  mutation UpdateEventTicket($ticketId: ID!, $input: UpdateEventTicketInput!) {
    updateEventTicket(ticketId: $ticketId, input: $input) {
      id
      name
      priceInCents
      description
      availableQuantity
    }
  }
`;

export async function createEvent(input: CreateEventInput): Promise<EventType> {
  const data = await graphqlRequestWithAuth<
    { createEvent: EventType },
    { input: CreateEventInput }
  >(CREATE_EVENT, { input });
  return data.createEvent;
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<EventType | null> {
  const data = await graphqlRequestWithAuth<
    { updateEvent: EventType | null },
    { id: string; input: UpdateEventInput }
  >(UPDATE_EVENT, { id, input });
  return data.updateEvent;
}

export async function publishEvent(id: string): Promise<EventType | null> {
  const data = await graphqlRequestWithAuth<
    { publishEvent: EventType | null },
    { id: string }
  >(PUBLISH_EVENT, { id });
  return data.publishEvent;
}

export async function deleteEvent(id: string): Promise<DeleteEventResult> {
  const data = await graphqlRequestWithAuth<
    { deleteEvent: DeleteEventResult },
    { id: string }
  >(DELETE_EVENT, { id });
  return data.deleteEvent;
}

export async function markRegistrationCheckedIn(
  registrationId: string,
): Promise<EventRegistration | null> {
  const data = await graphqlRequestWithAuth<
    { markRegistrationCheckedIn: Pick<EventRegistration, "id" | "status"> | null },
    { registrationId: string }
  >(MARK_CHECKED_IN, { registrationId });
  return data.markRegistrationCheckedIn as EventRegistration | null;
}

export async function removeEventRegistration(
  registrationId: string,
): Promise<DeleteEventResult> {
  const data = await graphqlRequestWithAuth<
    { removeEventRegistration: DeleteEventResult },
    { registrationId: string }
  >(REMOVE_REGISTRATION, { registrationId });
  return data.removeEventRegistration;
}

export async function cancelEvent(
  id: string,
  reason: string,
): Promise<EventType | null> {
  const data = await graphqlRequestWithAuth<
    { cancelEvent: EventType | null },
    { id: string; reason: string }
  >(CANCEL_EVENT, { id, reason });
  return data.cancelEvent;
}

export async function createEventTicket(
  eventId: string,
  input: CreateEventTicketInput,
): Promise<EventTicketFull> {
  const data = await graphqlRequestWithAuth<
    { createEventTicket: EventTicketFull },
    { eventId: string; input: CreateEventTicketInput }
  >(CREATE_EVENT_TICKET, { eventId, input });
  return data.createEventTicket;
}

export async function updateEventTicket(
  ticketId: string,
  input: UpdateEventTicketInput,
): Promise<EventTicketFull> {
  const data = await graphqlRequestWithAuth<
    { updateEventTicket: EventTicketFull },
    { ticketId: string; input: UpdateEventTicketInput }
  >(UPDATE_EVENT_TICKET, { ticketId, input });
  return data.updateEventTicket;
}
