import { graphqlRequest } from "@/services/graphql/client";

/**
 * Refresh admin session using refresh token.
 * No Authorization header — the refresh token is sent in the input.
 */
const ADMIN_REFRESH_TOKEN_MUTATION = `
  mutation AdminRefreshToken($input: AdminRefreshTokenInput!) {
    adminRefreshToken(input: $input) {
      success
      message
      error
      accessToken
      refreshToken
    }
  }
`;

export interface AdminRefreshTokenInput {
  refreshToken: string;
}

export interface AdminRefreshTokenResponse {
  success: boolean;
  message?: string | null;
  error?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

interface AdminRefreshTokenData {
  adminRefreshToken: AdminRefreshTokenResponse;
}

export async function adminRefreshTokenMutation(
  input: AdminRefreshTokenInput,
): Promise<AdminRefreshTokenResponse> {
  const data = await graphqlRequest<
    AdminRefreshTokenData,
    { input: AdminRefreshTokenInput }
  >(ADMIN_REFRESH_TOKEN_MUTATION, { input });
  return data.adminRefreshToken;
}
