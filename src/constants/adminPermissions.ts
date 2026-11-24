/**
 * The custom-role permission catalogue and the ready-made role templates are
 * NOT defined in the console: they come from the backend (`entityRoleCatalogue`,
 * admin-service's single definition). Labels and descriptions are translated
 * under `rolePermissions.<key>`, `roleModules.<module>` and
 * `roleTemplates.<key>` in the locale files.
 */

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
