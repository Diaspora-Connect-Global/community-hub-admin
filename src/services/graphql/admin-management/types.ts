// TypeScript types for the Admin Management service

export interface AdminRoleAssignment {
  id: string;
  roleType: string;
  scopeType: string;
  scopeId: string;
  /** Present when this assignment is a CUSTOM role definition rather than a built-in role type. */
  roleDefinitionId?: string | null;
}

export interface AdminAccount {
  id: string;
  email: string;
  status: string;
  adminType: string;
  roles: AdminRoleAssignment[];
  permissions: string[];
}

export interface GetAdminByIdResponse {
  success: boolean;
  message?: string;
  admin?: AdminAccount;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  scopeType?: string;
  scopeId?: string;
  permissions: string[];
  isSystem: boolean;
}

export interface GetRoleDefinitionsResponse {
  success: boolean;
  message?: string;
  roles: RoleDefinition[];
}

export interface CreateAdminInput {
  email: string;
  password: string;
  /** e.g. "COMMUNITY_ADMIN" | "MODERATOR" */
  adminType: string;
  /** Must be "COMMUNITY" */
  scopeType: string;
  scopeId: string;
}

export interface CreateAdminResponse {
  success: boolean;
  message?: string;
  admin?: AdminAccount;
}

export interface UpdateAdminStatusInput {
  adminId: string;
  /** "active" | "inactive" */
  status: string;
  reason?: string;
}

export interface AdminCommonResponse {
  success: boolean;
  message?: string;
}

export interface AssignAdminRoleInput {
  adminId: string;
  scopeType: string;
  scopeId: string;
  /** Built-in role type. Send EITHER this OR `roleDefinitionId`, not both. */
  roleType?: string;
  /** Custom role definition id. Send EITHER this OR `roleType`, not both. */
  roleDefinitionId?: string;
}

export interface AssignAdminRoleResponse {
  success: boolean;
  message?: string;
  assignment?: AdminRoleAssignment;
}

export interface CreateRoleDefinitionInput {
  name: string;
  description?: string;
  scopeType: string;
  scopeId: string;
  permissions: string[];
}

export interface ListAdminsResponse {
  admins: AdminAccount[];
  total: number;
  page: number;
  limit: number;
}
