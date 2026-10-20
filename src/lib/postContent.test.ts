import { describe, expect, it } from "vitest";
import { canSubmitPost, hasMeaningfulPostText, isPostEmptyError } from "./postContent";

describe("never an empty post", () => {
  it.each([undefined, null, "", "   ", "\n\t", " ", "​﻿", "<p></p>", "&nbsp;"])("%j is empty", (t) => {
    expect(hasMeaningfulPostText(t as never)).toBe(false);
    expect(canSubmitPost(t as never, 0)).toBe(false);
  });
  it.each(["hello", "@maria", "#tag", "​x"])("%j is content", (t) => {
    expect(canSubmitPost(t, 0)).toBe(true);
  });
  it("an attachment alone is enough", () => {
    expect(canSubmitPost("   ", 1)).toBe(true);
  });
  it("recognises the server POST_EMPTY refusal", () => {
    const errors = [{ message: "x", extensions: { code: "POST_EMPTY" } }];
    const err = { errors };
    expect(isPostEmptyError({ response: { errors } })).toBe(true);
    expect(isPostEmptyError(err)).toBe(true);
    expect(isPostEmptyError(new Error("boom"))).toBe(false);
  });
});
