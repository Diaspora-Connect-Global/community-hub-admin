import { graphqlRequest } from "@/services/graphql/client";
import { ADMIN_ROLE_FRAGMENT, ADMIN_USER_FRAGMENT } from "./fragments";

/** AdminLogin mutation: fragments must be defined before the operation that uses them */
const ADMIN_LOGIN_MUTATION = `
  ${ADMIN_ROLE_FRAGMENT}
  ${ADMIN_USER_FRAGMENT}
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      success
      message
      error
      accessToken
      refreshToken
      admin {
        ...AdminUserInfo
      }
    }
  }
`;

export interface AdminRoleInfo {
  id: string;
  name: string;
  scopeType: string;
  permissions: string[];
  description?: string | null;
}

export type AdminScopeType = "PLATFORM" | "GLOBAL" | "COMMUNITY" | "ASSOCIATION";

export interface AdminUserInfo {
  id: string;
  userId: string;
  scopeType: AdminScopeType;
  scopeId: string | null;
  isActive: boolean;
  role: AdminRoleInfo | null;
}

export interface AdminLoginResponse {
  success: boolean;
  message?: string | null;
  error?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  admin?: AdminUserInfo | null;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

interface AdminLoginData {
  adminLogin: AdminLoginResponse;
}

export async function adminLoginMutation(
  input: AdminLoginInput,
): Promise<AdminLoginResponse> {
  const data = await graphqlRequest<AdminLoginData, { input: AdminLoginInput }>(
    ADMIN_LOGIN_MUTATION,
    { input },
  );

  return data.adminLogin;
}
