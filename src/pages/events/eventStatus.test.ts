import { describe, it, expect } from "vitest";
import { normalizeEventStatus } from "./types";

describe("normalizeEventStatus", () => {
  it("reads the API's upper-case enum names (GraphQL sends PUBLISHED, not published)", () => {
    expect(normalizeEventStatus("PUBLISHED")).toBe("published");
    expect(normalizeEventStatus("CANCELLED")).toBe("cancelled");
    expect(normalizeEventStatus("COMPLETED")).toBe("completed");
    expect(normalizeEventStatus("DRAFT")).toBe("draft");
  });

  it("still accepts lower case and the US spelling of cancelled", () => {
    expect(normalizeEventStatus("published")).toBe("published");
    expect(normalizeEventStatus("canceled")).toBe("cancelled");
  });

  it("treats anything unknown or missing as a draft", () => {
    expect(normalizeEventStatus("CLOSED")).toBe("draft");
    expect(normalizeEventStatus(undefined)).toBe("draft");
    expect(normalizeEventStatus("")).toBe("draft");
  });
});
