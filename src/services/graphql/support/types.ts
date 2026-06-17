/**
 * TypeScript types for the Support / Case-Management GraphQL API.
 *
 * Hand-written to mirror the api-gateway DTOs EXACTLY (no codegen):
 *   services/api-gateway/src/support/dto/{case,case-note,case-evidence,status-history,enums}.ts
 *
 * Enums are SCREAMING_SNAKE strings on the wire (proto-loader `enums: String`).
 * The DTOs type most enum fields as plain `string` (e.g. `status`, `priority`,
 * `ownerType`); we narrow them to the literal unions here for safer UI code,
 * since the gateway only ever forwards the values defined in `enums.ts`.
 */

export type SupportOwnerType = "COMMUNITY" | "ASSOCIATION" | "MARKETPLACE" | "SYSTEM";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportCaseStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "REJECTED"
  | "CANCELLED";

export type SupportEvidenceKind = "PHOTO" | "VIDEO" | "PDF" | "VOICE" | "OTHER";

/** Optional geo-tag on a case (proto `CaseLocation`). */
export interface SupportCaseLocation {
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/** One row of a case's status-history audit trail (proto `StatusHistoryEntry`). */
export interface SupportCaseStatusHistoryEntry {
  id: string;
  caseId: string;
  /** Empty / null for the initial (SUBMITTED) entry. */
  fromStatus?: string | null;
  toStatus: string;
  actorUserId?: string | null;
  reason?: string | null;
  createdAt: string;
}

/**
 * Full case aggregate (proto `Case`). `statusHistory` is populated ONLY on the
 * `supportCase` query and ONLY when the caller is staff — otherwise an empty array.
 */
export interface SupportCase {
  id: string;
  caseNumber: string;
  ownerType: string;
  ownerEntityId?: string | null;
  caseTypeId?: string | null;
  category?: string | null;
  title: string;
  description?: string | null;
  priority?: string | null;
  status: string;
  reporterUserId: string;
  assigneeUserId?: string | null;
  location?: SupportCaseLocation | null;
  conversationId?: string | null;
  linkedDisputeId?: string | null;
  linkedEscrowId?: string | null;
  linkedOrderId?: string | null;
  linkedVendorId?: string | null;
  resolutionSummary?: string | null;
  submittedAt?: string | null;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  statusHistory: SupportCaseStatusHistoryEntry[];
}

/** Lightweight projection used by all list endpoints (proto `CaseSummary`). */
export interface SupportCaseSummary {
  id: string;
  caseNumber: string;
  ownerType: string;
  ownerEntityId?: string | null;
  category?: string | null;
  title: string;
  priority?: string | null;
  status: string;
  reporterUserId: string;
  assigneeUserId?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

/** Staff-only internal note on a case (proto `CaseNote`). */
export interface SupportCaseNote {
  id: string;
  caseId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

/** A piece of evidence attached to a case (proto `CaseEvidence`). */
export interface SupportCaseEvidence {
  id: string;
  caseId: string;
  uploaderUserId: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  sizeBytes?: number | null;
  /** EvidenceKind string value (PHOTO | VIDEO | PDF | VOICE | OTHER). */
  kind?: string | null;
  confirmed: boolean;
  /** Freshly-minted signed read URL — re-derived on every list. */
  readUrl?: string | null;
  uploadedAt: string;
}

/** Result of `requestCaseEvidenceUploadUrl` (proto `EvidenceUploadUrlResponse`). */
export interface SupportEvidenceUploadUrl {
  evidenceId: string;
  uploadUrl: string;
  readUrl?: string | null;
  storageKey?: string | null;
  expiresAt?: string | null;
}

/** Admin-managed case-type configuration row (proto `CaseType`). */
export interface SupportCaseType {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  defaultPriority?: string | null;
  slaHours?: number | null;
  caseNumberPrefix?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  version?: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Arguments for the `ownerCases` list query (staff-scoped). */
export interface OwnerCasesArgs {
  ownerType: SupportOwnerType;
  ownerEntityId: string;
  status?: SupportCaseStatus;
  priority?: SupportPriority;
  assigneeUserId?: string;
  limit?: number;
  offset?: number;
}
