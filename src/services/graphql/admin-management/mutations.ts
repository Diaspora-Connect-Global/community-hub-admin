import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  CreateAdminInput,
  CreateAdminResponse,
  UpdateAdminStatusInput,
  AdminCommonResponse,
  AssignAdminRoleInput,
  AssignAdminRoleResponse,
  CreateRoleDefinitionInput,
} from "./types";

export async function createAdmin(input: CreateAdminInput): Promise<CreateAdminResponse> {
  const mutation = `
    mutation CreateAdmin($input: CreateAdminInput!) {
      createAdmin(input: $input) {
        success
        message
        admin {
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
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createAdmin: CreateAdminResponse }>(
    mutation,
    { input }
  );
  return data.createAdmin;
}

export async function updateAdminStatus(
  input: UpdateAdminStatusInput
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation UpdateAdminStatus($input: UpdateAdminStatusInput!) {
      updateAdminStatus(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ updateAdminStatus: AdminCommonResponse }>(
    mutation,
    { input }
  );
  return data.updateAdminStatus;
}

export async function assignAdminRole(
  input: AssignAdminRoleInput
): Promise<AssignAdminRoleResponse> {
  const mutation = `
    mutation AssignAdminRole($input: AssignAdminRoleInput!) {
      assignAdminRole(input: $input) {
        success
        message
        assignment {
          id
          roleType
          scopeType
          scopeId
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ assignAdminRole: AssignAdminRoleResponse }>(
    mutation,
    { input }
  );
  return data.assignAdminRole;
}

export async function revokeAdminRole(
  roleAssignmentId: string,
  reason?: string
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation RevokeAdminRole($roleAssignmentId: String!, $reason: String) {
      revokeAdminRole(roleAssignmentId: $roleAssignmentId, reason: $reason) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ revokeAdminRole: AdminCommonResponse }>(mutation, {
    roleAssignmentId,
    reason,
  });
  return data.revokeAdminRole;
}

export async function createRoleDefinition(
  input: CreateRoleDefinitionInput
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation CreateRoleDefinition($input: CreateRoleDefinitionInput!) {
      createRoleDefinition(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ createRoleDefinition: AdminCommonResponse }>(
    mutation,
    { input }
  );
  return data.createRoleDefinition;
}
