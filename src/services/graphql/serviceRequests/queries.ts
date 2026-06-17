import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  SERVICE_REQUEST_SUMMARY_FRAGMENT,
  SERVICE_REQUEST_FULL_FRAGMENT,
  SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT,
  SERVICE_REQUEST_TYPE_FRAGMENT,
  SERVICE_REQUEST_NOTE_FRAGMENT,
  SERVICE_REQUEST_DOCUMENT_FRAGMENT,
} from "./fragments";
import type {
  ServiceRequest,
  ServiceRequestSummary,
  ServiceRequestStatusHistoryEntry,
  ServiceRequestType,
  ServiceRequestNote,
  ServiceRequestDocument,
  ServiceRequestOwnerType,
  ServiceRequestStatus,
  OwnerServiceRequestsArgs,
} from "./types";

const OWNER_SERVICE_REQUESTS = `
  ${SERVICE_REQUEST_SUMMARY_FRAGMENT}
  query OwnerServiceRequests(
    $ownerType: ServiceRequestOwnerType!
    $ownerEntityId: ID!
    $status: ServiceRequestStatus
    $requestTypeId: ID
    $assigneeUserId: ID
    $limit: Int
    $offset: Int
  ) {
    ownerServiceRequests(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      status: $status
      requestTypeId: $requestTypeId
      assigneeUserId: $assigneeUserId
      limit: $limit
      offset: $offset
    ) {
      ...ServiceRequestSummaryInfo
    }
  }
`;

const SERVICE_REQUEST = `
  ${SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT}
  ${SERVICE_REQUEST_FULL_FRAGMENT}
  query ServiceRequest($id: ID!) {
    serviceRequest(id: $id) {
      ...ServiceRequestFullInfo
    }
  }
`;

const SERVICE_REQUEST_INTERNAL_NOTES = `
  ${SERVICE_REQUEST_NOTE_FRAGMENT}
  query ServiceRequestInternalNotes($requestId: ID!, $limit: Int, $offset: Int) {
    serviceRequestInternalNotes(requestId: $requestId, limit: $limit, offset: $offset) {
      ...ServiceRequestNoteInfo
    }
  }
`;

const SERVICE_REQUEST_DOCUMENTS = `
  ${SERVICE_REQUEST_DOCUMENT_FRAGMENT}
  query ServiceRequestDocuments($requestId: ID!) {
    serviceRequestDocuments(requestId: $requestId) {
      ...ServiceRequestDocumentInfo
    }
  }
`;

const SERVICE_REQUEST_STATUS_HISTORY = `
  ${SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT}
  query ServiceRequestStatusHistory($requestId: ID!) {
    serviceRequestStatusHistory(requestId: $requestId) {
      ...ServiceRequestStatusHistoryInfo
    }
  }
`;

const SERVICE_REQUEST_TYPES = `
  ${SERVICE_REQUEST_TYPE_FRAGMENT}
  query ServiceRequestTypes($ownerType: ServiceRequestOwnerType!, $ownerEntityId: String) {
    serviceRequestTypes(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...ServiceRequestTypeInfo
    }
  }
`;

/** Staff list of requests owned by a community / association. */
export async function ownerServiceRequests(
  args: OwnerServiceRequestsArgs,
): Promise<ServiceRequestSummary[]> {
  const data = await graphqlRequestWithAuth<
    { ownerServiceRequests: ServiceRequestSummary[] },
    OwnerServiceRequestsArgs
  >(OWNER_SERVICE_REQUESTS, args);
  return data.ownerServiceRequests;
}

/** Single request (staff view embeds statusHistory). */
export async function serviceRequest(id: string): Promise<ServiceRequest | null> {
  const data = await graphqlRequestWithAuth<
    { serviceRequest: ServiceRequest | null },
    { id: string }
  >(SERVICE_REQUEST, { id });
  return data.serviceRequest;
}

/** Staff-only internal notes for a request. */
export async function serviceRequestInternalNotes(
  requestId: string,
  limit?: number,
  offset?: number,
): Promise<ServiceRequestNote[]> {
  const data = await graphqlRequestWithAuth<
    { serviceRequestInternalNotes: ServiceRequestNote[] },
    { requestId: string; limit?: number; offset?: number }
  >(SERVICE_REQUEST_INTERNAL_NOTES, { requestId, limit, offset });
  return data.serviceRequestInternalNotes;
}

/** Documents attached to a request (each carries a fresh signed readUrl). */
export async function serviceRequestDocuments(
  requestId: string,
): Promise<ServiceRequestDocument[]> {
  const data = await graphqlRequestWithAuth<
    { serviceRequestDocuments: ServiceRequestDocument[] },
    { requestId: string }
  >(SERVICE_REQUEST_DOCUMENTS, { requestId });
  return data.serviceRequestDocuments;
}

/** Staff-only status-history audit trail. */
export async function serviceRequestStatusHistory(
  requestId: string,
): Promise<ServiceRequestStatusHistoryEntry[]> {
  const data = await graphqlRequestWithAuth<
    { serviceRequestStatusHistory: ServiceRequestStatusHistoryEntry[] },
    { requestId: string }
  >(SERVICE_REQUEST_STATUS_HISTORY, { requestId });
  return data.serviceRequestStatusHistory;
}

/**
 * Active request-types for an owner (form-population read). `ownerEntityId`
 * omitted returns the owner_type defaults; pass the scope id for org-specific
 * types. Only active types are returned.
 */
export async function serviceRequestTypes(
  ownerType: ServiceRequestOwnerType,
  ownerEntityId?: string,
): Promise<ServiceRequestType[]> {
  const data = await graphqlRequestWithAuth<
    { serviceRequestTypes: ServiceRequestType[] },
    { ownerType: ServiceRequestOwnerType; ownerEntityId?: string }
  >(SERVICE_REQUEST_TYPES, { ownerType, ownerEntityId });
  return data.serviceRequestTypes;
}

export type { ServiceRequestStatus, ServiceRequestOwnerType };
