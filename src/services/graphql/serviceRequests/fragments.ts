/**
 * GraphQL fragments for Service Request Service types.
 * GraphQL type names mirror the api-gateway @ObjectType names.
 */

/** Slim summary used by list endpoints — `ServiceRequestSummary`. */
export const SERVICE_REQUEST_SUMMARY_FRAGMENT = `
  fragment ServiceRequestSummaryInfo on ServiceRequestSummary {
    id
    requestNumber
    ownerType
    ownerEntityId
    requestTypeId
    category
    status
    requesterUserId
    assigneeUserId
    feeAmountMinor
    feeCurrency
    paymentStatus
    submittedAt
    updatedAt
  }
`;

/** One status-history entry — `ServiceRequestStatusHistoryEntry`. */
export const SERVICE_REQUEST_STATUS_HISTORY_FRAGMENT = `
  fragment ServiceRequestStatusHistoryInfo on ServiceRequestStatusHistoryEntry {
    id
    requestId
    fromStatus
    toStatus
    actorUserId
    reason
    createdAt
  }
`;

/** Full aggregate — `ServiceRequest`. Embeds statusHistory (staff-only). */
export const SERVICE_REQUEST_FULL_FRAGMENT = `
  fragment ServiceRequestFullInfo on ServiceRequest {
    id
    requestNumber
    ownerType
    ownerEntityId
    requestTypeId
    category
    status
    requesterUserId
    assigneeUserId
    formResponsesJson
    conversationId
    feeAmountMinor
    feeCurrency
    paymentIntentId
    paymentStatus
    escrowId
    escrowStatus
    decisionReason
    submittedAt
    reviewStartedAt
    decidedAt
    completedAt
    createdAt
    updatedAt
    statusHistory {
      ...ServiceRequestStatusHistoryInfo
    }
  }
`;

/** A request-type / form template — `ServiceRequestType`. */
export const SERVICE_REQUEST_TYPE_FRAGMENT = `
  fragment ServiceRequestTypeInfo on ServiceRequestType {
    id
    ownerType
    ownerEntityId
    code
    displayName
    description
    formFields {
      key
      label
      type
      required
      options
    }
    attachedResourceIds
    feeAmountMinor
    feeCurrency
    escrowEnabled
    escrowReleaseMode
    defaultAssigneeUserId
    requestNumberPrefix
    isActive
    sortOrder
    version
    createdAt
    updatedAt
  }
`;

/** A staff-only internal note — `ServiceRequestNote`. */
export const SERVICE_REQUEST_NOTE_FRAGMENT = `
  fragment ServiceRequestNoteInfo on ServiceRequestNote {
    id
    requestId
    authorUserId
    body
    createdAt
  }
`;

/** A request document — `ServiceRequestDocument`. */
export const SERVICE_REQUEST_DOCUMENT_FRAGMENT = `
  fragment ServiceRequestDocumentInfo on ServiceRequestDocument {
    id
    requestId
    uploaderUserId
    storageKey
    mimeType
    fileName
    sizeBytes
    kind
    formFieldKey
    confirmed
    readUrl
    uploadedAt
  }
`;
