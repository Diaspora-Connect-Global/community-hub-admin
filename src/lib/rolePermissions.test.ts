import { describe, it, expect } from "vitest";
import en from "@/i18n/locales/en.json";
import de from "@/i18n/locales/de.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import nl from "@/i18n/locales/nl.json";
import {
  canManageAdminAccounts,
  canOpenPath,
  getConsoleAccess,
  groupCatalogue,
  hasConsolePermission,
  permissionsForPath,
  setModulePermissions,
  templatePermissions,
  togglePermission,
  validateRoleForm,
  type RoleCatalogue,
} from "./rolePermissions";
import { filterNavItemsByAccess } from "./navSections";

/** What the backend's entityRoleCatalogue returns (admin-service's one definition). */
const CATALOGUE: RoleCatalogue = {
  permissions: [
    { key: "posts.publish", module: "posts" },
    { key: "posts.moderate", module: "posts" },
    { key: "events.manage", module: "events" },
    { key: "opportunities.manage", module: "opportunities" },
    { key: "marketplace.manage", module: "marketplace" },
    { key: "groups.manage", module: "groups" },
    { key: "members.approve", module: "members" },
    { key: "members.moderate", module: "members" },
    { key: "registries.manage", module: "members" },
    { key: "associations.manage", module: "associations" },
    { key: "service_requests.manage", module: "service_requests" },
    { key: "service_requests.types", module: "service_requests" },
    { key: "resources.manage", module: "resources" },
    { key: "directory.manage", module: "directory" },
    { key: "support_cases.manage", module: "support" },
    { key: "support_cases.types", module: "support" },
    { key: "reports.manage", module: "reports" },
    { key: "settings.manage", module: "settings" },
    { key: "roles.manage", module: "roles" },
    { key: "audit.view", module: "audit" },
  ],
  templates: [
    { key: "co_administrator", permissions: [] },
    { key: "commerce_manager", permissions: ["marketplace.manage", "events.manage", "opportunities.manage"] },
    { key: "content_publisher", permissions: ["posts.publish"] },
    { key: "resources_requests_manager", permissions: ["resources.manage", "service_requests.manage", "service_requests.types", "directory.manage"] },
    { key: "community_moderator", permissions: ["members.moderate", "reports.manage", "posts.moderate"] },
    { key: "support_agent", permissions: ["support_cases.manage", "not.in.catalogue"] },
  ],
};

const customClaims = (entityPermissions: string[]) => ({
  role: "CUSTOM",
  roles: ["CUSTOM"],
  scopeType: "COMMUNITY",
  scopeId: "c-1",
  entityPermissions,
});

describe("catalogue and templates", () => {
  it("groups permissions by module in the backend's order", () => {
    const groups = groupCatalogue(CATALOGUE);
    expect(groups.map((g) => g.module)).toEqual([
      "posts", "events", "opportunities", "marketplace", "groups", "members", "associations",
      "service_requests", "resources", "directory", "support", "reports", "settings", "roles", "audit",
    ]);
    expect(groups.find((g) => g.module === "members")?.permissions.map((p) => p.key)).toEqual([
      "members.approve", "members.moderate", "registries.manage",
    ]);
  });

  it("a template pre-fills its permissions, never unknown keys", () => {
    expect(templatePermissions(CATALOGUE, "commerce_manager")).toEqual(["marketplace.manage", "events.manage", "opportunities.manage"]);
    expect(templatePermissions(CATALOGUE, "support_agent")).toEqual(["support_cases.manage"]);
    expect(templatePermissions(CATALOGUE, "missing")).toEqual([]);
  });

  it("toggles keep catalogue order; a module can be selected or cleared at once", () => {
    let sel = togglePermission(CATALOGUE, [], "events.manage");
    sel = togglePermission(CATALOGUE, sel, "posts.publish");
    expect(sel).toEqual(["posts.publish", "events.manage"]);
    expect(togglePermission(CATALOGUE, sel, "events.manage")).toEqual(["posts.publish"]);
    expect(setModulePermissions(CATALOGUE, [], "support", true)).toEqual(["support_cases.manage", "support_cases.types"]);
    expect(setModulePermissions(CATALOGUE, ["support_cases.manage", "audit.view"], "support", false)).toEqual(["audit.view"]);
  });

  it("a role needs a name and at least one permission", () => {
    expect(validateRoleForm({ name: " ", permissions: ["events.manage"] })).toBe("nameRequired");
    expect(validateRoleForm({ name: "Events", permissions: [] })).toBe("permissionsRequired");
    expect(validateRoleForm({ name: "Events", permissions: ["events.manage"] })).toBeNull();
  });

  it("every permission, module and template is translated in all five languages", () => {
    for (const [lang, dict] of Object.entries({ en, de, es, fr, nl }) as Array<[string, any]>) {
      for (const p of CATALOGUE.permissions) {
        const [mod, action] = p.key.split(".");
        expect(dict.rolePermissions?.[mod]?.[action]?.label, `${lang} ${p.key}`).toBeTruthy();
        expect(dict.rolePermissions?.[mod]?.[action]?.description, `${lang} ${p.key}`).toBeTruthy();
        expect(dict.roleModules?.[p.module], `${lang} ${p.module}`).toBeTruthy();
      }
      for (const t of CATALOGUE.templates) {
        expect(dict.roleTemplates?.[t.key]?.name, `${lang} ${t.key}`).toBeTruthy();
        expect(dict.roleTemplates?.[t.key]?.description, `${lang} ${t.key}`).toBeTruthy();
      }
    }
  });
});

describe("console access", () => {
  it("built-in admins keep the whole console", () => {
    for (const role of ["COMMUNITY_ADMIN", "MODERATOR", "SYSTEM_ADMIN"]) {
      const access = getConsoleAccess({ role, roles: [role] }, null);
      expect(access.full).toBe(true);
      expect(canOpenPath(access, "/roles-admins")).toBe(true);
      expect(canManageAdminAccounts(access)).toBe(true);
    }
    // A built-in admin who also holds a custom role is still a built-in admin.
    expect(getConsoleAccess({ roles: ["COMMUNITY_ADMIN", "CUSTOM"] }, null).full).toBe(true);
  });

  it("a custom role opens only the pages its permissions cover", () => {
    const access = getConsoleAccess(customClaims(["events.manage", "support_cases.types"]), null);
    expect(access.full).toBe(false);
    expect(canOpenPath(access, "/")).toBe(true);
    expect(canOpenPath(access, "/profile")).toBe(true);
    expect(canOpenPath(access, "/events")).toBe(true);
    expect(canOpenPath(access, "/support/case-types")).toBe(true);
    expect(canOpenPath(access, "/cases")).toBe(false);
    expect(canOpenPath(access, "/cases/abc")).toBe(false);
    expect(canOpenPath(access, "/settings")).toBe(false);
    expect(canManageAdminAccounts(access)).toBe(false);
  });

  it("the most specific route rule wins", () => {
    expect(permissionsForPath("/members/requests")).toEqual(["members.approve"]);
    expect(permissionsForPath("/members")).toEqual(["members.approve", "members.moderate"]);
    expect(permissionsForPath("/service-request-types")).toEqual(["service_requests.types"]);
    expect(permissionsForPath("/groups/g-1")).toEqual(["groups.manage"]);
  });

  it("a custom role with no permissions claim sees no module page", () => {
    const access = getConsoleAccess({ role: "CUSTOM", roles: ["CUSTOM"] }, null);
    expect(hasConsolePermission(access, "posts.publish")).toBe(false);
    expect(canOpenPath(access, "/posts")).toBe(false);
  });
});

describe("permission-based navigation", () => {
  const items = [
    { id: "dashboard", path: "/" },
    { id: "events", path: "/events" },
    { id: "members", path: "/members", section: "members" as const },
    { id: "cases", path: "/cases", section: "support" as const },
    { id: "settings", path: "/settings", section: "settings" as const },
  ];

  it("hides entries the role does not cover; a section links to its first open tab", () => {
    const access = getConsoleAccess(customClaims(["support_cases.types", "audit.view", "members.approve"]), null);
    const visible = filterNavItemsByAccess(items, (p) => canOpenPath(access, p));
    expect(visible.map((i) => [i.id, i.path])).toEqual([
      ["dashboard", "/"],
      ["members", "/members"],
      ["cases", "/support/case-types"],
      ["settings", "/audit"],
    ]);
  });

  it("a section whose every tab is hidden disappears", () => {
    const access = getConsoleAccess(customClaims(["events.manage"]), null);
    const visible = filterNavItemsByAccess(items, (p) => canOpenPath(access, p));
    expect(visible.map((i) => i.id)).toEqual(["dashboard", "events"]);
  });

  it("a built-in admin keeps every entry unchanged", () => {
    const access = getConsoleAccess({ role: "COMMUNITY_ADMIN", roles: ["COMMUNITY_ADMIN"] }, null);
    expect(filterNavItemsByAccess(items, (p) => canOpenPath(access, p))).toEqual(items);
  });
});
