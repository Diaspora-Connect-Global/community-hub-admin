/**
 * UI types and helpers for the Resources admin module.
 *
 * Re-exports the service-layer domain types and adds presentation helpers:
 *   - the file-type / visibility / status option lists for the form + filters,
 *   - status badge colour classes,
 *   - human-friendly enum labels,
 *   - date formatting.
 */
import type {
  ResourceFileType,
  ResourceVisibility,
  ResourceStatus,
} from "@/services/graphql/resources/types";

export type {
  ResourceSummary,
  Resource,
  ResourceCategory,
  ResourceFileType,
  ResourceVisibility,
  ResourceStatus,
  ResourceOwnerType,
} from "@/services/graphql/resources/types";

/** All file types, for the form select. */
export const FILE_TYPES: ResourceFileType[] = [
  "PDF",
  "DOC",
  "XLS",
  "PPT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "OTHER",
];

/** Visibilities offered at creation. */
export const VISIBILITIES: ResourceVisibility[] = [
  "PUBLIC",
  "COMMUNITY_MEMBERS",
  "ROLE_BASED",
];

/** All statuses, in lifecycle order, for filter dropdowns. */
export const RESOURCE_STATUSES: ResourceStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

/** Tailwind class for a status badge. */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-success/10 text-success";
    case "DRAFT":
      return "bg-warning/10 text-warning";
    case "ARCHIVED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Human-friendly enum label, e.g. "COMMUNITY_MEMBERS" -> "Community Members". */
export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** File-type label (acronyms stay uppercase). */
export function fileTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  switch (value) {
    case "PDF":
    case "DOC":
    case "XLS":
    case "PPT":
      return value;
    default:
      return formatEnumLabel(value);
  }
}

/** Visibility label. */
export function visibilityLabel(value: string | null | undefined): string {
  return formatEnumLabel(value);
}

/** Status label. */
export function statusLabel(value: string | null | undefined): string {
  return formatEnumLabel(value);
}

/** Format an ISO date string for compact display; "—" for falsy input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
