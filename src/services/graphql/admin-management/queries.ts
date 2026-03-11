import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type { GetAdminByIdResponse, GetRoleDefinitionsResponse } from "./types";

export async function getAdminById(adminId: string): Promise<GetAdminByIdResponse> {
  const query = `
    query GetAdminById($adminId: String!) {
      getAdminById(adminId: $adminId) {
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
  const data = await graphqlRequestWithAuth<{ getAdminById: GetAdminByIdResponse }>(
    query,
    { adminId }
  );
  return data.getAdminById;
}

export async function getRoleDefinitions(
  scopeType?: string,
  scopeId?: string
): Promise<GetRoleDefinitionsResponse> {
  const query = `
    query GetRoleDefinitions($scopeType: String, $scopeId: String) {
      getRoleDefinitions(scopeType: $scopeType, scopeId: $scopeId) {
        success
        message
        roles {
          id
          name
          description
          scopeType
          scopeId
          permissions
          isSystem
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getRoleDefinitions: GetRoleDefinitionsResponse }>(
    query,
    { scopeType, scopeId }
  );
  return data.getRoleDefinitions;
}
