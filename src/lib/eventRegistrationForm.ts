/**
 * Pure helpers for the organiser-built event registration form.
 *
 * The builder edits `RegistrationFieldDraft[]`; on save they are validated and
 * mapped to `RegistrationFormFieldInput[]` for `updateEventFormFields`, which
 * replaces the WHOLE form in order. Nothing here touches React or the network.
 */

export const REGISTRATION_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "multiselect",
  "checkbox",
] as const;
export type RegistrationFieldType = (typeof REGISTRATION_FIELD_TYPES)[number];

export type RegistrationMode = "IN_APP" | "EXTERNAL";

/** Server limits (the server stays the authority; these give early feedback). */
export const MAX_REGISTRATION_FIELDS = 25;
export const MAX_FIELD_LABEL = 150;
export const MAX_OPTIONS = 30;
export const MAX_OPTION_LENGTH = 80;

/** A question as the gateway returns it. */
export interface RegistrationFormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[] | null;
  builtin?: string | null;
}

/** Wire shape of `RegistrationFormFieldInput`. */
export interface RegistrationFormFieldInput {
  id?: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  options?: string[];
}

/** Editable row. `uid` is UI-only (stable React key); `id` is the server's question id. */
export interface RegistrationFieldDraft {
  uid: string;
  /** Server id: reserved for defaults, kept for saved custom questions, absent for new ones. */
  id?: string;
  builtin: string | null;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  options: string[];
}

/** The four default fields, in display order (reserved ids; English server labels). */
export const BUILTIN_FIELDS: ReadonlyArray<{
  id: string;
  type: RegistrationFieldType;
  required: boolean;
  label: string;
}> = [
  { id: "full_name", type: "text", required: true, label: "Full name" },
  { id: "email", type: "email", required: true, label: "Email address" },
  { id: "phone", type: "phone", required: false, label: "Phone number" },
  { id: "job_title", type: "text", required: false, label: "Job title" },
];

export const BUILTIN_IDS: ReadonlyArray<string> = BUILTIN_FIELDS.map((b) => b.id);

let uidCounter = 0;
export function newFieldUid(): string {
  uidCounter += 1;
  return `rf_${Date.now()}_${uidCounter}`;
}

export function isChoiceType(type: string): boolean {
  return type === "select" || type === "multiselect";
}

function isKnownType(type: string): type is RegistrationFieldType {
  return (REGISTRATION_FIELD_TYPES as ReadonlyArray<string>).includes(type);
}

function builtinDraft(b: (typeof BUILTIN_FIELDS)[number]): RegistrationFieldDraft {
  return {
    uid: newFieldUid(),
    id: b.id,
    builtin: b.id,
    label: b.label,
    type: b.type,
    required: b.required,
    options: [],
  };
}

/** The four defaults, ready for a brand-new event. */
export function defaultFieldDrafts(): RegistrationFieldDraft[] {
  return BUILTIN_FIELDS.map(builtinDraft);
}

/** A blank organiser question (no id until the server assigns one). */
export function emptyQuestionDraft(): RegistrationFieldDraft {
  return { uid: newFieldUid(), builtin: null, label: "", type: "text", required: false, options: [] };
}

/** The default fields not currently in the form. */
export function missingBuiltinIds(drafts: RegistrationFieldDraft[]): string[] {
  const present = new Set(drafts.map((d) => d.builtin ?? (BUILTIN_IDS.includes(d.id ?? "") ? d.id : null)));
  return BUILTIN_IDS.filter((id) => !present.has(id));
}

/**
 * Re-add the missing defaults (same reserved ids) in their canonical order, at
 * the top of the form. Existing rows, including edited defaults, are untouched.
 */
export function restoreDefaultFields(drafts: RegistrationFieldDraft[]): RegistrationFieldDraft[] {
  const missing = new Set(missingBuiltinIds(drafts));
  if (missing.size === 0) return drafts;
  const restored = BUILTIN_FIELDS.filter((b) => missing.has(b.id)).map(builtinDraft);
  return [...restored, ...drafts];
}

/** Persisted questions → editable drafts. */
export function fieldsToDrafts(fields: RegistrationFormField[] | null | undefined): RegistrationFieldDraft[] {
  if (!fields) return [];
  return fields.map((f) => ({
    uid: newFieldUid(),
    id: f.id,
    builtin: f.builtin ?? null,
    label: f.label,
    type: isKnownType(f.type) ? f.type : "text",
    required: !!f.required,
    options: Array.isArray(f.options) ? [...f.options] : [],
  }));
}

/** Move a row one place up (-1) or down (+1); out-of-range is a no-op. */
export function moveDraft(drafts: RegistrationFieldDraft[], index: number, delta: -1 | 1): RegistrationFieldDraft[] {
  const target = index + delta;
  if (index < 0 || index >= drafts.length || target < 0 || target >= drafts.length) return drafts;
  const next = [...drafts];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Change a question's type, keeping or seeding options as the new type needs. */
export function withType(draft: RegistrationFieldDraft, type: RegistrationFieldType): RegistrationFieldDraft {
  if (draft.builtin) return draft; // default fields keep the canonical type
  const options = isChoiceType(type) ? (draft.options.length ? draft.options : [""]) : [];
  return { ...draft, type, options };
}

export type FieldErrorCode =
  | "label_required"
  | "label_too_long"
  | "options_required"
  | "options_too_many"
  | "option_too_long"
  | "options_duplicate";

export interface FieldError {
  uid: string;
  code: FieldErrorCode;
}

export interface DraftsValidation {
  ok: boolean;
  /** At most one error per row (the first problem found). */
  errors: FieldError[];
  /** Set when the form has more than the 25 questions the server allows. */
  tooMany: boolean;
}

const cleanOptions = (d: RegistrationFieldDraft): string[] => d.options.map((o) => o.trim()).filter(Boolean);

export function validateDrafts(drafts: RegistrationFieldDraft[]): DraftsValidation {
  const errors: FieldError[] = [];
  for (const d of drafts) {
    const label = d.label.trim();
    if (!label) {
      errors.push({ uid: d.uid, code: "label_required" });
      continue;
    }
    if (label.length > MAX_FIELD_LABEL) {
      errors.push({ uid: d.uid, code: "label_too_long" });
      continue;
    }
    if (isChoiceType(d.type)) {
      const opts = cleanOptions(d);
      if (opts.length === 0) errors.push({ uid: d.uid, code: "options_required" });
      else if (opts.length > MAX_OPTIONS) errors.push({ uid: d.uid, code: "options_too_many" });
      else if (opts.some((o) => o.length > MAX_OPTION_LENGTH)) errors.push({ uid: d.uid, code: "option_too_long" });
      else if (new Set(opts).size !== opts.length) errors.push({ uid: d.uid, code: "options_duplicate" });
    }
  }
  const tooMany = drafts.length > MAX_REGISTRATION_FIELDS;
  return { ok: errors.length === 0 && !tooMany, errors, tooMany };
}

/**
 * Drafts → wire input, in order. Defaults carry their reserved id and the
 * canonical English label/type (the server forces them anyway); saved custom
 * questions keep their id so stored answers stay attached; new ones omit it.
 */
export function draftsToInputs(drafts: RegistrationFieldDraft[]): RegistrationFormFieldInput[] {
  return drafts.map((d) => {
    const builtin = d.builtin ? BUILTIN_FIELDS.find((b) => b.id === d.builtin) : undefined;
    const input: RegistrationFormFieldInput = {
      label: builtin ? builtin.label : d.label.trim(),
      type: builtin ? builtin.type : d.type,
      required: d.required,
    };
    if (d.id) input.id = d.id;
    if (!builtin && isChoiceType(d.type)) input.options = cleanOptions(d);
    return input;
  });
}

/** Stable fingerprint of the form as it would be saved (for "did it change?"). */
export function formSignature(drafts: RegistrationFieldDraft[]): string {
  return JSON.stringify(draftsToInputs(drafts));
}

/**
 * Tidy the organiser's website address. A missing scheme gets `https://`; only
 * http(s) is accepted. Returns null when it is not a usable web address.
 */
export function normalizeRegistrationLink(raw: string): string | null {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  if (/^[a-z][a-z0-9+.-]*:(\/\/)?/i.test(text) && !/^https?:\/\//i.test(text) && !/^[^/:]+:\d+(\/|$)/.test(text)) {
    return null; // javascript:, data:, mailto:, ftp:// … — only http(s) is accepted
  }
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Drop the stable `CODE: ` prefix the gateway puts on registration refusals
 * (and an operation label before it, e.g. "UpdateEvent: EVENT_…: text").
 */
export function stripErrorCode(message: string): string {
  return message.replace(/^(?:[A-Za-z]+:\s+)?[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+:\s*/, "");
}

/** The stable code at the start of a refusal message, if any. */
export function errorCodeOf(message: string): string | null {
  const m = /^([A-Z][A-Z0-9_]*):\s/.exec(message);
  return m ? m[1] : null;
}
