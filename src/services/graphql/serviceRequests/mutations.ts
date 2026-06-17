import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT,
  SERVICE_REQUEST_FULL_FRAGMENT,
  SERVICE_REQUEST_NOTE_FRAGMENT,
  SERVICE_REQUEST_DOCUMENT_FRAGMENT,
} from "./fragments";
import type {
  ServiceRequest,
  ServiceRequestNote,
  ServiceRequestDocument,
  ServiceRequestDocumentUploadUrl,
  AddServiceRequestInternalNoteInput,
} from "./types";

// Every workflow mutation returns the full updated ServiceRequest (with the
// staff status-history embedded), so all share the same selection set.
const REQUEST_PREAMBLE = `
  ${SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT}
  ${SERVICE_REQUEST_FULL_FRAGMENT}
`;

const ASSIGN_SERVICE_REQUEST = `
  ${REQUEST_PREAMBLE}
  mutation AssignServiceRequest($requestId: ID!, $assigneeUserId: ID!) {
    assignServiceRequest(requestId: $requestId, assigneeUserId: $assigneeUserId) {
      ...ServiceRequestFullInfo
    }
  }
`;

const START_SERVICE_REQUEST_REVIEW = `
  ${REQUEST_PREAMBLE}
  mutation StartServiceRequestReview($requestId: ID!) {
    startServiceRequestReview(requestId: $requestId) {
      ...ServiceRequestFullInfo
    }
  }
`;

const REQUEST_SERVICE_REQUEST_INFO = `
  ${REQUEST_PREAMBLE}
  mutation RequestServiceRequestInfo($requestId: ID!, $reason: String!) {
    requestServiceRequestInfo(requestId: $requestId, reason: $reason) {
      ...ServiceRequestFullInfo
    }
  }
`;

const APPROVE_SERVICE_REQUEST = `
  ${REQUEST_PREAMBLE}
  mutation ApproveServiceRequest($requestId: ID!, $reason: String) {
    approveServiceRequest(requestId: $requestId, reason: $reason) {
      ...ServiceRequestFullInfo
    }
  }
`;

const REJECT_SERVICE_REQUEST = `
  ${REQUEST_PREAMBLE}
  mutation RejectServiceRequest($requestId: ID!, $reason: String!) {
    rejectServiceRequest(requestId: $requestId, reason: $reason) {
      ...ServiceRequestFullInfo
    }
  }
`;

const COMPLETE_SERVICE_REQUEST = `
  ${REQUEST_PREAMBLE}
  mutation CompleteServiceRequest($requestId: ID!, $reason: String) {
    completeServiceRequest(requestId: $requestId, reason: $reason) {
      ...ServiceRequestFullInfo
    }
  }
`;

const RETRY_SERVICE_REQUEST_PAYMENT = `
  ${REQUEST_PREAMBLE}
  mutation RetryServiceRequestPayment($requestId: ID!) {
    retryServiceRequestPayment(requestId: $requestId) {
      ...ServiceRequestFullInfo
    }
  }
`;

const ADD_SERVICE_REQUEST_INTERNAL_NOTE = `
  ${SERVICE_REQUEST_NOTE_FRAGMENT}
  mutation AddServiceRequestInternalNote($input: AddRequestInternalNoteInput!) {
    addServiceRequestInternalNote(input: $input) {
      ...ServiceRequestNoteInfo
    }
  }
`;

const REQUEST_SERVICE_REQUEST_DOCUMENT_UPLOAD_URL = `
  mutation RequestServiceRequestDocumentUploadUrl(
    $requestId: ID!
    $contentType: String!
    $fileName: String!
    $formFieldKey: String
  ) {
    requestServiceRequestDocumentUploadUrl(
      requestId: $requestId
      contentType: $contentType
      fileName: $fileName
      formFieldKey: $formFieldKey
    ) {
      documentId
      uploadUrl
      storageKey
      expiresAt
    }
  }
`;

const ADD_SERVICE_REQUEST_DOCUMENT = `
  ${SERVICE_REQUEST_DOCUMENT_FRAGMENT}
  mutation AddServiceRequestDocument($requestId: ID!, $documentId: ID!, $sizeBytes: Int) {
    addServiceRequestDocument(requestId: $requestId, documentId: $documentId, sizeBytes: $sizeBytes) {
      ...ServiceRequestDocumentInfo
    }
  }
`;

/** Assign (or reassign) a request to a staff member. */
export async function assignServiceRequest(
  requestId: string,
  assigneeUserId: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { assignServiceRequest: ServiceRequest },
    { requestId: string; assigneeUserId: string }
  >(ASSIGN_SERVICE_REQUEST, { requestId, assigneeUserId });
  return data.assignServiceRequest;
}

/** SUBMITTED -> UNDER_REVIEW. */
export async function startServiceRequestReview(
  requestId: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { startServiceRequestReview: ServiceRequest },
    { requestId: string }
  >(START_SERVICE_REQUEST_REVIEW, { requestId });
  return data.startServiceRequestReview;
}

/** UNDER_REVIEW -> PENDING_INFO (reason required). */
export async function requestServiceRequestInfo(
  requestId: string,
  reason: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { requestServiceRequestInfo: ServiceRequest },
    { requestId: string; reason: string }
  >(REQUEST_SERVICE_REQUEST_INFO, { requestId, reason });
  return data.requestServiceRequestInfo;
}

/** UNDER_REVIEW -> APPROVED (reason optional). */
export async function approveServiceRequest(
  requestId: string,
  reason?: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { approveServiceRequest: ServiceRequest },
    { requestId: string; reason?: string }
  >(APPROVE_SERVICE_REQUEST, { requestId, reason });
  return data.approveServiceRequest;
}

/** UNDER_REVIEW -> REJECTED (reason required). */
export async function rejectServiceRequest(
  requestId: string,
  reason: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { rejectServiceRequest: ServiceRequest },
    { requestId: string; reason: string }
  >(REJECT_SERVICE_REQUEST, { requestId, reason });
  return data.rejectServiceRequest;
}

/** APPROVED -> COMPLETED (reason optional). */
export async function completeServiceRequest(
  requestId: string,
  reason?: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { completeServiceRequest: ServiceRequest },
    { requestId: string; reason?: string }
  >(COMPLETE_SERVICE_REQUEST, { requestId, reason });
  return data.completeServiceRequest;
}

/** Retry a failed fee payment intent. */
export async function retryServiceRequestPayment(
  requestId: string,
): Promise<ServiceRequest> {
  const data = await graphqlRequestWithAuth<
    { retryServiceRequestPayment: ServiceRequest },
    { requestId: string }
  >(RETRY_SERVICE_REQUEST_PAYMENT, { requestId });
  return data.retryServiceRequestPayment;
}

/** Add a staff-only internal note. */
export async function addServiceRequestInternalNote(
  input: AddServiceRequestInternalNoteInput,
): Promise<ServiceRequestNote> {
  const data = await graphqlRequestWithAuth<
    { addServiceRequestInternalNote: ServiceRequestNote },
    { input: AddServiceRequestInternalNoteInput }
  >(ADD_SERVICE_REQUEST_INTERNAL_NOTE, { input });
  return data.addServiceRequestInternalNote;
}

/** Step 1 of document upload — request a signed PUT URL. */
export async function requestServiceRequestDocumentUploadUrl(
  requestId: string,
  contentType: string,
  fileName: string,
  formFieldKey?: string,
): Promise<ServiceRequestDocumentUploadUrl> {
  const data = await graphqlRequestWithAuth<
    { requestServiceRequestDocumentUploadUrl: ServiceRequestDocumentUploadUrl },
    {
      requestId: string;
      contentType: string;
      fileName: string;
      formFieldKey?: string;
    }
  >(REQUEST_SERVICE_REQUEST_DOCUMENT_UPLOAD_URL, {
    requestId,
    contentType,
    fileName,
    formFieldKey,
  });
  return data.requestServiceRequestDocumentUploadUrl;
}

/** Step 3 of document upload — confirm the uploaded document. */
export async function addServiceRequestDocument(
  requestId: string,
  documentId: string,
  sizeBytes?: number,
): Promise<ServiceRequestDocument> {
  const data = await graphqlRequestWithAuth<
    { addServiceRequestDocument: ServiceRequestDocument },
    { requestId: string; documentId: string; sizeBytes?: number }
  >(ADD_SERVICE_REQUEST_DOCUMENT, { requestId, documentId, sizeBytes });
  return data.addServiceRequestDocument;
}
