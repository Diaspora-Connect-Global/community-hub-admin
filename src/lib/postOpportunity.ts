/**
 * Pure helpers for "post + opportunity" in the composer. Kept free of React/i18n so it
 * is unit-testable; the same file lives in both admin consoles (community + association).
 *
 * Money rule: the admin types MAJOR units ("2500.50"); `majorToMinor` is the ONE place
 * that converts to integer MINOR units (x100) for the wire.
 */
import type { OpportunitySuggestedType } from "./opportunityDetection";

export type OppOwnerType = "COMMUNITY" | "ASSOCIATION";
export type OppType = OpportunitySuggestedType | "INVESTMENT" | "INITIATIVE";
export type OppApplicationMethod = "IN_PLATFORM_FORM" | "EXTERNAL_LINK" | "EMAIL_REQUEST";
export type OppAudience = "PUBLIC" | "MEMBERS";

export const OPP_TYPES: OppType[] = [
  "EMPLOYMENT", "CONTRACT", "VOLUNTEER", "SCHOLARSHIP", "GRANT", "FELLOWSHIP", "PROGRAM", "INVESTMENT", "INITIATIVE",
];
export const OPP_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"] as const;
export const OPP_DELIVERY_MODES = ["REMOTE", "IN_PERSON", "HYBRID", "ONLINE"] as const;
export const OPP_COMMITMENTS = ["FULL_TIME", "PART_TIME", "CONTRACT", "ONE_TIME", "FLEXIBLE", "PROJECT_BASED", "ONGOING"] as const;

const CATEGORY_BY_TYPE: Record<OppType, string> = {
  EMPLOYMENT: "EMPLOYMENT_CAREER",
  CONTRACT: "EMPLOYMENT_CAREER",
  SCHOLARSHIP: "EDUCATION_TRAINING",
  PROGRAM: "EDUCATION_TRAINING",
  INVESTMENT: "BUSINESS_INVESTMENT",
  FELLOWSHIP: "FELLOWSHIPS_LEADERSHIP",
  INITIATIVE: "GOVERNMENT_EMBASSY_INITIATIVES",
  GRANT: "FUNDING_GRANTS",
  VOLUNTEER: "VOLUNTEERING_SOCIAL_IMPACT",
};

export const categoryForType = (type: OppType): string => CATEGORY_BY_TYPE[type] ?? "EMPLOYMENT_CAREER";

/** Form state of the details dialog. All strings so inputs stay controlled. */
export interface OpportunityDraft {
  title: string;
  description: string;
  type: OppType;
  audience: OppAudience;
  applicationMethod: OppApplicationMethod;
  externalLink: string;
  applicationEmail: string;
  location: string;
  deliveryMode: string; // "" = not set
  commitmentType: string; // "" = not set
  payMin: string; // major units as typed
  payMax: string;
  currency: string;
  deadline: string; // YYYY-MM-DD or ""
}

export const TITLE_MAX = 200;

/** First non-empty line, capped at TITLE_MAX. */
export function titleFromText(text: string): string {
  const line = (text ?? "").split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
  return line.slice(0, TITLE_MAX);
}

export function defaultOpportunityDraft(text: string, suggested: OppType | null): OpportunityDraft {
  return {
    title: titleFromText(text),
    description: (text ?? "").trim(),
    type: suggested ?? "EMPLOYMENT",
    audience: "PUBLIC",
    applicationMethod: "IN_PLATFORM_FORM",
    externalLink: "",
    applicationEmail: "",
    location: "",
    deliveryMode: "",
    commitmentType: "",
    payMin: "",
    payMax: "",
    currency: "GHS",
    deadline: "",
  };
}

/** Strict "12", "12.5", "12.50" -> integer minor units; null when not a valid amount. */
export function majorToMinor(input: string): number | null {
  const s = (input ?? "").trim().replace(",", ".");
  const m = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
}

export type OpportunityIssue =
  | "title" | "description" | "link" | "email" | "pay" | "payRange" | "deadline";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Issue codes only (the UI translates them). Empty = valid. */
export function validateOpportunityDraft(d: OpportunityDraft, today: Date = new Date()): OpportunityIssue[] {
  const issues: OpportunityIssue[] = [];
  if (!d.title.trim() || d.title.trim().length > TITLE_MAX) issues.push("title");
  if (!d.description.trim()) issues.push("description");
  if (d.applicationMethod === "EXTERNAL_LINK" && !isHttpUrl(d.externalLink)) issues.push("link");
  if (d.applicationMethod === "EMAIL_REQUEST" && !EMAIL_RE.test(d.applicationEmail.trim())) issues.push("email");
  const min = d.payMin.trim() ? majorToMinor(d.payMin) : undefined;
  const max = d.payMax.trim() ? majorToMinor(d.payMax) : undefined;
  if (min === null || max === null) issues.push("pay");
  else if (min !== undefined && max !== undefined && min > max) issues.push("payRange");
  if (d.deadline) {
    const dl = new Date(`${d.deadline}T23:59:59`);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (Number.isNaN(dl.getTime()) || dl < startOfToday) issues.push("deadline");
  }
  return issues;
}

/** The gateway's CreateOpportunityInput. Call only after validation passes. */
export function buildOpportunityInput(d: OpportunityDraft, ownerType: OppOwnerType, ownerId: string): Record<string, unknown> {
  const input: Record<string, unknown> = {
    ownerType,
    ownerId,
    type: d.type,
    category: categoryForType(d.type),
    title: d.title.trim(),
    description: d.description.trim(),
    visibility: d.audience === "MEMBERS" ? (ownerType === "COMMUNITY" ? "COMMUNITY_ONLY" : "ASSOCIATION_ONLY") : "PUBLIC",
    applicationMethod: d.applicationMethod,
  };
  if (d.applicationMethod === "EXTERNAL_LINK") input.externalLink = d.externalLink.trim();
  if (d.applicationMethod === "EMAIL_REQUEST") input.applicationEmail = d.applicationEmail.trim();
  if (d.location.trim()) input.location = d.location.trim();
  if (d.deliveryMode) input.deliveryMode = d.deliveryMode;
  if (d.commitmentType) input.commitmentType = d.commitmentType;
  const min = d.payMin.trim() ? majorToMinor(d.payMin) : null;
  const max = d.payMax.trim() ? majorToMinor(d.payMax) : null;
  if (min !== null) input.compensationMin = min;
  if (max !== null) input.compensationMax = max;
  if (min !== null || max !== null) {
    input.compensationCurrency = d.currency;
    input.compensationType = "SALARY";
  }
  if (d.deadline) input.deadline = d.deadline;
  return input;
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const str = (v: unknown, max = 5000): string => (typeof v === "string" ? v.slice(0, max) : "");

/** Defensive parse of a draft restored from browser storage; null if unusable. */
export function parseOpportunityDraft(raw: unknown): OpportunityDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const base = defaultOpportunityDraft("", null);
  const draft: OpportunityDraft = {
    title: str(r.title, TITLE_MAX),
    description: str(r.description),
    type: pick(r.type, OPP_TYPES, base.type),
    audience: pick(r.audience, ["PUBLIC", "MEMBERS"] as const, base.audience),
    applicationMethod: pick(r.applicationMethod, ["IN_PLATFORM_FORM", "EXTERNAL_LINK", "EMAIL_REQUEST"] as const, base.applicationMethod),
    externalLink: str(r.externalLink, 2000),
    applicationEmail: str(r.applicationEmail, 320),
    location: str(r.location, 300),
    deliveryMode: pick(r.deliveryMode, ["", ...OPP_DELIVERY_MODES] as const, ""),
    commitmentType: pick(r.commitmentType, ["", ...OPP_COMMITMENTS] as const, ""),
    payMin: str(r.payMin, 20),
    payMax: str(r.payMax, 20),
    currency: pick(r.currency, OPP_CURRENCIES, "GHS"),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(str(r.deadline, 10)) ? str(r.deadline, 10) : "",
  };
  return draft.title.trim() && draft.description.trim() ? draft : null;
}

/** Friendly-message key for a gateway error code, or null to use the generic message. */
export function opportunityErrorKey(code: string | undefined): "ownerMismatch" | "failed" | "rateLimited" | null {
  if (code === "OPPORTUNITY_POST_OWNER_MISMATCH") return "ownerMismatch";
  if (code === "OPPORTUNITY_POST_FAILED") return "failed";
  if (code === "RATE_LIMITED" || code === "TOO_MANY_REQUESTS" || code === "THROTTLED") return "rateLimited";
  return null;
}
