/**
 * Idle (sliding) session timing — pure functions, no React, no storage, no clock.
 *
 * Model: while the admin is ACTIVE the session is kept alive silently (the access token is
 * refreshed in the background). Only after a period of INACTIVITY do we warn, and then sign
 * out. Activity resets everything. The refresh token's own absolute lifetime still applies:
 * when the server refuses a refresh, the session ends regardless of activity.
 */

export interface IdleConfig {
  /** No activity for this long → sign out. */
  idleTimeoutMs: number;
  /** Show the "you'll be signed out" warning this long before the timeout. */
  warningMs: number;
  /** Refresh the access token when it is within this long of expiring. */
  refreshLeadMs: number;
  /** Only refresh in the background if the admin was active within this window. */
  refreshActiveWindowMs: number;
  /** Record activity at most once per this interval (events are throttled, not debounced). */
  activityThrottleMs: number;
}

export const IDLE_CONFIG: IdleConfig = {
  idleTimeoutMs: 30 * 60_000,
  warningMs: 60_000,
  refreshLeadMs: 60_000,
  refreshActiveWindowMs: 5 * 60_000,
  activityThrottleMs: 15_000,
};

export type SessionPhase = "active" | "refreshDue" | "warning" | "expired";

export interface IdleEvaluation {
  phase: SessionPhase;
  /** Whole seconds until sign-out (only meaningful in the `warning` phase), never negative. */
  secondsLeft: number;
}

export interface IdleInput {
  now: number;
  /** Epoch ms of the last recorded activity. */
  lastActivity: number;
  /** Epoch ms at which the access token should be refreshed by, or null if unknown. */
  accessExpiresAt: number | null;
}

export function evaluateIdleSession(input: IdleInput, config: IdleConfig = IDLE_CONFIG): IdleEvaluation {
  // A lastActivity in the future (clock skew, bad stored value) counts as "just now".
  const idleMs = Math.max(0, input.now - input.lastActivity);
  const msLeft = config.idleTimeoutMs - idleMs;
  const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));

  if (idleMs >= config.idleTimeoutMs) return { phase: "expired", secondsLeft: 0 };
  if (idleMs >= config.idleTimeoutMs - config.warningMs) return { phase: "warning", secondsLeft };

  // Refresh only on real, recent activity — an unattended screen must not extend itself.
  if (
    input.accessExpiresAt !== null &&
    idleMs < config.refreshActiveWindowMs &&
    input.now >= input.accessExpiresAt - config.refreshLeadMs
  ) {
    return { phase: "refreshDue", secondsLeft };
  }
  return { phase: "active", secondsLeft };
}

/**
 * Should an activity event be recorded now? Regular events are throttled so listening costs
 * nothing; while the warning is open every event counts immediately so a click is never lost.
 */
export function shouldRecordActivity(
  input: { now: number; lastRecorded: number; warningOpen: boolean },
  config: IdleConfig = IDLE_CONFIG,
): boolean {
  if (input.warningOpen) return true;
  return input.now - input.lastRecorded >= config.activityThrottleMs;
}

/** A stored last-activity timestamp (from a previous page load / tab) is stale once idle ≥ timeout. */
export function isStoredActivityStale(
  stored: number | null,
  now: number,
  config: IdleConfig = IDLE_CONFIG,
): boolean {
  return stored !== null && now - stored >= config.idleTimeoutMs;
}

// ── Cross-tab messages (timestamps and events only — never tokens) ──────────────────────

export type SignOutReason = "idle" | "expired" | "manual";

export type RemoteMessage =
  | { type: "activity"; at: number }
  | { type: "logout"; reason: SignOutReason };

/** Validate an untrusted message from another tab / storage event. */
export function parseRemoteMessage(raw: unknown): RemoteMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (m.type === "activity" && typeof m.at === "number" && Number.isFinite(m.at)) {
    return { type: "activity", at: m.at };
  }
  if (m.type === "logout") {
    const reason: SignOutReason = m.reason === "idle" || m.reason === "expired" ? m.reason : "manual";
    return { type: "logout", reason };
  }
  return null;
}

/** Fold a remote message into local state. Remote activity can only move the clock forward, never into the future. */
export function applyRemoteMessage(
  state: { lastActivity: number },
  msg: RemoteMessage,
  now: number,
): { lastActivity: number; signOut: SignOutReason | null } {
  if (msg.type === "logout") return { lastActivity: state.lastActivity, signOut: msg.reason };
  const at = Math.min(msg.at, now);
  return { lastActivity: Math.max(state.lastActivity, at), signOut: null };
}
