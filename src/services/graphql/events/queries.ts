import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  EVENT_LOCATION_FRAGMENT,
  EVENT_CARD_FRAGMENT,
  EVENT_FULL_FRAGMENT,
  EVENT_REGISTRATION_FRAGMENT,
} from "./fragments";
import type {
  EventType,
  EventListResponse,
  EventRegistration,
  EventRegistrationListResponse,
  ListEventsInput,
} from "./types";

const LIST_EVENTS = `
  ${EVENT_LOCATION_FRAGMENT}
  ${EVENT_CARD_FRAGMENT}
  query ListEvents($input: ListEventsInput) {
    listEvents(input: $input) {
      total
      events {
        ...EventCardInfo
      }
    }
  }
`;

const GET_EVENT = `
  ${EVENT_LOCATION_FRAGMENT}
  ${EVENT_FULL_FRAGMENT}
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
      ...EventFullInfo
    }
  }
`;

const GET_EVENT_REGISTRATIONS = `
  ${EVENT_REGISTRATION_FRAGMENT}
  query GetEventRegistrations(
    $eventId: ID!
    $limit: Int
    $offset: Int
    $status: String
  ) {
    getEventRegistrations(
      eventId: $eventId
      limit: $limit
      offset: $offset
      status: $status
    ) {
      total
      registrations {
        ...EventRegistrationInfo
      }
    }
  }
`;

export async function listEvents(input?: ListEventsInput): Promise<EventListResponse> {
  const data = await graphqlRequestWithAuth<
    { listEvents: EventListResponse },
    { input?: ListEventsInput }
  >(LIST_EVENTS, { input });
  return data.listEvents;
}

export async function getEvent(id: string): Promise<EventType | null> {
  const data = await graphqlRequestWithAuth<
    { getEvent: EventType | null },
    { id: string }
  >(GET_EVENT, { id });
  return data.getEvent;
}

export async function getEventRegistrations(
  eventId: string,
  limit?: number,
  offset?: number,
  status?: string,
): Promise<EventRegistrationListResponse> {
  const data = await graphqlRequestWithAuth<
    { getEventRegistrations: EventRegistrationListResponse },
    { eventId: string; limit?: number; offset?: number; status?: string }
  >(GET_EVENT_REGISTRATIONS, { eventId, limit, offset, status });
  return data.getEventRegistrations;
}

export type { EventRegistration };
