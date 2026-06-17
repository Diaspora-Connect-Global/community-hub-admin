/**
 * TypeScript types for the Registry (structured membership / population)
 * GraphQL API surface exposed by the api-gateway.
 *
 * Hand-written to mirror the gateway DTOs exactly (no codegen):
 *   - services/api-gateway/src/registry/dto/registry.type.ts
 *   - services/api-gateway/src/registry/dto/entry.type.ts
 *   - services/api-gateway/src/registry/dto/registry.input.ts
 *   - services/api-gateway/src/registry/dto/entry.input.ts
 *   - services/api-gateway/src/registry/dto/enums.ts
 *
 * All enums are SCREAMING_SNAKE strings on the wire. JSON-typed fields
 * (`fieldResponsesJson`, `sourceFieldMapJson`, `errorsJson`,
 * `channelBreakdownJson`) are opaque JSON strings — parse/serialize at the
 * boundary.
 *
 * NOTE (scope): this admin portal is COMMUNITY/ASSOCIATION staff-scoped, so the
 * staff-tier operations are the only ones used here. The SYSTEM-admin tier
 * (registry-type taxonomy CRUD, cross-owner listing) is intentionally omitted.
 */

// ── Enums (string unions) ────────────────────────────────────────────────────

export type RegistryOwnerType =
  | "COMMUNITY"
  | "ASSOCIATION"
  | "MARKETPLACE"
  | "SYSTEM";

export type RegistryStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type RegistryVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type RegistryMembershipStatus = "PENDING" | "ACTIVE" | "INACTIVE";

export type RegistryEntrySource =
  | "ADMIN"
  | "SELF"
  | "SERVICE_REQUEST"
  | "IMPORT";

export type RegistryVerificationSource =
  | "ADMIN"
  | "KYC_INDIVIDUAL"
  | "KYC_BUSINESS"
  | "VENDOR";

export type RegistryFormFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "EMAIL"
  | "TEXTAREA"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "FILE_UPLOAD";

export type RegistryImportJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type RegistryBroadcastChannel = "IN_APP" | "EMAIL" | "SMS";

// ── Object types ─────────────────────────────────────────────────────────────

/** A single dynamic form-field definition carried on a Registry. */
export interface RegistryFormField {
  key: string;
  label: string;
  /** RegistryFormFieldType value (string on the wire). */
  type: string;
  required: boolean;
  options: string[];
}

/** Full Registry container/template aggregate. */
export interface Registry {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  /** Resolved RegistryType code (denormalized). */
  registryType?: string | null;
  registryTypeId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  fieldSchema: RegistryFormField[];
  selfRegistrationEnabled: boolean;
  requiresApproval: boolean;
  casePrefix?: string | null;
  sourceRequestTypeId?: string | null;
  sourceFieldMapJson?: string | null;
  status: string;
  version: number;
  archivedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Lightweight projection used by registry list endpoints. */
export interface RegistrySummary {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  registryType?: string | null;
  name: string;
  code: string;
  status: string;
  selfRegistrationEnabled: boolean;
  version: number;
  updatedAt?: string | null;
}

/** Full RegistryEntry record (linked or shadow identity). */
export interface RegistryEntry {
  id: string;
  registryId: string;
  ownerType: string;
  ownerEntityId?: string | null;
  /** Empty => shadow record (no platform user). */
  linkedUserId?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  /** JSON-encoded map of field key -> value. */
  fieldResponsesJson?: string | null;
  tags: string[];
  verificationStatus: string;
  membershipStatus: string;
  directoryVisible: boolean;
  entryNumber?: string | null;
  source?: string | null;
  sourceRequestId?: string | null;
  verificationNote?: string | null;
  verifiedBy?: string | null;
  verificationSource?: string | null;
  claimedAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Lightweight projection used by all entry list / search endpoints. */
export interface RegistryEntrySummary {
  id: string;
  registryId: string;
  ownerType: string;
  ownerEntityId?: string | null;
  linkedUserId?: string | null;
  fullName?: string | null;
  email?: string | null;
  country?: string | null;
  tags: string[];
  verificationStatus: string;
  membershipStatus: string;
  directoryVisible: boolean;
  entryNumber?: string | null;
  source?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** A resumable bulk-CSV import job. */
export interface RegistryImportJob {
  id: string;
  registryId: string;
  ownerType: string;
  ownerEntityId?: string | null;
  status: string;
  storageKey?: string | null;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  /** JSON array of per-row errors. */
  errorsJson?: string | null;
  lastCursor?: string | null;
  actorUserId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Signed PUT URL for a CSV upload. */
export interface RegistryCsvUploadUrl {
  uploadUrl: string;
  storageKey: string;
  expiresAt?: string | null;
}

/** Audit row for a targeted broadcast. */
export interface RegistryBroadcast {
  id: string;
  registryId: string;
  ownerType: string;
  ownerEntityId?: string | null;
  actorUserId?: string | null;
  title: string;
  body?: string | null;
  channels: string[];
  recipientCount: number;
  /** JSON: { in_app, email, sms }. */
  channelBreakdownJson?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
}

// ── Input types ──────────────────────────────────────────────────────────────

/** Mirrors `RegistryFormFieldInput`. `options` required for SELECT/RADIO/CHECKBOX. */
export interface RegistryFormFieldInput {
  key: string;
  label: string;
  type: RegistryFormFieldType;
  required?: boolean;
  options?: string[];
}

/** Mirrors `CreateRegistryInput`. `registryTypeId` is REQUIRED (ID!). */
export interface CreateRegistryInput {
  ownerType?: RegistryOwnerType;
  ownerEntityId?: string;
  registryTypeId: string;
  name: string;
  code?: string;
  description?: string;
  fieldSchema?: RegistryFormFieldInput[];
  selfRegistrationEnabled?: boolean;
  requiresApproval?: boolean;
  casePrefix?: string;
  sourceRequestTypeId?: string;
  sourceFieldMapJson?: string;
}

/** Mirrors `UpdateRegistryInput`. `id` required; omit fields to leave unchanged. */
export interface UpdateRegistryInput {
  id: string;
  name?: string;
  description?: string;
  fieldSchema?: RegistryFormFieldInput[];
  selfRegistrationEnabled?: boolean;
  requiresApproval?: boolean;
  casePrefix?: string;
  sourceRequestTypeId?: string;
  sourceFieldMapJson?: string;
}

/** Mirrors `RegistryFieldPredicateInput`. op is EQ|NEQ|CONTAINS|EXISTS. */
export interface RegistryFieldPredicateInput {
  key: string;
  op: string;
  value?: string;
}

/** Mirrors `RegistrySegmentFilterInput` (proto `SegmentFilter`). */
export interface RegistrySegmentFilterInput {
  country?: string;
  city?: string;
  profession?: string;
  tags?: string[];
  verificationStatus?: RegistryVerificationStatus;
  membershipStatus?: RegistryMembershipStatus;
  fieldPredicates?: RegistryFieldPredicateInput[];
  linkedOnly?: boolean;
  shadowOnly?: boolean;
}

/** Mirrors `SearchRegistryEntriesInput`. */
export interface SearchRegistryEntriesInput {
  registryId?: string;
  ownerType?: RegistryOwnerType;
  ownerEntityId?: string;
  query?: string;
  filter?: RegistrySegmentFilterInput;
  limit?: number;
  offset?: number;
}

/** Mirrors `AddRegistryEntryInput`. */
export interface AddRegistryEntryInput {
  registryId: string;
  linkedUserId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  fieldResponsesJson?: string;
  tags?: string[];
}

/** Mirrors `UpdateRegistryEntryInput`. */
export interface UpdateRegistryEntryInput {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  fieldResponsesJson?: string;
  tags?: string[];
}

/** Mirrors `VerifyRegistryEntryInput`. */
export interface VerifyRegistryEntryInput {
  id: string;
  note?: string;
  source?: RegistryVerificationSource;
}

/** Mirrors `RejectRegistryEntryInput`. */
export interface RejectRegistryEntryInput {
  id: string;
  note?: string;
}

/** Mirrors `SuspendRegistryEntryInput`. */
export interface SuspendRegistryEntryInput {
  id: string;
  note?: string;
}

/** Mirrors `ChangeRegistryEntryMembershipStatusInput`. */
export interface ChangeRegistryEntryMembershipStatusInput {
  id: string;
  membershipStatus: RegistryMembershipStatus;
  reason?: string;
}

/** Mirrors `SetRegistryEntryDirectoryVisibilityInput`. */
export interface SetRegistryEntryDirectoryVisibilityInput {
  id: string;
  directoryVisible: boolean;
}

/** Mirrors `SendRegistryBroadcastInput`. `title` + `body` are required. */
export interface SendRegistryBroadcastInput {
  registryId: string;
  filter?: RegistrySegmentFilterInput;
  title: string;
  body: string;
  channels?: RegistryBroadcastChannel[];
}
