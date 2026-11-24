/**
 * Physical-location helpers for the event form. The backend refuses a physical
 * event unless venue, address, city and country are all present (non-blank),
 * so the form asks for all four and sends them trimmed.
 */

export const MAX_LOCATION_FIELD = 200;

export type LocationField = "venue" | "address" | "city" | "country";
export const LOCATION_FIELDS: readonly LocationField[] = ["venue", "address", "city", "country"];

export interface PhysicalLocationInput {
  venue: string;
  address: string;
  city: string;
  country: string;
}

/** Field -> error key (i18n key under events.location.errors), only for problems. */
export type LocationErrors = Partial<Record<LocationField, "required" | "tooLong">>;

export function validatePhysicalLocation(v: PhysicalLocationInput): LocationErrors {
  const errors: LocationErrors = {};
  for (const f of LOCATION_FIELDS) {
    const value = (v[f] ?? "").trim();
    if (!value) errors[f] = "required";
    else if (value.length > MAX_LOCATION_FIELD) errors[f] = "tooLong";
  }
  return errors;
}

/** Trimmed wire fields for `locationDetails` of a physical event. */
export function physicalLocationFields(v: PhysicalLocationInput): PhysicalLocationInput {
  return {
    venue: (v.venue ?? "").trim(),
    address: (v.address ?? "").trim(),
    city: (v.city ?? "").trim(),
    country: (v.country ?? "").trim(),
  };
}
