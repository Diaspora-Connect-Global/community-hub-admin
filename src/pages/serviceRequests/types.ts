/**
 * UI types and helpers for the Service Requests admin module.
 *
 * Re-exports the service-layer domain types and adds presentation helpers:
 *   - the status workflow (allowed-transitions map) that gates the action buttons,
 *   - status / payment badge colour classes,
 *   - a minor-unit -> major-unit money formatter,
 *   - safe parse/serialize for `formResponsesJson`.
 */
import type {
  ServiceRequestStatus,
  ServiceRequestFormField,
} from "@/services/graphql/serviceRequests/types";

export type {
  ServiceRequest,
  ServiceRequestSummary,
  ServiceRequestStatus,
  ServiceRequestOwnerType,
  ServiceRequestType,
  ServiceRequestFormField,
  ServiceRequestFormFieldType,
  ServiceRequestNote,
  ServiceRequestDocument,
  ServiceRequestStatusHistoryEntry,
} from "@/services/graphql/serviceRequests/types";

export const PAGE_SIZE = 20;

/** Sentinel select value meaning "no filter". */
export const FILTER_ALL = "ALL";

/** All statuses, in lifecycle order, for filter dropdowns. */
export const REQUEST_STATUSES: ServiceRequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_INFO",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

/**
 * The set of staff workflow actions and their valid source statuses, mirroring
 * the service-request-service state machine. `retryPayment` is gated on payment
 * status rather than request status, so it is handled separately in the UI.
 */
export type WorkflowAction =
  | "assign"
  | "startReview"
  | "requestInfo"
  | "approve"
  | "reject"
  | "complete";

/**
 * Allowed-transitions map: which statuses permit which staff action.
 *
 *   SUBMITTED      -> startReview, assign
 *   UNDER_REVIEW   -> requestInfo, approve, reject, assign
 *   PENDING_INFO   -> startReview (resume), approve, reject, assign
 *   APPROVED       -> complete
 *   REJECTED       -> (terminal)
 *   COMPLETED      -> (terminal)
 *   CANCELLED      -> (terminal)
 *
 * Assignment stays available across the active (non-terminal) statuses.
 */
export const ALLOWED_ACTIONS: Record<ServiceRequestStatus, WorkflowAction[]> = {
  SUBMITTED: ["startReview", "assign"],
  UNDER_REVIEW: ["requestInfo", "approve", "reject", "assign"],
  PENDING_INFO: ["startReview", "approve", "reject", "assign"],
  APPROVED: ["complete"],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export function canPerform(
  status: string,
  action: WorkflowAction,
): boolean {
  const allowed = ALLOWED_ACTIONS[status as ServiceRequestStatus];
  return allowed ? allowed.includes(action) : false;
}

/** True when the request is in a terminal status (no further workflow actions). */
export function isTerminalStatus(status: string): boolean {
  return (
    status === "REJECTED" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  );
}

/** Tailwind class for a status badge (matches the existing Reports palette). */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-500/10 text-blue-400";
    case "UNDER_REVIEW":
      return "bg-primary/10 text-primary";
    case "PENDING_INFO":
      return "bg-warning/10 text-warning";
    case "APPROVED":
      return "bg-success/10 text-success";
    case "COMPLETED":
      return "bg-green-500/10 text-green-400";
    case "REJECTED":
      return "bg-destructive/10 text-destructive";
    case "CANCELLED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Tailwind class for a payment-status badge. */
export function getPaymentBadgeClass(paymentStatus: string): string {
  const s = paymentStatus.toUpperCase();
  if (s.includes("PAID") || s.includes("SUCCEEDED") || s.includes("RELEASED")) {
    return "bg-success/10 text-success";
  }
  if (s.includes("FAIL") || s.includes("CANCEL")) {
    return "bg-destructive/10 text-destructive";
  }
  if (s.includes("PENDING") || s.includes("PROCESS") || s.includes("HELD")) {
    return "bg-warning/10 text-warning";
  }
  return "bg-muted text-muted-foreground";
}

/** Human-friendly status label, e.g. "UNDER_REVIEW" -> "Under Review". */
export function formatStatusLabel(status: string): string {
  if (!status) return status;
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Format an integer minor-unit amount (pesewas / cents) as a major-unit display
 * string. Returns null when there is no fee (undefined / null). 0 => "Free".
 */
export function formatMoney(
  minor: number | null | undefined,
  currency?: string | null,
): string | null {
  if (minor === null || minor === undefined) return null;
  if (minor === 0) return "Free";
  const major = (minor / 100).toFixed(2);
  return currency ? `${currency} ${major}` : major;
}

/**
 * Safely parse `formResponsesJson` (a JSON-encoded string on the wire) into a
 * key -> value map. Returns an empty object on null / parse failure.
 */
export function parseFormResponses(
  formResponsesJson: string | null | undefined,
): Record<string, unknown> {
  if (!formResponsesJson) return {};
  try {
    const parsed = JSON.parse(formResponsesJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

/** Render a parsed form-response value as a display string. */
export function formatResponseValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length ? value.map((v) => String(v)).join(", ") : "—";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Format an ISO date string for compact display; empty for falsy input. */
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

/** Format an ISO date-time string with time, for the status-history timeline. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Look up the form field metadata for a response key. Used to pair the
 * RequestType's `formFields` definitions with `formResponsesJson` values.
 */
export function findFormField(
  fields: ServiceRequestFormField[] | undefined,
  key: string,
): ServiceRequestFormField | undefined {
  return fields?.find((f) => f.key === key);
}
