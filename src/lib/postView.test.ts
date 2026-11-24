import { describe, expect, it } from "vitest";
import {
  displayNameOrFallback,
  initialsOf,
  mergePage,
  normaliseReactionKind,
  relativeTime,
  segmentPostText,
  toReactionSummary,
} from "./postView";

describe("toReactionSummary", () => {
  it("keeps total when pre-migration likes carry no type", () => {
    expect(toReactionSummary({ total: 10, happy: 3, hopeful: 2, sad: 1 })).toEqual({ total: 10, happy: 3, hopeful: 2, sad: 1 });
  });
  it("never reports a total below the breakdown, and tolerates junk", () => {
    expect(toReactionSummary({ total: 1, happy: 2, hopeful: 1, sad: 0 }).total).toBe(3);
    expect(toReactionSummary(null)).toEqual({ total: 0, happy: 0, hopeful: 0, sad: 0 });
    expect(toReactionSummary({ total: -4, happy: Number.NaN }).total).toBe(0);
  });
});

describe("normaliseReactionKind", () => {
  it("shows an untyped like as Happy", () => {
    expect(normaliseReactionKind("")).toBe("HAPPY");
    expect(normaliseReactionKind(null)).toBe("HAPPY");
    expect(normaliseReactionKind("sad")).toBe("SAD");
    expect(normaliseReactionKind("HOPEFUL")).toBe("HOPEFUL");
  });
});

describe("displayNameOrFallback", () => {
  it("prefers the name, then the handle, then the fallback (never an id)", () => {
    expect(displayNameOrFallback(" Ama K ", "ama", "Member")).toBe("Ama K");
    expect(displayNameOrFallback("", "@ama", "Member")).toBe("@ama");
    expect(displayNameOrFallback(undefined, null, "Member")).toBe("Member");
  });
  it("initials", () => {
    expect(initialsOf("Ama Kofi Mensah")).toBe("AM");
    expect(initialsOf("@ama")).toBe("A");
    expect(initialsOf("  ")).toBe("?");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  it("formats recent times relatively", () => {
    expect(relativeTime("2026-11-24T09:00:00Z", "en", now)).toBe("3 hours ago");
    expect(relativeTime("2026-11-24T11:59:50Z", "en", now)).toBe("now");
  });
  it("falls back to a date for old posts and '' for invalid input", () => {
    expect(relativeTime("2026-01-02T12:00:00Z", "en", now)).toMatch(/2026/);
    expect(relativeTime("nope", "en", now)).toBe("");
  });
});

describe("segmentPostText", () => {
  it("splits mentions and hashtags, leaves emails and html as text", () => {
    const s = segmentPostText("Hi @maria see #Ghana2026 now <b>x</b> a@b.com");
    expect(s.filter((x) => x.kind !== "text").map((x) => x.value)).toEqual(["@maria", "#Ghana2026"]);
    expect(s.map((x) => x.value).join("")).toBe("Hi @maria see #Ghana2026 now <b>x</b> a@b.com");
  });
  it("handles empty text", () => {
    expect(segmentPostText("")).toEqual([]);
  });
});

describe("mergePage", () => {
  it("appends only unseen ids", () => {
    expect(mergePage([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }]).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});
