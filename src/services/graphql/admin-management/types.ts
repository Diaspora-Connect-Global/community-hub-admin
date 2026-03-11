// TypeScript types for the Admin Management service

export interface AdminRoleAssignment {
  id: string;
  roleType: string;
  scopeType: string;
  scopeId: string;
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
  roleType: string;
  scopeType: string;
  scopeId: string;
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
