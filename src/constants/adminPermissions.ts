/**
 * Canonical catalog of admin permission keys used when defining custom roles for
 * a community.
 *
 * IMPORTANT: These keys are the contract with the backend and MUST mirror the
 * admin-service permission keys defined in
 *   backend/services/admin-service/src/domain/value-objects/role-permissions.ts
 * (DEFAULT_PERMISSIONS). If the backend adds/renames a permission key, update
 * this list to match — the strings are sent verbatim in
 * `CreateRoleDefinitionInput.permissions`.
 *
 * Only the community-relevant permissions are listed here (this admin hub is
 * scoped to a single community). System-wide permissions (e.g. the SYSTEM_ADMIN
 * wildcard '*') are intentionally excluded.
 */

export interface AdminPermissionDef {
  /** Stable key sent to / received from the backend. */
  key: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Logical group used to organise the checkboxes. */
  group: string;
}

/** Ordered catalog of assignable permissions. Order drives display order. */
export const ADMIN_PERMISSIONS: readonly AdminPermissionDef[] = [
  // Community management
  { key: "community:read", label: "View community", group: "Community" },
  { key: "community:write", label: "Edit community settings", group: "Community" },
  { key: "community:manage_members", label: "Manage members", group: "Community" },
  { key: "community:moderate_content", label: "Moderate content", group: "Community" },
  { key: "community:manage_roles", label: "Manage roles & admins", group: "Community" },
  // Reports
  { key: "reports:read", label: "View reports", group: "Reports" },
  { key: "reports:resolve", label: "Resolve reports", group: "Reports" },
  // Moderation
  { key: "moderation:ban_user", label: "Ban users", group: "Moderation" },
  { key: "moderation:warn_user", label: "Warn users", group: "Moderation" },
  { key: "moderation:delete_post", label: "Delete posts", group: "Moderation" },
  { key: "moderation:delete_comment", label: "Delete comments", group: "Moderation" },
];

/** All permission keys, in catalog order. */
export const ALL_PERMISSION_KEYS: readonly string[] = ADMIN_PERMISSIONS.map((p) => p.key);

/** Ordered list of distinct permission groups. */
export const PERMISSION_GROUPS: readonly string[] = Array.from(
  new Set(ADMIN_PERMISSIONS.map((p) => p.group)),
);

/** Look up a human label for a permission key, falling back to the raw key. */
export function permissionLabel(key: string): string {
  return ADMIN_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}

/**
 * Admin / role types that make sense to assign within a community scope.
 * Values are the backend `AdminRoleType` enum strings (see
 * admin-service/.../admin-role-type.enum.ts). Used both as `adminType` when
 * creating an admin and as `roleType` when assigning a role.
 */
export interface AdminRoleTypeOption {
  value: string;
  label: string;
}

export const COMMUNITY_ADMIN_TYPES: readonly AdminRoleTypeOption[] = [
  { value: "COMMUNITY_ADMIN", label: "Community Admin" },
  { value: "MODERATOR", label: "Moderator" },
];

/** Human label for a role/admin type string, falling back to the raw value. */
export function roleTypeLabel(value: string): string {
  return COMMUNITY_ADMIN_TYPES.find((r) => r.value === value)?.label ?? value;
}
