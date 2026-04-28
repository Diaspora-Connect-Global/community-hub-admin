import { graphqlRequest } from "@/services/graphql/client";

/**
 * Refresh access token using the refresh token (no Authorization header).
 * Matches the `refreshToken` mutation from the Community Admin API guide.
 */
const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      accessToken
      refreshToken
      sessionToken
      sessionTokenExpiry
      refreshTokenExpiry
      user {
        id
        email
        firstName
        lastName
        role
        avatarUrl
      }
    }
  }
`;

export interface RefreshTokenResponse {
  success: boolean;
  message?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  sessionToken?: string | null;
  sessionTokenExpiry?: string | null;
  refreshTokenExpiry?: string | null;
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface RefreshTokenData {
  refreshToken: RefreshTokenResponse;
}

/** @deprecated use refreshTokenMutation — kept for searchability */
export type AdminRefreshTokenInput = { refreshToken: string };
/** @deprecated */
export type AdminRefreshTokenResponse = RefreshTokenResponse;

export async function refreshTokenMutation(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  const data = await graphqlRequest<
    RefreshTokenData,
    { refreshToken: string }
  >(REFRESH_TOKEN_MUTATION, { refreshToken });
  return data.refreshToken;
}

/** Alias for older call sites */
export async function adminRefreshTokenMutation(input: {
  refreshToken: string;
}): Promise<RefreshTokenResponse> {
  return refreshTokenMutation(input.refreshToken);
}
