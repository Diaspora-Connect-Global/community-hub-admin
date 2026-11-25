// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * "Add admin" with a custom role: one picker offers the built-in roles and this
 * community's custom roles; a custom role sends `roleDefinitionId` (the new
 * admin then holds only that role), a built-in role sends exactly what it
 * always did; the password rule matches admin-service (at least 12 characters).
 */
const createAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/services/graphql/admin-management", () => ({
  createAdmin,
  listAdmins: vi.fn(),
  getAdminById: vi.fn(),
  getRoleDefinitions: vi.fn(),
  assignAdminRole: vi.fn(),
  revokeAdminRole: vi.fn(),
  updateAdminStatus: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => (o && "min" in o ? `${k}:${o.min}` : k),
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/graphqlErrors", () => ({
  graphqlErrorMessage: (_e: unknown, fallback: string) => fallback,
  safeServerMessage: (m: string | undefined, fallback: string) => m || fallback,
}));

import {
  ADMIN_PASSWORD_MIN_LENGTH,
  CreateAdminDialog,
  buildCreateAdminInput,
  isAdminPasswordLongEnough,
} from "./AdminsTab";

const COMMUNITY = "c-1";
const ROLE_TYPES = [
  { value: "COMMUNITY_ADMIN", label: "Community Admin" },
  { value: "MODERATOR", label: "Moderator" },
];
const CUSTOM_ROLES = [
  { id: "def-events", name: "Events team", permissions: ["events.manage"], isSystem: false },
];
const GOOD_PASSWORD = "correct-horse-battery";

beforeAll(() => {
  // Radix Select needs these in jsdom.
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
  (globalThis as unknown as Record<string, unknown>).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  createAdmin.mockReset();
});

function renderDialog(customRoles = CUSTOM_ROLES) {
  const onCreated = vi.fn();
  render(
    <CreateAdminDialog
      open
      onOpenChange={() => {}}
      communityId={COMMUNITY}
      roleTypes={ROLE_TYPES}
      customRoles={customRoles}
      onCreated={onCreated}
    />,
  );
  return { onCreated };
}

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("rolesAdmins.admins.form.email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("rolesAdmins.admins.form.password"), { target: { value: password } });
}

const submit = () => fireEvent.click(screen.getByRole("button", { name: "rolesAdmins.admins.form.submit" }));

describe("buildCreateAdminInput", () => {
  it("a custom role sends roleDefinitionId and no built-in role type", () => {
    const input = buildCreateAdminInput({
      email: " new@example.org ",
      password: GOOD_PASSWORD,
      selection: "custom:def-events",
      communityId: COMMUNITY,
    });
    expect(input).toEqual({
      email: "new@example.org",
      password: GOOD_PASSWORD,
      adminType: "CUSTOM",
      scopeType: "COMMUNITY",
      scopeId: COMMUNITY,
      roleDefinitionId: "def-events",
    });
    expect(ROLE_TYPES.map((r) => r.value)).not.toContain(input.adminType);
  });

  it("a built-in role sends exactly the old input, with no roleDefinitionId", () => {
    const input = buildCreateAdminInput({
      email: "mod@example.org",
      password: GOOD_PASSWORD,
      selection: "builtin:MODERATOR",
      communityId: COMMUNITY,
    });
    expect(input).toEqual({
      email: "mod@example.org",
      password: GOOD_PASSWORD,
      adminType: "MODERATOR",
      scopeType: "COMMUNITY",
      scopeId: COMMUNITY,
    });
    expect("roleDefinitionId" in input).toBe(false);
  });
});

describe("admin password rule", () => {
  it("matches admin-service: at least 12 characters, no character-class rule", () => {
    expect(ADMIN_PASSWORD_MIN_LENGTH).toBe(12);
    expect(isAdminPasswordLongEnough("a".repeat(11))).toBe(false);
    expect(isAdminPasswordLongEnough("a".repeat(12))).toBe(true);
  });
});

describe("CreateAdminDialog", () => {
  it("creates an admin with a custom role picked from the custom-roles group", async () => {
    createAdmin.mockResolvedValue({
      success: true,
      admin: { id: "new", email: "new@example.org", status: "ACTIVE", adminType: "MODERATOR", roles: [], permissions: [] },
    });
    const { onCreated } = renderDialog();
    fill("new@example.org", GOOD_PASSWORD);

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    // Both groups, with translated labels.
    expect(screen.getByText("rolesAdmins.admins.roleGroups.builtIn")).toBeTruthy();
    expect(screen.getByText("rolesAdmins.admins.roleGroups.custom")).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Events team" }));

    submit();
    await waitFor(() => expect(createAdmin).toHaveBeenCalledTimes(1));
    expect(createAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ roleDefinitionId: "def-events", adminType: "CUSTOM", scopeId: COMMUNITY }),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });

  it("the built-in path is unchanged: default role, no roleDefinitionId", async () => {
    createAdmin.mockResolvedValue({ success: true, admin: { id: "x", email: "a@b.org", roles: [] } });
    renderDialog();
    fill("a@b.org", GOOD_PASSWORD);
    submit();
    await waitFor(() => expect(createAdmin).toHaveBeenCalledTimes(1));
    expect(createAdmin).toHaveBeenCalledWith({
      email: "a@b.org",
      password: GOOD_PASSWORD,
      adminType: "COMMUNITY_ADMIN",
      scopeType: "COMMUNITY",
      scopeId: COMMUNITY,
    });
  });

  it("refuses an 11-character password before calling the server, and the hint says 12", () => {
    renderDialog();
    expect(screen.getByText("rolesAdmins.admins.form.passwordHint:12")).toBeTruthy();
    fill("a@b.org", "a".repeat(11));
    submit();
    expect(screen.getByRole("alert").textContent).toBe("rolesAdmins.admins.form.passwordRequired:12");
    expect(createAdmin).not.toHaveBeenCalled();
  });

  it("points to the Roles tab when the community has no custom roles yet", () => {
    renderDialog([]);
    expect(screen.getByText("rolesAdmins.admins.form.noCustomRoles")).toBeTruthy();
  });

  it("does not show that hint when custom roles exist", () => {
    renderDialog();
    expect(screen.queryByText("rolesAdmins.admins.form.noCustomRoles")).toBeNull();
  });
});
