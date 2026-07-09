import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  GetAdminByIdResponse,
  GetRoleDefinitionsResponse,
  ListAdminsResponse,
} from "./types";

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
            roleDefinitionId
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

/**
 * List admin accounts. The gateway does not currently support filtering by
 * scope, so callers scoped to a single community should filter the returned
 * `admins` by `roles[].scopeId` client-side.
 */
export async function listAdmins(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  adminType?: string;
}): Promise<ListAdminsResponse> {
  const query = `
    query ListAdmins(
      $search: String
      $page: Int
      $limit: Int
      $status: String
      $adminType: String
    ) {
      listAdmins(
        search: $search
        page: $page
        limit: $limit
        status: $status
        adminType: $adminType
      ) {
        admins {
          id
          email
          status
          adminType
          roles {
            id
            roleType
            scopeType
            scopeId
            roleDefinitionId
          }
          permissions
        }
        total
        page
        limit
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ listAdmins: ListAdminsResponse }>(query, {
    search: params?.search,
    page: params?.page,
    limit: params?.limit,
    status: params?.status,
    adminType: params?.adminType,
  });
  return data.listAdmins;
}
