/**
 * TypeScript types for the Service Request Service GraphQL API.
 *
 * Hand-written to mirror the api-gateway resolver / DTOs EXACTLY (no codegen):
 *   services/api-gateway/src/service-request/{service-request.resolver,dto/*}.ts
 *
 * Wire conventions worth repeating:
 *   - Enums are SCREAMING_SNAKE string values (proto-loader `enums: String`).
 *   - MONEY: `feeAmountMinor` is an INTEGER in minor units (pesewas / cents).
 *     Exposed over the wire as a GraphQL Float to carry int64 safely. Divide by
 *     100 ONLY at the display boundary — never store/transmit major units.
 *   - `formResponsesJson` is a JSON-encoded STRING on the wire — parse/serialize
 *     at the boundary, never pass an object straight through.
 *   - `statusHistory` embedded on `ServiceRequest` is populated ONLY by the
 *     single-request query and ONLY for staff viewers; lists never carry it.
 */

// ── Enums (string unions matching the gateway) ───────────────────────────────

/** ServiceRequestOwnerType. Staff admin UI only ever deals with COMMUNITY / ASSOCIATION. */
export type ServiceRequestOwnerType =
  | "COMMUNITY"
  | "ASSOCIATION"
  | "MARKETPLACE"
  | "SYSTEM";

/** ServiceRequestStatus — request lifecycle. */
export type ServiceRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PENDING_INFO"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

/** ServiceRequestFormFieldType — the input control of a RequestType form field. */
export type ServiceRequestFormFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "EMAIL"
  | "TEXTAREA"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "FILE_UPLOAD";

/** ServiceRequestDocumentKind — classification inferred from mime type. */
export type ServiceRequestDocumentKind =
  | "PDF"
  | "IMAGE"
  | "CERTIFICATE"
  | "OTHER";

// ── Aggregate types ──────────────────────────────────────────────────────────

/** One field of a RequestType form template (`ServiceRequestFormField`). */
export interface ServiceRequestFormField {
  key: string;
  label: string;
  type: ServiceRequestFormFieldType;
  required: boolean;
  /** Populated for SELECT / RADIO / CHECKBOX. */
  options: string[];
}

/** Admin-managed request-type / form-template (`ServiceRequestType`). */
export interface ServiceRequestType {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  formFields: ServiceRequestFormField[];
  attachedResourceIds: string[];
  /** Integer minor units (pesewas / cents); 0 => free. Divide by 100 to display. */
  feeAmountMinor?: number | null;
  feeCurrency?: string | null;
  escrowEnabled: boolean;
  escrowReleaseMode?: string | null;
  defaultAssigneeUserId?: string | null;
  requestNumberPrefix?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  version?: number | null;
  createdAt: string;
  updatedAt: string;
}

/** One row of a request's status-history audit trail (`ServiceRequestStatusHistoryEntry`). */
export interface ServiceRequestStatusHistoryEntry {
  id: string;
  requestId: string;
  /** Empty string for the initial entry. */
  fromStatus?: string | null;
  toStatus: string;
  actorUserId?: string | null;
  reason?: string | null;
  createdAt: string;
}

/** Full service-request aggregate (`ServiceRequest`). */
export interface ServiceRequest {
  id: string;
  requestNumber: string;
  ownerType: string;
  ownerEntityId?: string | null;
  requestTypeId: string;
  category?: string | null;
  status: string;
  requesterUserId: string;
  assigneeUserId?: string | null;
  /** JSON-encoded map of form field key -> value. JSON.parse before use. */
  formResponsesJson?: string | null;
  conversationId?: string | null;
  /** Integer minor units (pesewas / cents). 0 => free. */
  feeAmountMinor?: number | null;
  feeCurrency?: string | null;
  paymentIntentId?: string | null;
  paymentStatus?: string | null;
  escrowId?: string | null;
  escrowStatus?: string | null;
  decisionReason?: string | null;
  submittedAt?: string | null;
  reviewStartedAt?: string | null;
  decidedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Staff-only, single-request query only. Empty for list responses. */
  statusHistory: ServiceRequestStatusHistoryEntry[];
}

/** Lightweight projection returned by every list endpoint (`ServiceRequestSummary`). */
export interface ServiceRequestSummary {
  id: string;
  requestNumber: string;
  ownerType: string;
  ownerEntityId?: string | null;
  requestTypeId: string;
  category?: string | null;
  status: string;
  requesterUserId: string;
  assigneeUserId?: string | null;
  /** Integer minor units (pesewas / cents). */
  feeAmountMinor?: number | null;
  feeCurrency?: string | null;
  paymentStatus?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

/** A staff-only internal note (`ServiceRequestNote`). */
export interface ServiceRequestNote {
  id: string;
  requestId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

/** A document attached to a request (`ServiceRequestDocument`). */
export interface ServiceRequestDocument {
  id: string;
  requestId: string;
  uploaderUserId: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  sizeBytes?: number | null;
  /** DocumentKind string value (PDF | IMAGE | CERTIFICATE | OTHER). */
  kind?: string | null;
  /** Links the document to a FILE_UPLOAD form field on the RequestType. */
  formFieldKey?: string | null;
  confirmed: boolean;
  /** Freshly-minted signed read URL. */
  readUrl?: string | null;
  uploadedAt: string;
}

/** Result of `requestServiceRequestDocumentUploadUrl` (`ServiceRequestDocumentUploadUrl`). */
export interface ServiceRequestDocumentUploadUrl {
  documentId: string;
  uploadUrl: string;
  storageKey?: string | null;
  expiresAt?: string | null;
}

// ── Query argument shapes ────────────────────────────────────────────────────

/** Args for `ownerServiceRequests`. */
export interface OwnerServiceRequestsArgs {
  ownerType: ServiceRequestOwnerType;
  ownerEntityId: string;
  status?: ServiceRequestStatus;
  requestTypeId?: string;
  assigneeUserId?: string;
  limit?: number;
  offset?: number;
}

/** Args for `addServiceRequestInternalNote` (gateway `AddRequestInternalNoteInput`). */
export interface AddServiceRequestInternalNoteInput {
  requestId: string;
  body: string;
}
