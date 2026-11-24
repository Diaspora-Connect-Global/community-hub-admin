import { describe, it, expect } from "vitest";
import { usableCoverImageUrl } from "./eventCoverImage";

describe("usableCoverImageUrl", () => {
  it("keeps http(s) URLs", () => {
    expect(usableCoverImageUrl("https://storage.googleapis.com/b/o.jpg?X=1")).toBe(
      "https://storage.googleapis.com/b/o.jpg?X=1",
    );
    expect(usableCoverImageUrl("  http://example.com/a.png ")).toBe("http://example.com/a.png");
  });
  it("drops blob:, data:, javascript:, relative and empty values", () => {
    expect(usableCoverImageUrl("blob:https://community.diaspoplug.com/43213c4a")).toBeUndefined();
    expect(usableCoverImageUrl("data:image/png;base64,AAAA")).toBeUndefined();
    expect(usableCoverImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(usableCoverImageUrl("/uploads/a.png")).toBeUndefined();
    expect(usableCoverImageUrl("")).toBeUndefined();
    expect(usableCoverImageUrl(null)).toBeUndefined();
    expect(usableCoverImageUrl(undefined)).toBeUndefined();
  });
});
