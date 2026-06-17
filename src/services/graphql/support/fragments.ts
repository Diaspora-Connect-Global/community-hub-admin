/**
 * GraphQL fragments for the Support / Case-Management service.
 * Field names mirror the api-gateway DTOs exactly. Reused across queries/mutations.
 */

/** Slim case shape for list views (matches the SupportCaseSummary type). */
export const SUPPORT_CASE_SUMMARY_FRAGMENT = `
  fragment SupportCaseSummaryInfo on SupportCaseSummary {
    id
    caseNumber
    ownerType
    ownerEntityId
    category
    title
    priority
    status
    reporterUserId
    assigneeUserId
    submittedAt
    updatedAt
  }
`;

/** One status-history audit-trail row. */
export const SUPPORT_STATUS_HISTORY_FRAGMENT = `
  fragment SupportStatusHistoryInfo on SupportCaseStatusHistoryEntry {
    id
    caseId
    fromStatus
    toStatus
    actorUserId
    reason
    createdAt
  }
`;

/** Full case aggregate, including embedded status history (staff view only). */
export const SUPPORT_CASE_FRAGMENT = `
  ${SUPPORT_STATUS_HISTORY_FRAGMENT}
  fragment SupportCaseInfo on SupportCase {
    id
    caseNumber
    ownerType
    ownerEntityId
    caseTypeId
    category
    title
    description
    priority
    status
    reporterUserId
    assigneeUserId
    location {
      label
      lat
      lng
    }
    conversationId
    linkedDisputeId
    linkedEscrowId
    linkedOrderId
    linkedVendorId
    resolutionSummary
    submittedAt
    assignedAt
    resolvedAt
    closedAt
    createdAt
    updatedAt
    statusHistory {
      ...SupportStatusHistoryInfo
    }
  }
`;

export const SUPPORT_CASE_NOTE_FRAGMENT = `
  fragment SupportCaseNoteInfo on SupportCaseNote {
    id
    caseId
    authorUserId
    body
    createdAt
  }
`;

export const SUPPORT_CASE_EVIDENCE_FRAGMENT = `
  fragment SupportCaseEvidenceInfo on SupportCaseEvidence {
    id
    caseId
    uploaderUserId
    storageKey
    mimeType
    fileName
    sizeBytes
    kind
    confirmed
    readUrl
    uploadedAt
  }
`;

export const SUPPORT_CASE_TYPE_FRAGMENT = `
  fragment SupportCaseTypeInfo on SupportCaseType {
    id
    ownerType
    ownerEntityId
    code
    displayName
    description
    defaultPriority
    slaHours
    caseNumberPrefix
    isActive
    sortOrder
    version
    createdAt
    updatedAt
  }
`;
