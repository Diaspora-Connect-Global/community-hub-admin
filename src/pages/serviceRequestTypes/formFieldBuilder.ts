/**
 * Local (draft) model + helpers for the dynamic form-field builder.
 *
 * The builder edits an array of `FormFieldDraft` (each carries a stable client
 * `uid` so React keys survive reordering and key/label edits). On submit the
 * drafts are validated and mapped to the wire shape
 * `ServiceRequestFormFieldInput[]`.
 */
import type {
  ServiceRequestFormField,
  ServiceRequestFormFieldType,
} from "@/services/graphql/serviceRequests/types";
import type { ServiceRequestFormFieldInput } from "@/services/graphql/serviceRequests";

/** The 9 FormFieldType enum values, in a sensible builder order. */
export const FORM_FIELD_TYPES: ServiceRequestFormFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "DATE",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "FILE_UPLOAD",
];

/** Human label for a field type, e.g. FILE_UPLOAD -> "File Upload". */
export function formFieldTypeLabel(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Field types whose options list is required. */
export function typeRequiresOptions(type: ServiceRequestFormFieldType): boolean {
  return type === "SELECT" || type === "RADIO" || type === "CHECKBOX";
}

/** Editable draft of one form field (UI-only `uid`, never sent to the server). */
export interface FormFieldDraft {
  uid: string;
  key: string;
  label: string;
  type: ServiceRequestFormFieldType;
  required: boolean;
  options: string[];
}

let _uidCounter = 0;
/** Generate a stable client-side id for a draft row. */
export function newFieldUid(): string {
  _uidCounter += 1;
  return `f_${Date.now()}_${_uidCounter}`;
}

/** Build a fresh empty draft (used by "Add field"). */
export function emptyFieldDraft(): FormFieldDraft {
  return {
    uid: newFieldUid(),
    key: "",
    label: "",
    type: "TEXT",
    required: false,
    options: [],
  };
}

/** Convert persisted form fields into editable drafts (for the edit dialog). */
export function fieldsToDrafts(
  fields: ServiceRequestFormField[] | undefined,
): FormFieldDraft[] {
  if (!fields) return [];
  return fields.map((f) => ({
    uid: newFieldUid(),
    key: f.key,
    label: f.label,
    type: f.type,
    required: !!f.required,
    options: Array.isArray(f.options) ? [...f.options] : [],
  }));
}

/**
 * Slugify a label into a snake_case key candidate:
 * "Full Name!" -> "full_name". Empty when the label has no usable chars.
 */
export function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Per-field validation error, addressed by draft uid. */
export interface FieldError {
  uid: string;
  label?: string;
  key?: string;
  options?: string;
}

export interface FieldValidationResult {
  ok: boolean;
  errors: FieldError[];
}

/**
 * Validate the whole draft set:
 *   - non-empty label,
 *   - non-empty key, valid slug shape, unique within the set,
 *   - non-empty options (each trimmed non-empty) when the type requires them.
 */
export function validateFieldDrafts(
  drafts: FormFieldDraft[],
): FieldValidationResult {
  const errors: FieldError[] = [];
  const seenKeys = new Map<string, number>();
  for (const d of drafts) {
    seenKeys.set(d.key.trim(), (seenKeys.get(d.key.trim()) ?? 0) + 1);
  }

  for (const d of drafts) {
    const err: FieldError = { uid: d.uid };
    let hasErr = false;

    if (!d.label.trim()) {
      err.label = "Label is required";
      hasErr = true;
    }

    const key = d.key.trim();
    if (!key) {
      err.key = "Key is required";
      hasErr = true;
    } else if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      err.key = "Use lowercase letters, numbers and underscores; start with a letter";
      hasErr = true;
    } else if ((seenKeys.get(key) ?? 0) > 1) {
      err.key = "Key must be unique";
      hasErr = true;
    }

    if (typeRequiresOptions(d.type)) {
      const cleaned = d.options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        err.options = "Add at least one option";
        hasErr = true;
      }
    }

    if (hasErr) errors.push(err);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Map validated drafts to the wire input. Options are trimmed + emptied for
 * non-option field types so we never send stale option arrays.
 */
export function draftsToFormFieldInputs(
  drafts: FormFieldDraft[],
): ServiceRequestFormFieldInput[] {
  return drafts.map((d) => ({
    key: d.key.trim(),
    label: d.label.trim(),
    type: d.type,
    required: d.required,
    options: typeRequiresOptions(d.type)
      ? d.options.map((o) => o.trim()).filter(Boolean)
      : [],
  }));
}
