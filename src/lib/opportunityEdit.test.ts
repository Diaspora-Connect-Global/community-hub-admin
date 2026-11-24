import { describe, expect, it, vi } from "vitest";
import { saveOpportunityEdit, toDateInputValue } from "./opportunityEdit";

const mk = (updateImpl?: () => Promise<unknown>) => {
  const calls: string[] = [];
  return {
    calls,
    steps: {
      draft: vi.fn(async () => void calls.push("draft")),
      update: vi.fn(async () => {
        calls.push("update");
        if (updateImpl) await updateImpl();
      }),
      publish: vi.fn(async () => void calls.push("publish")),
    },
  };
};

describe("saveOpportunityEdit", () => {
  it("edits a draft in place", async () => {
    const { calls, steps } = mk();
    await saveOpportunityEdit("1", "DRAFT", steps);
    expect(calls).toEqual(["update"]);
  });
  it("drafts, updates and republishes a live listing", async () => {
    const { calls, steps } = mk();
    await saveOpportunityEdit("1", "PUBLISHED", steps);
    expect(calls).toEqual(["draft", "update", "publish"]);
  });
  it("leaves a closed listing as a draft after the edit", async () => {
    const { calls, steps } = mk();
    await saveOpportunityEdit("1", "CLOSED", steps);
    expect(calls).toEqual(["draft", "update"]);
  });
  it("republishes a live listing when the update is refused, and rethrows", async () => {
    const { calls, steps } = mk(async () => {
      throw new Error("bad");
    });
    await expect(saveOpportunityEdit("1", "PUBLISHED", steps)).rejects.toThrow("bad");
    expect(calls).toEqual(["draft", "update", "publish"]);
  });
  it("refuses archived listings without calling anything", async () => {
    const { calls, steps } = mk();
    await expect(saveOpportunityEdit("1", "ARCHIVED", steps)).rejects.toThrow();
    expect(calls).toEqual([]);
  });
});

describe("toDateInputValue", () => {
  it("trims a timestamp to a date", () => {
    expect(toDateInputValue("2026-12-01T00:00:00.000Z")).toBe("2026-12-01");
    expect(toDateInputValue(undefined)).toBe("");
  });
});
