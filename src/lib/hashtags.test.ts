import { describe, expect, it } from "vitest";
import { filterHashtags, findActiveHashtagQuery, normaliseTag } from "./hashtags";

describe("normaliseTag", () => {
  it.each([["#Jobs", "Jobs"], ["##a", "a"], [" tag ", "tag"], ["", ""], [null, ""]])("%j", (i, o) => {
    expect(normaliseTag(i as never)).toBe(o);
  });
});

describe("findActiveHashtagQuery", () => {
  it("finds a tag at the caret", () => {
    expect(findActiveHashtagQuery("hello #ja", 9)).toEqual({ query: "ja", start: 6 });
    expect(findActiveHashtagQuery("#", 1)).toEqual({ query: "", start: 0 });
    expect(findActiveHashtagQuery("a\n#éco", 6)).toEqual({ query: "éco", start: 2 });
  });
  it("ignores # glued to a word or url fragments", () => {
    expect(findActiveHashtagQuery("page#anchor", 11)).toBeNull();
    expect(findActiveHashtagQuery("no tag here", 11)).toBeNull();
    expect(findActiveHashtagQuery("#tag done", 9)).toBeNull();
  });
});

describe("filterHashtags", () => {
  const tags = [
    { tag: "#Jobs", usageCount: 5 },
    { tag: "jobsearch", usageCount: 9 },
    { tag: "JOBS", usageCount: 1 },
    { tag: "events", usageCount: 3 },
  ];
  it("prefix matches case-insensitively, dedupes, most used first", () => {
    expect(filterHashtags(tags, "jo")).toEqual(["jobsearch", "Jobs"]);
    expect(filterHashtags(tags, "#EV")).toEqual(["events"]);
  });
  it("empty query returns top tags, capped", () => {
    expect(filterHashtags(tags, "", 2)).toEqual(["jobsearch", "Jobs"]);
  });
  it("no match -> empty", () => {
    expect(filterHashtags(tags, "zzz")).toEqual([]);
  });
});
