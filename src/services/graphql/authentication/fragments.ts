/**
 * GraphQL fragments for admin auth types.
 * Fragment names and fields match the schema; reuse across queries/mutations.
 */

/** Fields for admin role, used in admin user and elsewhere */
export const ADMIN_ROLE_FRAGMENT = `
  fragment AdminRoleInfo on AdminRoleInfo {
    id
    name
    scopeType
    permissions
    description
  }
`;

/** Fields for admin user; includes role via fragment */
export const ADMIN_USER_FRAGMENT = `
  fragment AdminUserInfo on AdminUserInfo {
    id
    userId
    scopeType
    scopeId
    isActive
    role {
      ...AdminRoleInfo
    }
  }
`;
