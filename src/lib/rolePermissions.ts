/**
 * Custom-role permissions in the console — pure helpers (no React).
 *
 * The permission CATALOGUE and the ready-made role TEMPLATES are not defined
 * here: they come from the backend (`entityRoleCatalogue`, admin-service's one
 * definition). This file only knows how to group them for display, how to
 * validate a role form, and which page needs which permission.
 *
 * Hiding a menu entry is a convenience, never the control: the gateway refuses
 * anything a custom role does not grant.
 */
import type { AdminJwtClaims } from "@/services/authentication/adminTokenClaims";
import type { AdminUserInfo } from "@/services/graphql/authentication/adminLogin";

export interface CataloguePermission {
  key: string;
  module: string;
}

export interface CatalogueTemplate {
  key: string;
  permissions: string[];
}

export interface RoleCatalogue {
  permissions: CataloguePermission[];
  templates: CatalogueTemplate[];
}

export interface CatalogueModule {
  module: string;
  permissions: CataloguePermission[];
}

/** Catalogue permissions grouped by module, keeping the backend's order. */
export function groupCatalogue(catalogue: RoleCatalogue | null | undefined): CatalogueModule[] {
  const groups: CatalogueModule[] = [];
  for (const p of catalogue?.permissions ?? []) {
    let group = groups.find((g) => g.module === p.module);
    if (!group) {
      group = { module: p.module, permissions: [] };
      groups.push(group);
    }
    group.permissions.push(p);
  }
  return groups;
}

/** The permissions a template pre-fills, limited to keys the catalogue knows. */
export function templatePermissions(catalogue: RoleCatalogue | null | undefined, templateKey: string): string[] {
  const known = new Set((catalogue?.permissions ?? []).map((p) => p.key));
  const template = catalogue?.templates.find((t) => t.key === templateKey);
  return (template?.permissions ?? []).filter((k) => known.has(k));
}

/** Toggle one permission; returns a new array in catalogue order. */
export function togglePermission(
  catalogue: RoleCatalogue | null | undefined,
  selected: readonly string[],
  key: string,
): string[] {
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  const order = (catalogue?.permissions ?? []).map((p) => p.key);
  return order.filter((k) => next.has(k));
}

/** Select or clear every permission of one module. */
export function setModulePermissions(
  catalogue: RoleCatalogue | null | undefined,
  selected: readonly string[],
  module: string,
  on: boolean,
): string[] {
  const next = new Set(selected);
  for (const p of catalogue?.permissions ?? []) {
    if (p.module !== module) continue;
    if (on) next.add(p.key);
    else next.delete(p.key);
  }
  return (catalogue?.permissions ?? []).map((p) => p.key).filter((k) => next.has(k));
}

export type RoleFormError = "nameRequired" | "permissionsRequired";

/** A role needs a name and at least one permission. */
export function validateRoleForm(form: { name: string; permissions: readonly string[] }): RoleFormError | null {
  if (!form.name.trim()) return "nameRequired";
  if (form.permissions.length === 0) return "permissionsRequired";
  return null;
}

// ── What the signed-in admin may use ────────────────────────────────────────

/** Built-in roles keep the full console, exactly as before custom roles were enforced. */
const FULL_CONSOLE_ROLES = new Set(["SYSTEM_ADMIN", "SUPER_ADMIN", "COMMUNITY_ADMIN", "ASSOCIATION_ADMIN", "MODERATOR"]);

export interface ConsoleAccess {
  /** A built-in admin role: everything stays visible (the server still decides). */
  full: boolean;
  /** Permissions of the admin's custom role(s) in its own community. */
  permissions: ReadonlySet<string>;
}

type ClaimsWithEntityPermissions = AdminJwtClaims & { entityPermissions?: string[] };

export function getConsoleAccess(
  claims: ClaimsWithEntityPermissions | null,
  admin: AdminUserInfo | null,
): ConsoleAccess {
  const roles = new Set(
    [...(claims?.roles ?? []), claims?.role, admin?.role?.name]
      .filter((r): r is string => !!r)
      .map((r) => r.trim().toUpperCase()),
  );
  const isCustomOnly = roles.has("CUSTOM") && ![...roles].some((r) => FULL_CONSOLE_ROLES.has(r));
  const permissions = new Set(
    (claims?.entityPermissions ?? []).map((p) => String(p).trim().toLowerCase()).filter(Boolean),
  );
  return { full: !isCustomOnly, permissions };
}

export function hasConsolePermission(access: ConsoleAccess, required: string | readonly string[]): boolean {
  if (access.full) return true;
  const list = typeof required === "string" ? [required] : required;
  return list.some((p) => access.permissions.has(p));
}

/**
 * Which permission(s) open each console page (any one of them). Pages not
 * listed (the dashboard, the admin's own profile) need none.
 */
export const PAGE_PERMISSIONS: ReadonlyArray<{ path: string; any: readonly string[] }> = [
  { path: "/posts", any: ["posts.publish", "posts.moderate"] },
  { path: "/events", any: ["events.manage"] },
  { path: "/opportunities", any: ["opportunities.manage"] },
  { path: "/marketplace", any: ["marketplace.manage"] },
  { path: "/groups", any: ["groups.manage"] },
  { path: "/members/requests", any: ["members.approve"] },
  { path: "/members", any: ["members.approve", "members.moderate"] },
  { path: "/registries", any: ["registries.manage"] },
  { path: "/associations", any: ["associations.manage"] },
  { path: "/service-request-types", any: ["service_requests.types"] },
  { path: "/service-requests", any: ["service_requests.manage"] },
  { path: "/resources", any: ["resources.manage"] },
  { path: "/directory", any: ["directory.manage"] },
  { path: "/support/case-types", any: ["support_cases.types"] },
  { path: "/cases", any: ["support_cases.manage"] },
  { path: "/reports", any: ["reports.manage"] },
  { path: "/settings", any: ["settings.manage"] },
  { path: "/roles-admins", any: ["roles.manage"] },
  { path: "/audit", any: ["audit.view"] },
];

function pathCovers(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** The permissions a route needs — the most specific listed path wins. */
export function permissionsForPath(pathname: string): readonly string[] | null {
  let best: { length: number; any: readonly string[] } | null = null;
  for (const entry of PAGE_PERMISSIONS) {
    if (pathCovers(pathname, entry.path) && (!best || entry.path.length > best.length)) {
      best = { length: entry.path.length, any: entry.any };
    }
  }
  return best?.any ?? null;
}

export function canOpenPath(access: ConsoleAccess, pathname: string): boolean {
  const required = permissionsForPath(pathname);
  return !required || hasConsolePermission(access, required);
}

/**
 * Roles & admins page: built-in admins as before (the legacy manage-roles
 * permission), a custom role with roles.manage. Managing admin ACCOUNTS
 * (creating admins, assigning or revoking roles, (de)activating) stays with
 * the built-in admin — the backend refuses it for custom roles.
 */
export function canManageAdminAccounts(access: ConsoleAccess): boolean {
  return access.full;
}
