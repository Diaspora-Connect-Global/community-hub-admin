/**
 * TypeScript types for the Resource Service GraphQL API (community / association
 * admin surface).
 *
 * Hand-written to mirror the api-gateway resolver / DTOs EXACTLY (no codegen):
 *   services/api-gateway/src/resource/{resource.resolver,dto/*}.ts
 *
 * Wire conventions worth repeating:
 *   - Enums are SCREAMING_SNAKE string values (proto-loader `enums: String`).
 *   - MONEY: `downloadFeeMinor` is an INTEGER in minor units (pesewas / cents).
 *     Exposed over the wire as a GraphQL Float to carry int64 safely. Divide by
 *     100 ONLY at the display boundary — never store/transmit major units.
 *   - Counters (`viewCount`, `downloadCount`) are Floats on the wire (int64-safe).
 */

// ── Enums (string unions matching the gateway) ───────────────────────────────

/** ResourceOwnerType. Staff admin UI only ever deals with COMMUNITY / ASSOCIATION. */
export type ResourceOwnerType =
  | "COMMUNITY"
  | "ASSOCIATION"
  | "MARKETPLACE"
  | "SYSTEM";

/** ResourceStatus — publication lifecycle. */
export type ResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** ResourceVisibility — who may read a published resource. */
export type ResourceVisibility = "PUBLIC" | "COMMUNITY_MEMBERS" | "ROLE_BASED";

/** ResourceFileType — the kind of file backing a resource. */
export type ResourceFileType =
  | "PDF"
  | "DOC"
  | "XLS"
  | "PPT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "OTHER";

// ── Aggregate types ──────────────────────────────────────────────────────────

/**
 * Lightweight projection returned by every list endpoint (`ResourceSummary`).
 * `resourcesByOwner` returns these for the management screen (incl. drafts).
 */
export interface ResourceSummary {
  id: string;
  resourceNumber?: string | null;
  title: string;
  /** ResourceFileType string value. */
  fileType?: string | null;
  status: string;
  visibility: string;
  categoryIds: string[];
  tags: string[];
  featured: boolean;
  pinned: boolean;
  viewCount: number;
  downloadCount: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

/**
 * Minimal safe selection of the full `Resource` aggregate — what the mutations
 * return. Only fields confirmed on the gateway `resource.type.ts` are selected.
 */
export interface Resource {
  id: string;
  title: string;
  status: string;
  visibility: string;
  fileType?: string | null;
}

/** Admin-managed, owner-scoped resource-category taxonomy row (`ResourceCategory`). */
export interface ResourceCategory {
  id: string;
  ownerType: string;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  icon?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
  version?: number | null;
}

/** Result of `requestResourceUploadUrl` (`ResourceUploadUrl`). */
export interface ResourceUploadUrl {
  uploadUrl: string;
  storageKey: string;
  versionId: string;
  expiresAt?: string | null;
}
