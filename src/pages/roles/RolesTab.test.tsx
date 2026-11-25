// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const COMMUNITY = "11111111-1111-4111-8111-111111111111";

const catalogue = {
  permissions: [
    { key: "posts.publish", module: "posts" },
    { key: "events.manage", module: "events" },
    { key: "opportunities.manage", module: "opportunities" },
  ],
  templates: [
    { key: "content_publisher", permissions: ["posts.publish", "events.manage"] },
    { key: "support_agent", permissions: ["opportunities.manage"] },
  ],
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/hooks/useConsoleAccess", () => ({
  useConsoleAccess: () => ({ full: true, permissions: new Set<string>() }),
}));
vi.mock("@/services/graphql/admin-management", () => ({
  getEntityRoleCatalogue: vi.fn(async () => catalogue),
  getRoleDefinitions: vi.fn(async () => ({
    success: true,
    roles: [
      {
        id: "r1",
        name: "roleTemplates.support_agent.name",
        description: "",
        scopeType: "COMMUNITY",
        scopeId: COMMUNITY,
        permissions: ["opportunities.manage"],
        isSystem: false,
      },
    ],
  })),
  createRoleDefinition: vi.fn(),
  updateRoleDefinition: vi.fn(),
  deleteRoleDefinition: vi.fn(),
}));

import { RolesTab } from "./RolesTab";

const renderTab = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RolesTab communityId={COMMUNITY} />
    </QueryClientProvider>,
  );

const readyMade = async () =>
  screen.findByRole("region", { name: "rolesAdmins.roles.readyMade.title" });

describe("RolesTab — ready-made roles", () => {
  afterEach(cleanup);

  it("lists every ready-made role on the page, with its permissions", async () => {
    renderTab();
    const section = await readyMade();
    expect(within(section).getByText("roleTemplates.content_publisher.name")).toBeTruthy();
    expect(within(section).getByText("roleTemplates.support_agent.name")).toBeTruthy();
    expect(within(section).getByText("rolePermissions.posts.publish.label")).toBeTruthy();
    expect(within(section).getAllByRole("button", { name: "rolesAdmins.roles.readyMade.useLabel" })).toHaveLength(2);
  });

  it("marks a ready-made role the community already added", async () => {
    renderTab();
    const section = await readyMade();
    expect(within(section).getAllByText("rolesAdmins.roles.readyMade.inUse")).toHaveLength(1);
  });

  it("opens the create dialog pre-filled from the chosen ready-made role", async () => {
    renderTab();
    const section = await readyMade();
    fireEvent.click(within(section).getAllByRole("button", { name: "rolesAdmins.roles.readyMade.useLabel" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText("rolesAdmins.roles.form.name") as HTMLInputElement).value).toBe(
      "roleTemplates.content_publisher.name",
    );
    const checked = (key: string) =>
      within(dialog).getByRole("checkbox", { name: new RegExp(`rolePermissions.${key}.label`) }).getAttribute("aria-checked");
    expect(checked("posts.publish")).toBe("true");
    expect(checked("events.manage")).toBe("true");
    expect(checked("opportunities.manage")).toBe("false");
  });

  it("New Role still opens an empty form", async () => {
    renderTab();
    await readyMade();
    fireEvent.click(screen.getByRole("button", { name: /rolesAdmins.roles.create/ }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText("rolesAdmins.roles.form.name") as HTMLInputElement).value).toBe("");
  });
});
