import { beforeEach, describe, expect, it } from "vitest";
import { clearAllDrafts, clearDraft, draftKey, DRAFT_PREFIX, loadDraft, saveDraft } from "./composerDraft";

beforeEach(() => localStorage.clear());

describe("draftKey", () => {
  it("is per admin and per owner, and opaque", () => {
    const a = draftKey("admin-1", "comm-1");
    expect(a).toMatch(new RegExp(`^${DRAFT_PREFIX}`));
    expect(a).not.toContain("admin-1");
    expect(a).not.toContain("comm-1");
    expect(draftKey("admin-2", "comm-1")).not.toBe(a);
    expect(draftKey("admin-1", "comm-2")).not.toBe(a);
    expect(draftKey("admin-1", "comm-1")).toBe(a);
  });
  it("is null when identity is unknown", () => {
    expect(draftKey(null, "c")).toBeNull();
    expect(draftKey("a", "")).toBeNull();
  });
});

describe("draft storage", () => {
  const key = draftKey("a", "c");
  it("round-trips", () => {
    saveDraft(key, { text: "hi #x", visibility: "PUBLIC", mentions: [] });
    expect(loadDraft(key)?.text).toBe("hi #x");
    clearDraft(key);
    expect(loadDraft(key)).toBeNull();
  });
  it("expires old drafts and ignores corrupt data", () => {
    localStorage.setItem(key!, JSON.stringify({ text: "old", savedAt: Date.now() - 15 * 86400000 }));
    expect(loadDraft(key)).toBeNull();
    localStorage.setItem(key!, "{nope");
    expect(loadDraft(key)).toBeNull();
  });
  it("sign-out removes every draft but nothing else", () => {
    saveDraft(draftKey("a", "c"), { text: "1", visibility: "", mentions: [] });
    saveDraft(draftKey("b", "c"), { text: "2", visibility: "", mentions: [] });
    localStorage.setItem("other", "keep");
    clearAllDrafts();
    expect(loadDraft(draftKey("a", "c"))).toBeNull();
    expect(loadDraft(draftKey("b", "c"))).toBeNull();
    expect(localStorage.getItem("other")).toBe("keep");
  });
  it("null key is a no-op", () => {
    expect(() => saveDraft(null, { text: "x", visibility: "", mentions: [] })).not.toThrow();
    expect(loadDraft(null)).toBeNull();
  });
});
