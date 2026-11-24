import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en.json";
import de from "@/i18n/locales/de.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import nl from "@/i18n/locales/nl.json";

const flat = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`],
  );

describe("postView strings exist in every locale", () => {
  const keys = flat(en.postView as Record<string, unknown>);
  it.each([["de", de], ["es", es], ["fr", fr], ["nl", nl]])("%s has all postView keys, translated", (_n, loc) => {
    const got = flat(loc.postView as Record<string, unknown>);
    expect(got.sort()).toEqual([...keys].sort());
    expect((loc.dashboard as unknown as Record<string, string>).totalPosts).toBeTruthy();
    expect((loc.dashboard as unknown as Record<string, string>).totalPosts).not.toBe(en.dashboard.totalPosts);
  });
  it("no raw ids/placeholders for people", () => {
    expect(keys.some((k) => /userId|authorId/i.test(k))).toBe(false);
  });
});
