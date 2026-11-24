import { describe, it, expect, vi } from "vitest";
import { createFormPatcher } from "./formPatcher";

describe("createFormPatcher", () => {
  it("keeps both of two patches made back to back (file, then preview)", () => {
    const latest = { current: { banner: "", bannerFile: null as File | null, title: "Gala" } };
    const onChange = vi.fn();
    const set = createFormPatcher(latest, onChange);
    const file = new File(["x"], "cover.png", { type: "image/png" });

    set({ bannerFile: file });
    set({ banner: "blob:preview" });

    expect(onChange).toHaveBeenLastCalledWith({ banner: "blob:preview", bannerFile: file, title: "Gala" });
  });

  it("starts from the newest form the parent rendered", () => {
    const latest = { current: { title: "Old" } };
    const onChange = vi.fn();
    const set = createFormPatcher(latest, onChange);
    latest.current = { title: "New" };
    set({});
    expect(onChange).toHaveBeenLastCalledWith({ title: "New" });
  });
});
