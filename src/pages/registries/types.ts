/**
 * UI-level form state, initial values, mappers and dynamic-field helpers for
 * the Registries admin pages. These sit on top of the raw GraphQL service-layer
 * types in `@/services/graphql/registry`.
 */
import type {
  Registry,
  RegistryFormField,
  RegistryFormFieldInput,
  RegistryFormFieldType,
  RegistryEntry,
  CreateRegistryInput,
  UpdateRegistryInput,
  AddRegistryEntryInput,
  UpdateRegistryEntryInput,
} from "@/services/graphql/registry";

// ── Field-type catalogue ─────────────────────────────────────────────────────

export const FIELD_TYPES: RegistryFormFieldType[] = [
  "TEXT",
  "NUMBER",
  "DATE",
  "EMAIL",
  "TEXTAREA",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "FILE_UPLOAD",
];

/** Field types whose responses are chosen from a fixed `options` list. */
export const OPTION_FIELD_TYPES: ReadonlySet<RegistryFormFieldType> = new Set([
  "SELECT",
  "RADIO",
  "CHECKBOX",
]);

export function fieldTypeNeedsOptions(type: string): boolean {
  return OPTION_FIELD_TYPES.has(type as RegistryFormFieldType);
}

// ── Registry form state ──────────────────────────────────────────────────────

/** A single dynamic field row in the registry field-schema builder. */
export interface FieldSchemaRow {
  /** Local row id for React keys (not sent to the API). */
  rowId: string;
  key: string;
  label: string;
  type: RegistryFormFieldType;
  required: boolean;
  /** Comma-free list; only meaningful for SELECT / RADIO / CHECKBOX. */
  options: string[];
}

export interface RegistryFormState {
  name: string;
  code: string;
  description: string;
  /** Required by the schema (ID!) — staff supplies the registry-type id. */
  registryTypeId: string;
  selfRegistrationEnabled: boolean;
  requiresApproval: boolean;
  casePrefix: string;
  fieldSchema: FieldSchemaRow[];
}

export const initialRegistryForm: RegistryFormState = {
  name: "",
  code: "",
  description: "",
  registryTypeId: "",
  selfRegistrationEnabled: false,
  requiresApproval: true,
  casePrefix: "",
  fieldSchema: [],
};

let rowCounter = 0;
export function newFieldRow(): FieldSchemaRow {
  rowCounter += 1;
  return {
    rowId: `fld-${Date.now()}-${rowCounter}`,
    key: "",
    label: "",
    type: "TEXT",
    required: false,
    options: [],
  };
}

function fieldFromRow(row: FieldSchemaRow): RegistryFormFieldInput {
  return {
    key: row.key.trim(),
    label: row.label.trim(),
    type: row.type,
    required: row.required,
    options: fieldTypeNeedsOptions(row.type)
      ? row.options.map((o) => o.trim()).filter(Boolean)
      : undefined,
  };
}

function rowFromField(field: RegistryFormField): FieldSchemaRow {
  rowCounter += 1;
  return {
    rowId: `fld-${Date.now()}-${rowCounter}`,
    key: field.key,
    label: field.label,
    type: (field.type as RegistryFormFieldType) || "TEXT",
    required: field.required,
    options: field.options ?? [],
  };
}

/** Populate the edit form from a fetched registry. */
export function registryToForm(reg: Registry): RegistryFormState {
  return {
    name: reg.name,
    code: reg.code,
    description: reg.description ?? "",
    registryTypeId: reg.registryTypeId ?? "",
    selfRegistrationEnabled: reg.selfRegistrationEnabled,
    requiresApproval: reg.requiresApproval,
    casePrefix: reg.casePrefix ?? "",
    fieldSchema: (reg.fieldSchema ?? []).map(rowFromField),
  };
}

/** Build a `createRegistry` input for the given owner scope. */
export function formToCreateInput(
  form: RegistryFormState,
  ownerType: CreateRegistryInput["ownerType"],
  ownerEntityId: string,
): CreateRegistryInput {
  return {
    ownerType,
    ownerEntityId,
    registryTypeId: form.registryTypeId.trim(),
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    selfRegistrationEnabled: form.selfRegistrationEnabled,
    requiresApproval: form.requiresApproval,
    casePrefix: form.casePrefix.trim() || undefined,
    fieldSchema: form.fieldSchema.map(fieldFromRow),
  };
}

/** Build an `updateRegistry` input (registry-type and code are immutable). */
export function formToUpdateInput(
  id: string,
  form: RegistryFormState,
): UpdateRegistryInput {
  return {
    id,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    selfRegistrationEnabled: form.selfRegistrationEnabled,
    requiresApproval: form.requiresApproval,
    casePrefix: form.casePrefix.trim() || undefined,
    fieldSchema: form.fieldSchema.map(fieldFromRow),
  };
}

// ── Entry form state ─────────────────────────────────────────────────────────

/** Map of dynamic field key -> response value (string for all field types;
 *  CHECKBOX serializes a comma list, FILE_UPLOAD stores the uploaded URL). */
export type FieldResponses = Record<string, string>;

export interface RegistryEntryFormState {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  /** Comma-separated tags input -> string[] at submit. */
  tagsInput: string;
  fieldResponses: FieldResponses;
}

export const initialRegistryEntryForm: RegistryEntryFormState = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  tagsInput: "",
  fieldResponses: {},
};

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsToInput(tags: string[]): string {
  return (tags ?? []).join(", ");
}

/** Safely parse the JSON `fieldResponsesJson` string into a flat string map. */
export function parseFieldResponses(json?: string | null): FieldResponses {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return {};
    const out: FieldResponses = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v == null) continue;
      out[k] = Array.isArray(v) ? v.map(String).join(", ") : String(v);
    }
    return out;
  } catch {
    return {};
  }
}

/** Serialize the field-response map back into the JSON wire string. */
export function serializeFieldResponses(responses: FieldResponses): string {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(responses)) {
    const trimmed = v?.trim?.() ?? "";
    if (trimmed) cleaned[k] = trimmed;
  }
  return JSON.stringify(cleaned);
}

/** Populate the entry edit form from a fetched entry. */
export function entryToForm(entry: RegistryEntry): RegistryEntryFormState {
  return {
    fullName: entry.fullName ?? "",
    email: entry.email ?? "",
    phone: entry.phone ?? "",
    country: entry.country ?? "",
    city: entry.city ?? "",
    tagsInput: tagsToInput(entry.tags),
    fieldResponses: parseFieldResponses(entry.fieldResponsesJson),
  };
}

export function entryFormToAddInput(
  registryId: string,
  form: RegistryEntryFormState,
): AddRegistryEntryInput {
  return {
    registryId,
    fullName: form.fullName.trim() || undefined,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    country: form.country.trim() || undefined,
    city: form.city.trim() || undefined,
    tags: parseTags(form.tagsInput),
    fieldResponsesJson: serializeFieldResponses(form.fieldResponses),
  };
}

export function entryFormToUpdateInput(
  id: string,
  form: RegistryEntryFormState,
): UpdateRegistryEntryInput {
  return {
    id,
    fullName: form.fullName.trim() || undefined,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    country: form.country.trim() || undefined,
    city: form.city.trim() || undefined,
    tags: parseTags(form.tagsInput),
    fieldResponsesJson: serializeFieldResponses(form.fieldResponses),
  };
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const REGISTRY_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  ACTIVE: "bg-success/10 text-success",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export const VERIFICATION_STATUS_BADGE: Record<string, string> = {
  UNVERIFIED: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-primary/10 text-primary",
  VERIFIED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

export const MEMBERSHIP_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-primary/10 text-primary",
  ACTIVE: "bg-success/10 text-success",
  INACTIVE: "bg-muted text-muted-foreground",
};

export function titleCase(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
