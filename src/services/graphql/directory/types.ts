/**
 * TypeScript types for the Directory Service GraphQL API.
 *
 * Hand-written to match the api-gateway resolver/DTOs exactly (no codegen).
 * Source of truth:
 *   services/api-gateway/src/directory/directory.resolver.ts
 *   services/api-gateway/src/directory/dto/{listing,category,enums}.*
 *
 * All enum values are SCREAMING_SNAKE strings (the gateway speaks strings on
 * both sides of the wire — proto-loader runs with `enums: String`).
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export type DirectoryOwnerType =
  | "COMMUNITY"
  | "ASSOCIATION"
  | "MARKETPLACE"
  | "SYSTEM";

export type DirectoryListingKind =
  | "PERSON"
  | "ORGANIZATION"
  | "BUSINESS"
  | "PROFESSIONAL"
  | "INSTITUTION";

export type DirectoryListingStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export type DirectoryVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

// ── Nested object types ──────────────────────────────────────────────────────

/** Mirrors DirectoryListingContact — every field optional. */
export interface DirectoryListingContact {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
}

/** Mirrors DirectoryListingLocation. */
export interface DirectoryListingLocation {
  label?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  /** ISO 3166-1 alpha-2 */
  country?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// ── Aggregate / summary types ────────────────────────────────────────────────

/** Full directory listing aggregate (DirectoryListing ObjectType). */
export interface DirectoryListing {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  listingKind: string;
  categoryId?: string | null;
  categoryCode?: string | null;
  displayName: string;
  legalName?: string | null;
  summary?: string | null;
  description?: string | null;
  contact?: DirectoryListingContact | null;
  location?: DirectoryListingLocation | null;
  /** Promoted ISO 3166-1 alpha-2 column. */
  country?: string | null;
  languages: string[];
  tags: string[];
  status: string;
  verificationStatus: string;
  claimedUserId?: string | null;
  claimedVendorId?: string | null;
  verificationNote?: string | null;
  verifiedBy?: string | null;
  verificationSource?: string | null;
  claimedAt?: string | null;
  verifiedAt?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Lightweight projection used by all list / search endpoints. */
export interface DirectoryListingSummary {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  listingKind: string;
  categoryCode?: string | null;
  displayName: string;
  summary?: string | null;
  country?: string | null;
  languages: string[];
  tags: string[];
  status: string;
  verificationStatus: string;
  claimedUserId?: string | null;
  claimedVendorId?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

/** Admin-managed directory-category configuration row (DirectoryCategory). */
export interface DirectoryCategory {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  listingKind?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  version?: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface DirectoryListingContactInput {
  email?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface DirectoryListingLocationInput {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

/**
 * Input for `createDirectoryListing`. `ownerType` defaults to SYSTEM at the
 * gateway when omitted; for COMMUNITY / ASSOCIATION the actor must be org staff
 * and `ownerEntityId` is required.
 */
export interface CreateDirectoryListingInput {
  ownerType?: DirectoryOwnerType;
  ownerEntityId?: string;
  listingKind: DirectoryListingKind;
  /** Required (ID!) on the gateway input. */
  categoryId: string;
  displayName: string;
  legalName?: string;
  summary?: string;
  description?: string;
  contact?: DirectoryListingContactInput;
  location?: DirectoryListingLocationInput;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  languages?: string[];
  tags?: string[];
}

/**
 * Input for `updateDirectoryListing`. A material edit (listingKind / categoryId /
 * legalName) on a VERIFIED listing bumps verification back to PENDING_REVIEW.
 */
export interface UpdateDirectoryListingInput {
  id: string;
  listingKind?: DirectoryListingKind;
  categoryId?: string;
  displayName?: string;
  legalName?: string;
  summary?: string;
  description?: string;
  contact?: DirectoryListingContactInput;
  location?: DirectoryListingLocationInput;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  languages?: string[];
  tags?: string[];
}

/** Input for the `searchDirectory` query. All filters optional. */
export interface SearchDirectoryInput {
  query?: string;
  listingKind?: DirectoryListingKind;
  categoryCode?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  language?: string;
  ownerType?: DirectoryOwnerType;
  ownerEntityId?: string;
  verificationStatus?: DirectoryVerificationStatus;
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}
