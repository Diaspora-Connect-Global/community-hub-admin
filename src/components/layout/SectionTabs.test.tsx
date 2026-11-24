// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const eventsOnly = { value: false };
vi.mock("@/hooks/useEventsOnly", () => ({
  useEventsOnly: () => ({ eventsOnly: eventsOnly.value, loading: false, communityId: "c-1" }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

import { SectionTabs } from "./SectionTabs";

const renderAt = (path: string, ui: React.ReactElement) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe("SectionTabs", () => {
  afterEach(() => {
    cleanup();
    eventsOnly.value = false;
  });

  it("links every page of the section and marks the open one", () => {
    renderAt("/support/case-types", <SectionTabs section="support" labelKey="nav.cases" />);
    const nav = screen.getByRole("navigation", { name: "nav.cases" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/cases", "/support/case-types"]);
    expect(within(nav).getByRole("link", { name: "sectionTabs.support.caseTypes" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(within(nav).getByRole("link", { name: "sectionTabs.support.cases" }).getAttribute("aria-current")).toBeNull();
  });

  it("shows a count beside a tab only when there is something waiting", () => {
    const { rerender } = renderAt(
      "/members",
      <SectionTabs section="members" labelKey="nav.members" badges={{ "/members/requests": 3 }} />,
    );
    expect(screen.getByRole("link", { name: "sectionTabs.members.requests 3" })).toBeTruthy();

    rerender(
      <MemoryRouter initialEntries={["/members"]}>
        <SectionTabs section="members" labelKey="nav.members" badges={{ "/members/requests": 0 }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "sectionTabs.members.requests" })).toBeTruthy();
  });

  it("hides the registries tab from an events-only community, which may not open it", () => {
    eventsOnly.value = true;
    renderAt("/members", <SectionTabs section="members" labelKey="nav.members" />);
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(["/members", "/members/requests"]);
  });
});
