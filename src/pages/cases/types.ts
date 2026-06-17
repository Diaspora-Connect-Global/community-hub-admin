/**
 * UI types + status helpers for the Support Cases module.
 *
 * The canonical lifecycle (from the gateway enum docs) is:
 *   SUBMITTED → ASSIGNED → INVESTIGATING → RESOLVED → CLOSED
 * with REOPENED / REJECTED / CANCELLED branches. CANCELLED is reporter-only and
 * terminal from the staff perspective.
 *
 * `assignCase` performs the SUBMITTED/REOPENED → ASSIGNED transition; every
 * other transition goes through `updateCaseStatus(targetStatus)`. The maps below
 * gate the workflow action buttons in CaseDetail so staff only ever see
 * transitions that are valid from the current status.
 */
import type { SupportCaseStatus, SupportPriority } from "@/services/graphql/support/types";

export const PAGE_SIZE = 25;

export const STATUS_ALL = "ALL";
export const PRIORITY_ALL = "ALL";

/** All staff-relevant statuses, in lifecycle order (used for the filter list). */
export const CASE_STATUSES: SupportCaseStatus[] = [
  "SUBMITTED",
  "ASSIGNED",
  "INVESTIGATING",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "REJECTED",
  "CANCELLED",
];

export const CASE_PRIORITIES: SupportPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

/** Statuses that count as "open" for the header badge / open-count. */
export const OPEN_STATUSES: SupportCaseStatus[] = [
  "SUBMITTED",
  "ASSIGNED",
  "INVESTIGATING",
  "REOPENED",
];

/**
 * The workflow actions a staff member can take, keyed by the underlying
 * transition. `requiresResolution` marks actions that must carry a
 * `resolutionSummary`; `viaAssign` marks the one action routed through
 * `assignCase` instead of `updateCaseStatus`.
 */
export type CaseWorkflowAction =
  | "ASSIGN"
  | "INVESTIGATE"
  | "RESOLVE"
  | "CLOSE"
  | "REOPEN"
  | "REJECT";

export interface CaseActionConfig {
  action: CaseWorkflowAction;
  /** Target status this action moves the case to. */
  targetStatus: SupportCaseStatus;
  /** True when the action is performed via assignCase rather than updateCaseStatus. */
  viaAssign?: boolean;
  /** True when a resolutionSummary is mandatory (RESOLVE). */
  requiresResolution?: boolean;
}

export const CASE_ACTIONS: Record<CaseWorkflowAction, CaseActionConfig> = {
  ASSIGN: { action: "ASSIGN", targetStatus: "ASSIGNED", viaAssign: true },
  INVESTIGATE: { action: "INVESTIGATE", targetStatus: "INVESTIGATING" },
  RESOLVE: { action: "RESOLVE", targetStatus: "RESOLVED", requiresResolution: true },
  CLOSE: { action: "CLOSE", targetStatus: "CLOSED" },
  REOPEN: { action: "REOPEN", targetStatus: "REOPENED" },
  REJECT: { action: "REJECT", targetStatus: "REJECTED" },
};

/**
 * Allowed staff actions from each status. CLOSED/REJECTED can be reopened;
 * CANCELLED is terminal (no staff actions).
 */
export const ALLOWED_ACTIONS: Record<string, CaseWorkflowAction[]> = {
  SUBMITTED: ["ASSIGN", "REJECT"],
  ASSIGNED: ["INVESTIGATE", "RESOLVE", "REJECT"],
  INVESTIGATING: ["RESOLVE", "REJECT"],
  RESOLVED: ["CLOSE", "REOPEN"],
  CLOSED: ["REOPEN"],
  REOPENED: ["ASSIGN", "INVESTIGATE", "REJECT"],
  REJECTED: ["REOPEN"],
  CANCELLED: [],
};

/** Returns the workflow actions valid from a given case status. */
export function allowedActionsFor(status: string): CaseActionConfig[] {
  const keys = ALLOWED_ACTIONS[status] ?? [];
  return keys.map((k) => CASE_ACTIONS[k]);
}

// ── Badge color maps (Tailwind classes, mirroring Reports.tsx) ────────────────

export const statusColors: Record<string, string> = {
  SUBMITTED: "bg-warning/10 text-warning",
  ASSIGNED: "bg-blue-500/10 text-blue-400",
  INVESTIGATING: "bg-purple-500/10 text-purple-400",
  RESOLVED: "bg-success/10 text-success",
  CLOSED: "bg-muted text-muted-foreground",
  REOPENED: "bg-orange-500/10 text-orange-400",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export const priorityColors: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/10 text-blue-400",
  HIGH: "bg-warning/10 text-warning",
  URGENT: "bg-destructive/10 text-destructive",
};

/** i18n key suffix for an action label, e.g. cases.action.<key>. */
export const ACTION_LABEL_KEY: Record<CaseWorkflowAction, string> = {
  ASSIGN: "assign",
  INVESTIGATE: "investigate",
  RESOLVE: "resolve",
  CLOSE: "close",
  REOPEN: "reopen",
  REJECT: "reject",
};
