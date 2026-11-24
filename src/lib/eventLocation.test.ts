import { describe, expect, it } from "vitest";
import { MAX_LOCATION_FIELD, physicalLocationFields, validatePhysicalLocation } from "./eventLocation";

const ok = { venue: "Town Hall", address: "1 High St", city: "Accra", country: "Ghana" };

describe("validatePhysicalLocation", () => {
  it("accepts a complete address", () => {
    expect(validatePhysicalLocation(ok)).toEqual({});
  });
  it("flags every blank or whitespace-only field", () => {
    expect(validatePhysicalLocation({ venue: "", address: "  ", city: "\t", country: "" })).toEqual({
      venue: "required",
      address: "required",
      city: "required",
      country: "required",
    });
  });
  it("flags only the missing one", () => {
    expect(validatePhysicalLocation({ ...ok, city: "" })).toEqual({ city: "required" });
  });
  it("flags over-long values", () => {
    expect(validatePhysicalLocation({ ...ok, address: "a".repeat(MAX_LOCATION_FIELD + 1) })).toEqual({ address: "tooLong" });
  });
});

describe("physicalLocationFields", () => {
  it("trims every value", () => {
    expect(physicalLocationFields({ venue: " Hall ", address: " 1 St ", city: " Accra ", country: " Ghana " })).toEqual({
      venue: "Hall", address: "1 St", city: "Accra", country: "Ghana",
    });
  });
});
