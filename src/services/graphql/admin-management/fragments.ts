export const ADMIN_ROLE_ASSIGNMENT_FRAGMENT = `
  fragment AdminRoleAssignmentFields on AdminRoleAssignmentType {
    id
    roleType
    scopeType
    scopeId
  }
`;

export const ADMIN_ACCOUNT_FRAGMENT = `
  fragment AdminAccountFields on AdminAccountType {
    id
    email
    status
    adminType
    roles {
      id
      roleType
      scopeType
      scopeId
    }
    permissions
  }
`;
