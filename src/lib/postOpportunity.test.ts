import { describe, expect, it } from "vitest";
import {
  buildOpportunityInput, defaultOpportunityDraft, majorToMinor, opportunityErrorKey,
  parseOpportunityDraft, titleFromText, validateOpportunityDraft,
} from "./postOpportunity";

describe("majorToMinor", () => {
  it.each([["12", 1200], ["12.5", 1250], ["12.50", 1250], ["0.05", 5], ["2500,75", 250075], [" 7 ", 700]])("%j", (i, o) => {
    expect(majorToMinor(i)).toBe(o);
  });
  it.each(["", "abc", "-1", "1.234", "1e5", "1.", ".5"])("rejects %j", (i) => {
    expect(majorToMinor(i)).toBeNull();
  });
});

describe("defaults", () => {
  it("prefills title from the first line (<=200) and description from the post", () => {
    const d = defaultOpportunityDraft(`\n  ${"x".repeat(300)}\nsecond`, "GRANT");
    expect(d.title).toHaveLength(200);
    expect(d.description).toContain("second");
    expect(d.type).toBe("GRANT");
    expect(titleFromText("   ")).toBe("");
  });
});

describe("validate + build", () => {
  const base = () => ({ ...defaultOpportunityDraft("Hiring a nurse\nApply now", "EMPLOYMENT") });
  it("valid default draft builds a minimal input, converting pay once", () => {
    const d = { ...base(), payMin: "1000", payMax: "1500.5", currency: "USD", audience: "MEMBERS" as const };
    expect(validateOpportunityDraft(d)).toEqual([]);
    const i = buildOpportunityInput(d, "ASSOCIATION", "e1");
    expect(i).toMatchObject({
      ownerType: "ASSOCIATION", ownerId: "e1", type: "EMPLOYMENT", category: "EMPLOYMENT_CAREER",
      visibility: "ASSOCIATION_ONLY", applicationMethod: "IN_PLATFORM_FORM",
      compensationMin: 100000, compensationMax: 150050, compensationCurrency: "USD", compensationType: "SALARY",
    });
    expect(i).not.toHaveProperty("externalLink");
    expect(buildOpportunityInput(base(), "COMMUNITY", "c").visibility).toBe("PUBLIC");
    expect(buildOpportunityInput({ ...base(), audience: "MEMBERS" }, "COMMUNITY", "c").visibility).toBe("COMMUNITY_ONLY");
  });
  it("sends no compensation fields when no pay is given", () => {
    const i = buildOpportunityInput(base(), "COMMUNITY", "c");
    expect(i).not.toHaveProperty("compensationMin");
    expect(i).not.toHaveProperty("compensationType");
  });
  it("flags problems", () => {
    expect(validateOpportunityDraft({ ...base(), title: " " })).toContain("title");
    expect(validateOpportunityDraft({ ...base(), applicationMethod: "EXTERNAL_LINK", externalLink: "javascript:alert(1)" })).toContain("link");
    expect(validateOpportunityDraft({ ...base(), applicationMethod: "EXTERNAL_LINK", externalLink: "https://a.org/x" })).toEqual([]);
    expect(validateOpportunityDraft({ ...base(), applicationMethod: "EMAIL_REQUEST", applicationEmail: "nope" })).toContain("email");
    expect(validateOpportunityDraft({ ...base(), payMin: "5", payMax: "2" })).toContain("payRange");
    expect(validateOpportunityDraft({ ...base(), payMin: "x" })).toContain("pay");
    expect(validateOpportunityDraft({ ...base(), deadline: "2020-01-01" })).toContain("deadline");
    expect(validateOpportunityDraft({ ...base(), deadline: "2999-01-01" })).toEqual([]);
  });
});

describe("parseOpportunityDraft", () => {
  it("rejects junk and sanitises unknown enums", () => {
    expect(parseOpportunityDraft(null)).toBeNull();
    expect(parseOpportunityDraft("x")).toBeNull();
    expect(parseOpportunityDraft({ title: "", description: "d" })).toBeNull();
    const d = parseOpportunityDraft({ title: "t", description: "d", type: "HACK", currency: "XXX", deliveryMode: 5, deadline: "soon" });
    expect(d).toMatchObject({ type: "EMPLOYMENT", currency: "GHS", deliveryMode: "", deadline: "" });
  });
});

describe("opportunityErrorKey", () => {
  it("maps known codes", () => {
    expect(opportunityErrorKey("OPPORTUNITY_POST_OWNER_MISMATCH")).toBe("ownerMismatch");
    expect(opportunityErrorKey("OPPORTUNITY_POST_FAILED")).toBe("failed");
    expect(opportunityErrorKey("RATE_LIMITED")).toBe("rateLimited");
    expect(opportunityErrorKey("X")).toBeNull();
  });
});
