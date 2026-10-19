/* eslint-disable @typescript-eslint/no-explicit-any -- GraphQL responses are unwrapped by per-operation pickers */
/**
 * Event Networking (M2) — approvals, staff, registration settings and the
 * organiser Events dashboard. Op names and shapes follow the gateway's
 * `event/` and `event-content/` modules.
 *
 * Money arrives as INTEGER minor units (strings); nothing here divides.
 * A refused mutation may resolve with `data: null` plus errors, so every
 * mutation checks for a missing result rather than trusting the promise.
 */
import { gqlRequest, errorsOf } from "./eventNetworkingTransport";
import { eventErrorMessage, type EventStaffRole, type StatusCount, type CurrencyAmount } from "@/lib/eventNetworking";

export class EventOperationError extends Error {
  readonly codes: string[];
  constructor(message: string, codes: string[] = []) {
    super(message);
    this.name = "EventOperationError";
    this.codes = codes;
  }
}

/** Turn any failure into an EventOperationError carrying friendly text. */
export function toEventError(err: unknown, fallback?: string): EventOperationError {
  if (err instanceof EventOperationError) return err;
  const errors = errorsOf(err);
  return new EventOperationError(
    eventErrorMessage(errors, fallback),
    errors.map((e) => String(e.code ?? "")).filter(Boolean),
  );
}

async function run<T>(query: string, variables: Record<string, unknown>, pick: (d: any) => T | null | undefined, fallback?: string): Promise<T> {
  let data: unknown;
  try {
    data = await gqlRequest<unknown>(query, variables);
  } catch (err) {
    throw toEventError(err, fallback);
  }
  const value = pick(data);
  if (value === null || value === undefined) throw new EventOperationError(fallback ?? eventErrorMessage([]));
  return value;
}

// ------------------------------------------------------------ registrations

export interface ManagedRegistration {
  id: string;
  eventId: string;
  status: string;
  registrationStatus: string | null;
  waitlistPosition: number | null;
  quantity: number;
  totalAmount: string | null;
  currency: string | null;
  registeredAt: string | null;
  user: { firstName: string | null; lastName: string | null; email: string | null; avatarUrl: string | null } | null;
}

const REGISTRATION_FIELDS = `
  id
  eventId
  status
  registrationStatus
  waitlistPosition
  quantity
  totalAmount
  currency
  registeredAt
  user { firstName lastName email avatarUrl }
`;

const LIST_BY_STATUS = `
  query EventRegistrationsByStatus($eventId: ID!, $limit: Int, $offset: Int, $status: String) {
    getEventRegistrations(eventId: $eventId, limit: $limit, offset: $offset, status: $status) {
      total
      registrations { ${REGISTRATION_FIELDS} }
    }
  }
`;

export async function listRegistrationsByStatus(
  eventId: string,
  status: "PENDING_APPROVAL" | "WAITLISTED",
  limit = 100,
  offset = 0,
): Promise<{ registrations: ManagedRegistration[]; total: number }> {
  const res = await run<{ registrations: ManagedRegistration[]; total: number }>(
    LIST_BY_STATUS,
    { eventId, limit, offset, status },
    (d) => d?.getEventRegistrations,
    "Could not load registrations.",
  );
  return { registrations: res.registrations ?? [], total: res.total ?? (res.registrations ?? []).length };
}

const APPROVE = `
  mutation ApproveEventRegistration($registrationId: ID!) {
    approveEventRegistration(registrationId: $registrationId) { id status registrationStatus waitlistPosition }
  }
`;
const REJECT = `
  mutation RejectEventRegistration($registrationId: ID!, $reason: String) {
    rejectEventRegistration(registrationId: $registrationId, reason: $reason) { id status registrationStatus }
  }
`;

export interface DecisionResult {
  id: string;
  status: string;
  registrationStatus: string | null;
  waitlistPosition?: number | null;
}

export const approveRegistration = (registrationId: string) =>
  run<DecisionResult>(APPROVE, { registrationId }, (d) => d?.approveEventRegistration, "Could not approve that registration.");

export const REJECT_REASON_MAX = 500;

export const rejectRegistration = (registrationId: string, reason?: string) =>
  run<DecisionResult>(
    REJECT,
    { registrationId, reason: reason?.trim() ? reason.trim().slice(0, REJECT_REASON_MAX) : null },
    (d) => d?.rejectEventRegistration,
    "Could not decline that registration.",
  );

// ------------------------------------------------------------ staff

export interface EventStaffMember {
  /** Opaque key for the remove action. Never render it. */
  userId: string;
  role: EventStaffRole;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  addedAt: string | null;
}

const STAFF_FIELDS = `userId role displayName username avatarUrl addedAt`;

export const listEventStaff = (eventId: string) =>
  run<EventStaffMember[]>(
    `query EventStaff($eventId: ID!) { eventStaff(eventId: $eventId) { ${STAFF_FIELDS} } }`,
    { eventId },
    (d) => d?.eventStaff,
    "Could not load the event staff.",
  );

export const addEventStaff = (eventId: string, userId: string, role: EventStaffRole) =>
  run<EventStaffMember>(
    `mutation AddEventStaff($eventId: ID!, $userId: ID!, $role: EventStaffRole!) {
      addEventStaff(eventId: $eventId, userId: $userId, role: $role) { ${STAFF_FIELDS} }
    }`,
    { eventId, userId, role },
    (d) => d?.addEventStaff,
    "Could not add that person.",
  );

export const removeEventStaff = (eventId: string, userId: string) =>
  run<boolean>(
    `mutation RemoveEventStaff($eventId: ID!, $userId: ID!) { removeEventStaff(eventId: $eventId, userId: $userId) }`,
    { eventId, userId },
    (d) => (d?.removeEventStaff === true ? true : null),
    "Could not remove that person.",
  );

// ------------------------------------------------------------ registration settings

export interface RegistrationSettings {
  id: string;
  requiresApproval: boolean | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  phase: string | null;
}

export const getRegistrationSettings = (eventId: string) =>
  run<RegistrationSettings>(
    `query EventRegistrationSettings($id: ID!) { getEvent(id: $id) { id requiresApproval registrationOpensAt registrationClosesAt phase } }`,
    { id: eventId },
    (d) => d?.getEvent,
    "Could not load the registration settings.",
  );

export interface RegistrationSettingsInput {
  eventId: string;
  requiresApproval?: boolean;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  clearRegistrationOpensAt?: boolean;
  clearRegistrationClosesAt?: boolean;
}

export const updateRegistrationSettings = (input: RegistrationSettingsInput) =>
  run<RegistrationSettings>(
    `mutation UpdateEventRegistrationSettings($input: EventRegistrationSettingsInput!) {
      updateEventRegistrationSettings(input: $input) { id requiresApproval registrationOpensAt registrationClosesAt phase }
    }`,
    { input },
    (d) => d?.updateEventRegistrationSettings,
    "Could not save the registration settings.",
  );

// ------------------------------------------------------------ organiser dashboard

export interface DashboardEvent {
  eventId: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  capacity: number | null;
  registrationsByStatus: StatusCount[];
  checkedInCount: number;
  revenue: CurrencyAmount[];
  fillRate: number | null;
  /** null = community-service could not be reached → unknown, never 0. */
  communityJoins: number | null;
  communityJoinsPending: number | null;
}

export interface DashboardTotals {
  eventCount: number;
  registrationsByStatus: StatusCount[];
  checkedInCount: number;
  revenue: CurrencyAmount[];
}

export interface OrganizerDashboard {
  events: DashboardEvent[];
  totals: DashboardTotals | null;
  nextCursor: string | null;
  pageCommunityJoins: number | null;
}

const DASHBOARD = `
  query OrganizerEventsDashboard($ownerType: String!, $ownerId: ID!, $from: String!, $to: String!, $pageSize: Int, $cursor: String) {
    organizerEventsDashboard(ownerType: $ownerType, ownerId: $ownerId, from: $from, to: $to, pageSize: $pageSize, cursor: $cursor) {
      nextCursor
      pageCommunityJoins
      totals { eventCount checkedInCount registrationsByStatus { status count } revenue { currency amountMinor } }
      events {
        eventId title startAt endAt status capacity fillRate checkedInCount communityJoins communityJoinsPending
        registrationsByStatus { status count }
        revenue { currency amountMinor }
      }
    }
  }
`;

export async function fetchOrganizerDashboard(args: {
  ownerType: "COMMUNITY" | "ASSOCIATION";
  ownerId: string;
  from: string;
  to: string;
  pageSize?: number;
  cursor?: string | null;
}): Promise<OrganizerDashboard> {
  const res = await run<any>(
    DASHBOARD,
    { ownerType: args.ownerType, ownerId: args.ownerId, from: args.from, to: args.to, pageSize: args.pageSize ?? 50, cursor: args.cursor ?? null },
    (d) => d?.organizerEventsDashboard,
    "Could not load the events dashboard.",
  );
  return {
    events: (res.events ?? []).map((e: any) => ({
      ...e,
      capacity: e.capacity ?? null,
      fillRate: e.fillRate ?? null,
      communityJoins: e.communityJoins ?? null,
      communityJoinsPending: e.communityJoinsPending ?? null,
    })),
    totals: res.totals ?? null,
    nextCursor: res.nextCursor ?? null,
    pageCommunityJoins: res.pageCommunityJoins ?? null,
  };
}
