/**
 * Pure helpers for the Event Networking admin surface (approvals, staff,
 * registration settings, organiser Events dashboard, events-only mode).
 *
 * Kept free of React and of the transport so it is unit-tested directly.
 * The same file lives in community-hub-admin, association-hub and admin-hub.
 */

// ---------------------------------------------------------------- statuses

export type RegistrationTone = "success" | "warning" | "danger" | "muted" | "info";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PENDING_APPROVAL: "Awaiting approval",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
  ATTENDED: "Checked in",
  CHECKED_IN: "Checked in",
  NO_SHOW: "No-show",
};

const STATUS_TONES: Record<string, RegistrationTone> = {
  PENDING: "info",
  PENDING_APPROVAL: "warning",
  CONFIRMED: "success",
  WAITLISTED: "info",
  REJECTED: "danger",
  CANCELLED: "muted",
  ATTENDED: "success",
  CHECKED_IN: "success",
  NO_SHOW: "muted",
};

/** `pending approval` / `Pending-Approval` / `PENDING_APPROVAL` → `PENDING_APPROVAL`. */
export function normalizeRegistrationStatus(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/** Admin-facing wording for a registration status. An unknown status is shown as-is, title-cased. */
export function registrationStatusLabel(raw: string | null | undefined): string {
  const key = normalizeRegistrationStatus(raw);
  if (!key) return "Unknown";
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  const words = key.toLowerCase().split("_").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function registrationStatusTone(raw: string | null | undefined): RegistrationTone {
  return STATUS_TONES[normalizeRegistrationStatus(raw)] ?? "muted";
}

/**
 * Payment wording that a registration's STATUS dictates regardless of its amount:
 * nothing is charged until an organiser approves, a waitlisted place is unpaid, and
 * a declined one is not payable. null = use the console's usual amount-based reading.
 */
export function paymentLabelOverride(status: string | null | undefined): string | null {
  switch (normalizeRegistrationStatus(status)) {
    case "PENDING_APPROVAL":
    case "WAITLISTED":
      return "Pending";
    case "REJECTED":
      return "—";
    default:
      return null;
  }
}

export interface StatusCount {
  status: string;
  count: number;
}

/** Count for one status in a `registrationsByStatus` list (case-insensitive); 0 when absent. */
export function countForStatus(counts: StatusCount[] | null | undefined, status: string): number {
  const want = normalizeRegistrationStatus(status);
  return (counts ?? []).reduce(
    (sum, row) => (normalizeRegistrationStatus(row.status) === want ? sum + (Number(row.count) || 0) : sum),
    0,
  );
}

// ---------------------------------------------------------------- staff

export type EventStaffRole = "EVENT_MANAGER" | "NETWORKING_MANAGER";

export const EVENT_STAFF_ROLES: { value: EventStaffRole; label: string; hint: string }[] = [
  {
    value: "EVENT_MANAGER",
    label: "Event manager",
    hint: "Approves registrations and edits the event.",
  },
  {
    value: "NETWORKING_MANAGER",
    label: "Networking manager",
    hint: "Runs the event's networking.",
  },
];

export function staffRoleLabel(role: string | null | undefined): string {
  return EVENT_STAFF_ROLES.find((r) => r.value === role)?.label ?? "Staff";
}

// ---------------------------------------------------------------- errors

/** Friendly wording for the gateway's `EVENT_*` codes. FORBIDDEN is never a normal outcome here. */
const ERROR_MESSAGES: Record<string, string> = {
  EVENT_FEATURE_UNAVAILABLE: "This isn't available yet.",
  EVENT_UNAVAILABLE: "Events are temporarily unavailable. Please try again in a moment.",
  EVENT_NOT_FOUND: "We could not find that. It may have been removed.",
  EVENT_INVALID_ARGUMENT: "That request was not valid. Check the details and try again.",
  EVENT_RATE_LIMITED: "You're doing that too often. Please wait a little and try again.",
  EVENT_CONFLICT: "That can't be done in the registration's current state. Refresh and try again.",
  EVENT_REFUSED: "That isn't available right now.",
};

export interface ErrorLike {
  code?: string | null;
  message?: string | null;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** A UUID, or a run of 8+ hex characters mixing digits and letters (an id fragment) — never shown to anyone. */
function containsId(text: string): boolean {
  if (UUID_RE.test(text)) return true;
  return text
    .split(/[^0-9a-z]+/i)
    .some((token) => token.length >= 8 && /^[0-9a-f]+$/i.test(token) && /\d/.test(token) && /[a-f]/i.test(token));
}

/** True when any error is the dark-launch refusal (feature not enabled yet). */
export function isFeatureUnavailable(errors: ErrorLike[]): boolean {
  return errors.some((e) => String(e.code ?? "").toUpperCase() === "EVENT_FEATURE_UNAVAILABLE");
}

/**
 * One friendly sentence for a failed event operation.
 *  - `EVENT_*` codes map to fixed wording; the server's own message is used only for
 *    codes without wording of their own (e.g. a specific EVENT_CONTENT_* reason), and
 *    only when it names no id.
 *  - Anything auth-shaped (FORBIDDEN, UNAUTHENTICATED…) is not surfaced as such.
 */
export function eventErrorMessage(errors: ErrorLike[], fallback = "Something went wrong. Please try again."): string {
  for (const e of errors) {
    const code = String(e.code ?? "").toUpperCase();
    if (!code.startsWith("EVENT_")) continue;
    if (ERROR_MESSAGES[code] && code !== "EVENT_REFUSED") return ERROR_MESSAGES[code];
    const text = String(e.message ?? "").trim();
    if (text && !containsId(text)) return text;
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.EVENT_REFUSED;
  }
  const auth = errors.some((e) => /FORBIDDEN|UNAUTHENTICATED|UNAUTHORI[SZ]ED|PERMISSION/i.test(String(e.code ?? "")));
  if (auth) return "You don't have access to do that for this event.";
  return fallback;
}

// ---------------------------------------------------------------- money & numbers

export interface CurrencyAmount {
  currency: string;
  /** Integer minor units, sent as a string. */
  amountMinor: string | number;
}

/**
 * Format INTEGER minor units for display (÷100 happens here and nowhere else).
 * Non-numeric input is "—", never 0.
 */
export function formatMinor(amountMinor: string | number | null | undefined, currency: string, locale?: string): string {
  if (amountMinor === null || amountMinor === undefined || amountMinor === "") return "—";
  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return "—";
  const code = String(currency ?? "").trim().toUpperCase();
  if (!code) return "—";
  const major = n / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(major);
  } catch {
    return `${major.toFixed(2)} ${code}`;
  }
}

/**
 * One formatted line per currency. Currencies are NEVER summed together; an
 * event with no paid registrations has no lines (the caller shows "—").
 */
export function revenueLines(revenue: CurrencyAmount[] | null | undefined, locale?: string): { currency: string; text: string }[] {
  const byCurrency = new Map<string, number>();
  for (const row of revenue ?? []) {
    const code = String(row.currency ?? "").trim().toUpperCase();
    const n = Number(row.amountMinor);
    if (!code || !Number.isFinite(n)) continue;
    byCurrency.set(code, (byCurrency.get(code) ?? 0) + n);
  }
  return [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, minor]) => ({ currency, text: formatMinor(minor, currency, locale) }));
}

/** Community joins: `null` / `undefined` means unknown → "—". A real 0 stays "0". */
export function formatJoins(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "—";
}

/** `0.456` → `46%`; null (unlimited capacity, no denominator) → "—". */
export function formatPercent(rate: number | null | undefined): string {
  return typeof rate === "number" && Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : "—";
}

/** Check-ins ÷ registered attendees (confirmed + already-attended). null when there is nobody to check in. */
export function checkInRate(checkedIn: number, counts: StatusCount[] | null | undefined): number | null {
  const registered = countForStatus(counts, "CONFIRMED") + countForStatus(counts, "ATTENDED");
  if (registered <= 0) return null;
  return Math.min(1, Math.max(0, checkedIn / registered));
}

// ---------------------------------------------------------------- dashboard grouping

export type EventPhase = "upcoming" | "live" | "past" | "draft" | "cancelled";

export interface PhaseInput {
  startAt: string;
  endAt: string;
  status: string;
}

/** Where an event sits on the timeline. Cancelled and draft win over the clock. */
export function eventPhase(ev: PhaseInput, now: Date = new Date()): EventPhase {
  const status = String(ev.status ?? "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "draft") return "draft";
  const start = Date.parse(ev.startAt);
  const end = Date.parse(ev.endAt);
  const t = now.getTime();
  if (Number.isFinite(end) && end < t) return "past";
  if (Number.isFinite(start) && start > t) return "upcoming";
  if (Number.isFinite(start) && Number.isFinite(end)) return "live";
  return "past";
}

export const TIME_RANGE_PRESETS = [
  { id: "next30", label: "Next 30 days", pastDays: 0, futureDays: 30 },
  { id: "last30", label: "Last 30 days", pastDays: 30, futureDays: 0 },
  { id: "around30", label: "30 days either side", pastDays: 30, futureDays: 30 },
  { id: "last90", label: "Last 90 days", pastDays: 90, futureDays: 0 },
  { id: "year", label: "Past year + next 90 days", pastDays: 365, futureDays: 90 },
] as const;
export type TimeRangePresetId = (typeof TIME_RANGE_PRESETS)[number]["id"];

export function rangeForPreset(id: TimeRangePresetId, now: Date = new Date()): { from: string; to: string } {
  const preset = TIME_RANGE_PRESETS.find((p) => p.id === id) ?? TIME_RANGE_PRESETS[2];
  const day = 86_400_000;
  return {
    from: new Date(now.getTime() - preset.pastDays * day).toISOString(),
    to: new Date(now.getTime() + Math.max(preset.futureDays, 1) * day).toISOString(),
  };
}

// ---------------------------------------------------------------- events-only mode

/**
 * An entity is "events-only" when its enabled services are exactly `events`.
 * `null` / `undefined` (not loaded, or a legacy record) is NOT events-only: the
 * rest of the console reads an unset list as "everything enabled".
 */
export function isEventsOnly(enabledServices: readonly string[] | null | undefined): boolean {
  if (!Array.isArray(enabledServices) || enabledServices.length === 0) return false;
  const set = new Set(enabledServices.map((s) => String(s).trim().toLowerCase()).filter(Boolean));
  return set.size === 1 && set.has("events");
}

/** Menu items kept by an events-only console: `keepIds` (per console) when events-only, else all. */
export function filterNavForEventsOnly<T extends { id: string }>(
  items: readonly T[],
  eventsOnly: boolean,
  keepIds: readonly string[],
): T[] {
  return eventsOnly ? items.filter((i) => keepIds.includes(i.id)) : [...items];
}

/** True when `pathname` is `allowed` itself or below it (`/` matches only itself). */
export function isPathAllowed(pathname: string, allowed: readonly string[]): boolean {
  return allowed.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}
