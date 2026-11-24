// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

const eventsOnly = { value: false };
vi.mock("@/hooks/useEventsOnly", () => ({
  useEventsOnly: () => ({ eventsOnly: eventsOnly.value, loading: false, communityId: "" }),
}));
vi.mock("@/services/graphql/community/queries", () => ({ getCommunity: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

import { AdminSidebar } from "./AdminSidebar";

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <AdminSidebar />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );

const menu = () => screen.getByRole("navigation", { name: "navSection.menu" });
const menuLinks = () => within(menu()).getAllByRole("link");

describe("AdminSidebar", () => {
  afterEach(() => {
    cleanup();
    eventsOnly.value = false;
  });

  it("groups the menu under headings, in order, with one entry per merged section", () => {
    renderAt("/");
    expect(within(menu()).getAllByText(/^navSection\./).map((h) => h.textContent)).toEqual([
      "navSection.content",
      "navSection.people",
      "navSection.memberServices",
      "navSection.support",
    ]);
    expect(menuLinks().map((l) => l.getAttribute("href"))).toEqual([
      "/",
      "/posts",
      "/events",
      "/opportunities",
      "/marketplace",
      "/groups",
      "/members",
      "/associations",
      "/service-requests",
      "/resources",
      "/directory",
      "/cases",
      "/reports",
      "/settings",
    ]);
  });

  it.each([
    ["/support/case-types", "/cases"],
    ["/cases/abc", "/cases"],
    ["/service-request-types", "/service-requests"],
    ["/members/requests", "/members"],
    ["/registries/r-1", "/members"],
    ["/roles-admins", "/settings"],
    ["/audit", "/settings"],
    ["/groups/g-1", "/groups"],
  ])("on %s it highlights only the %s entry", (path, entry) => {
    renderAt(path);
    const active = menuLinks().filter((l) => l.getAttribute("aria-current") === "page");
    expect(active.map((l) => l.getAttribute("href"))).toEqual([entry]);
  });

  it("marks the open entry without a coloured left border", () => {
    renderAt("/cases");
    const active = menuLinks().find((l) => l.getAttribute("aria-current") === "page");
    expect(active?.className).not.toMatch(/border-l/);
  });

  it("keeps only events, members and settings for an events-only community", () => {
    eventsOnly.value = true;
    renderAt("/");
    expect(menuLinks().map((l) => l.getAttribute("href"))).toEqual(["/", "/events", "/members", "/settings"]);
    expect(within(menu()).queryByText("navSection.memberServices")).toBeNull();
  });
});
