/**
 * UI-level types, constants and mappers for the Directory admin pages.
 *
 * These sit on top of the raw GraphQL service-layer types
 * (DirectoryListing, DirectoryListingSummary, *Input) and capture the
 * flat form-state used by DirectoryFormModal.
 */
import type {
  DirectoryListing,
  DirectoryListingKind,
  CreateDirectoryListingInput,
  UpdateDirectoryListingInput,
  DirectoryListingContactInput,
  DirectoryListingLocationInput,
} from "@/services/graphql/directory";

export const PAGE_SIZE = 20;

export const LISTING_KINDS: DirectoryListingKind[] = [
  "PERSON",
  "ORGANIZATION",
  "BUSINESS",
  "PROFESSIONAL",
  "INSTITUTION",
];

/** Publication-status options for the list filter. */
export const LISTING_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNPUBLISHED",
  "ARCHIVED",
] as const;

/** Tailwind classes for the publication-status badge. */
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  PUBLISHED: "bg-success/10 text-success",
  UNPUBLISHED: "bg-warning/10 text-warning",
  ARCHIVED: "bg-muted text-muted-foreground",
};

/** Tailwind classes for the verification-status badge. */
export const VERIFICATION_COLORS: Record<string, string> = {
  UNVERIFIED: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-warning/10 text-warning",
  VERIFIED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

/** Flat shape backing both the create and the edit form. */
export interface DirectoryFormState {
  displayName: string;
  legalName: string;
  listingKind: DirectoryListingKind;
  categoryId: string;
  summary: string;
  description: string;
  country: string;
  // contact
  email: string;
  phone: string;
  website: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  // location
  locationLabel: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  locationCountry: string;
  postalCode: string;
  // free-text comma/space separated, mapped to arrays at submit time
  languages: string;
  tags: string;
}

export const initialDirectoryForm: DirectoryFormState = {
  displayName: "",
  legalName: "",
  listingKind: "ORGANIZATION",
  categoryId: "",
  summary: "",
  description: "",
  country: "",
  email: "",
  phone: "",
  website: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  twitter: "",
  locationLabel: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  locationCountry: "",
  postalCode: "",
  languages: "",
  tags: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trim → empty string becomes undefined (so we don't send blank strings). */
function trimOrUndef(v: string): string | undefined {
  const t = v.trim();
  return t ? t : undefined;
}

/** Split a comma / newline separated string into a clean string[] (deduped). */
export function splitList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

/** Build the optional contact input, or undefined when every field is blank. */
function buildContactInput(
  form: DirectoryFormState,
): DirectoryListingContactInput | undefined {
  const contact: DirectoryListingContactInput = {
    email: trimOrUndef(form.email),
    phone: trimOrUndef(form.phone),
    website: trimOrUndef(form.website),
    whatsapp: trimOrUndef(form.whatsapp),
    facebook: trimOrUndef(form.facebook),
    instagram: trimOrUndef(form.instagram),
    linkedin: trimOrUndef(form.linkedin),
    twitter: trimOrUndef(form.twitter),
  };
  return Object.values(contact).some((v) => v !== undefined)
    ? contact
    : undefined;
}

/** Build the optional location input, or undefined when every field is blank. */
function buildLocationInput(
  form: DirectoryFormState,
): DirectoryListingLocationInput | undefined {
  const location: DirectoryListingLocationInput = {
    label: trimOrUndef(form.locationLabel),
    addressLine1: trimOrUndef(form.addressLine1),
    addressLine2: trimOrUndef(form.addressLine2),
    city: trimOrUndef(form.city),
    region: trimOrUndef(form.region),
    country: trimOrUndef(form.locationCountry),
    postalCode: trimOrUndef(form.postalCode),
  };
  return Object.values(location).some((v) => v !== undefined)
    ? location
    : undefined;
}

/** Map form-state onto a CreateDirectoryListingInput (owner injected by caller). */
export function formToCreateInput(
  form: DirectoryFormState,
): Omit<CreateDirectoryListingInput, "ownerType" | "ownerEntityId"> {
  const languages = splitList(form.languages);
  const tags = splitList(form.tags);
  return {
    listingKind: form.listingKind,
    categoryId: form.categoryId,
    displayName: form.displayName.trim(),
    legalName: trimOrUndef(form.legalName),
    summary: trimOrUndef(form.summary),
    description: trimOrUndef(form.description),
    contact: buildContactInput(form),
    location: buildLocationInput(form),
    country: trimOrUndef(form.country),
    languages: languages.length ? languages : undefined,
    tags: tags.length ? tags : undefined,
  };
}

/** Map form-state onto an UpdateDirectoryListingInput for the given listing id. */
export function formToUpdateInput(
  id: string,
  form: DirectoryFormState,
): UpdateDirectoryListingInput {
  const languages = splitList(form.languages);
  const tags = splitList(form.tags);
  return {
    id,
    listingKind: form.listingKind,
    categoryId: form.categoryId,
    displayName: form.displayName.trim(),
    legalName: trimOrUndef(form.legalName),
    summary: trimOrUndef(form.summary),
    description: trimOrUndef(form.description),
    contact: buildContactInput(form),
    location: buildLocationInput(form),
    country: trimOrUndef(form.country),
    languages,
    tags,
  };
}

/** Hydrate the form from a full listing (edit mode). */
export function listingToForm(listing: DirectoryListing): DirectoryFormState {
  const c = listing.contact ?? {};
  const l = listing.location ?? {};
  return {
    displayName: listing.displayName ?? "",
    legalName: listing.legalName ?? "",
    listingKind: (listing.listingKind as DirectoryListingKind) || "ORGANIZATION",
    categoryId: listing.categoryId ?? "",
    summary: listing.summary ?? "",
    description: listing.description ?? "",
    country: listing.country ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    website: c.website ?? "",
    whatsapp: c.whatsapp ?? "",
    facebook: c.facebook ?? "",
    instagram: c.instagram ?? "",
    linkedin: c.linkedin ?? "",
    twitter: c.twitter ?? "",
    locationLabel: l.label ?? "",
    addressLine1: l.addressLine1 ?? "",
    addressLine2: l.addressLine2 ?? "",
    city: l.city ?? "",
    region: l.region ?? "",
    locationCountry: l.country ?? "",
    postalCode: l.postalCode ?? "",
    languages: (listing.languages ?? []).join(", "),
    tags: (listing.tags ?? []).join(", "),
  };
}
