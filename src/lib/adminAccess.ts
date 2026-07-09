/**
 * Client-side RBAC helpers for the Roles & Admins feature.
 *
 * These mirror the backend permission model (admin-service
 * role-permissions.ts). They are a UI convenience/guard only — the backend
 * remains the source of truth and enforces the same rules server-side. Never
 * treat a client-side pass as authorization on its own.
 */
import type { AdminUserInfo } from "@/services/graphql/authentication/adminLogin";
import type { AdminJwtClaims } from "@/services/authentication/adminTokenClaims";

/** Permission that gates the Roles & Admins management surface. */
export const MANAGE_ROLES_PERMISSION = "community:manage_roles";

/** Wildcard permission held by SYSTEM_ADMIN — satisfies any permission check. */
const WILDCARD = "*";

/**
 * Role hierarchy (ascending privilege). An admin may only grant a role at or
 * below their own highest-held role — prevents privilege escalation.
 */
const ROLE_RANK: Record<string, number> = {
  MODERATOR: 0,
  ASSOCIATION_ADMIN: 1,
  COMMUNITY_ADMIN: 2,
  SYSTEM_ADMIN: 3,
};

/**
 * Union of all permissions the current admin holds, from both the JWT claims
 * and the login-established admin record. Lower-cased and de-duplicated.
 */
export function getAdminPermissions(
  claims: AdminJwtClaims | null,
  admin: AdminUserInfo | null,
): string[] {
  const set = new Set<string>();
  for (const p of claims?.permissions ?? []) {
    const v = p?.trim().toLowerCase();
    if (v) set.add(v);
  }
  for (const p of admin?.role?.permissions ?? []) {
    const v = p?.trim().toLowerCase();
    if (v) set.add(v);
  }
  return [...set];
}

/** True when the permission set satisfies `required` (wildcard aware). */
export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes(WILDCARD)) return true;
  return permissions.includes(required.toLowerCase());
}

/** Normalised set of role-type strings the current admin holds. */
export function getAdminRoleTypes(
  claims: AdminJwtClaims | null,
  admin: AdminUserInfo | null,
): string[] {
  const set = new Set<string>();
  for (const r of claims?.roles ?? []) {
    const v = r?.trim().toUpperCase();
    if (v) set.add(v);
  }
  if (claims?.role) set.add(claims.role.trim().toUpperCase());
  if (admin?.role?.name) set.add(admin.role.name.trim().toUpperCase());
  return [...set];
}

/** Highest role rank the current admin holds, or -1 if none recognised. */
export function getAdminMaxRoleRank(
  claims: AdminJwtClaims | null,
  admin: AdminUserInfo | null,
): number {
  return getAdminRoleTypes(claims, admin).reduce(
    (max, r) => Math.max(max, ROLE_RANK[r] ?? -1),
    -1,
  );
}

/**
 * Filter a list of assignable role-type options to those at or below the
 * current admin's own highest role — no privilege escalation. SYSTEM_ADMIN is
 * never assignable from this community-scoped UI regardless.
 */
export function filterAssignableRoleTypes<T extends { value: string }>(
  options: readonly T[],
  claims: AdminJwtClaims | null,
  admin: AdminUserInfo | null,
): T[] {
  const maxRank = getAdminMaxRoleRank(claims, admin);
  return options.filter((o) => {
    if (o.value === "SYSTEM_ADMIN") return false;
    const rank = ROLE_RANK[o.value] ?? Number.MAX_SAFE_INTEGER;
    return rank <= maxRank;
  });
}
