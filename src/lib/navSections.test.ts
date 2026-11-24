import { describe, it, expect } from "vitest";
import { SECTION_TABS, activeTabPath, pathMatches, sectionPaths } from "./navSections";

describe("pathMatches", () => {
  it("matches a route and the pages below it", () => {
    expect(pathMatches("/cases", "/cases")).toBe(true);
    expect(pathMatches("/cases/abc", "/cases")).toBe(true);
  });

  it("does not match a route that merely starts with the same letters", () => {
    expect(pathMatches("/casesx", "/cases")).toBe(false);
    expect(pathMatches("/service-request-types", "/service-requests")).toBe(false);
  });

  it("matches the dashboard only on itself", () => {
    expect(pathMatches("/", "/")).toBe(true);
    expect(pathMatches("/members", "/")).toBe(false);
  });
});

describe("activeTabPath", () => {
  it("picks the most specific tab, so join requests is not shown as the members list", () => {
    expect(activeTabPath(SECTION_TABS.members, "/members")).toBe("/members");
    expect(activeTabPath(SECTION_TABS.members, "/members/requests")).toBe("/members/requests");
  });

  it("keeps a tab selected on its detail pages", () => {
    expect(activeTabPath(SECTION_TABS.members, "/registries/r-1")).toBe("/registries");
    expect(activeTabPath(SECTION_TABS.support, "/cases/c-9")).toBe("/cases");
  });

  it("returns null outside the section", () => {
    expect(activeTabPath(SECTION_TABS.settings, "/posts")).toBeNull();
  });

  it("honours a tab's extra paths", () => {
    const tabs = [{ path: "/a", labelKey: "a", extraPaths: ["/legacy-a"] }, { path: "/b", labelKey: "b" }];
    expect(activeTabPath(tabs, "/legacy-a/1")).toBe("/a");
  });
});

describe("sections", () => {
  it("cover every page that used to have its own menu entry", () => {
    const all = Object.values(SECTION_TABS).flatMap((tabs) => tabs.map((t) => t.path));
    for (const path of ["/support/case-types", "/service-request-types", "/registries", "/roles-admins", "/audit"]) {
      expect(all).toContain(path);
    }
  });

  it("never put one route in two sections", () => {
    const all = Object.values(SECTION_TABS).flatMap((tabs) => tabs.map((t) => t.path));
    expect(new Set(all).size).toBe(all.length);
  });

  it("list the routes the sidebar entry lights up on", () => {
    expect(sectionPaths("settings")).toEqual(["/settings", "/roles-admins", "/audit"]);
  });
});
