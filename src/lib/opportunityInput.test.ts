import { describe, expect, it } from "vitest";
import { mapOpportunityTextFields } from "./opportunityInput";

describe("mapOpportunityTextFields", () => {
  it("maps requirements -> eligibilityCriteria and responsibilities -> scope", () => {
    expect(mapOpportunityTextFields({ requirements: " 3 yrs ", responsibilities: " lead " })).toEqual({
      eligibilityCriteria: "3 yrs",
      scope: "lead",
    });
  });
  it("omits blank values and never emits the removed field names", () => {
    const out = mapOpportunityTextFields({ requirements: "  ", responsibilities: "" });
    expect(out).toEqual({});
    const full = mapOpportunityTextFields({ requirements: "a", responsibilities: "b" });
    expect(full).not.toHaveProperty("requirements");
    expect(full).not.toHaveProperty("responsibilities");
  });
});
