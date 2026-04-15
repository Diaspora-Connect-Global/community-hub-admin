import {
  graphqlRequest,
  GraphQLUnauthorizedError,
} from "@/services/graphql/client";
import {
  adminLoginMutation,
  type AdminLoginInput,
  type AdminUserInfo,
} from "@/services/graphql/authentication/adminLogin";
import { adminRefreshTokenMutation } from "@/services/graphql/authentication/adminRefreshToken";
import { useAuthStore, getAccessToken, waitForAuthHydration } from "@/stores/authStore";

export interface LoginResult {
  success: boolean;
  admin: AdminUserInfo | null;
  error?: string | null;
}

/**
 * Admin login via `adminLogin` (community_admin, association_admin, super_admin).
 * Tokens and admin identity are stored in Zustand and persisted to sessionStorage.
 */
export async function adminLogin(input: AdminLoginInput): Promise<LoginResult> {
  const result = await adminLoginMutation(input);
  const { setAuth, logout } = useAuthStore.getState();

  if (!result.success) {
    logout();
    return {
      success: false,
      admin: null,
      error: result.error ?? result.message ?? "Login failed",
    };
  }

  const accessToken = result.accessToken ?? null;
  const refreshToken = result.refreshToken ?? null;

  setAuth({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 14 * 60 * 1000, // 14 min — 1 min before the 15-min JWT TTL
    admin: result.admin ?? null,
  });

  return {
    success: true,
    admin: result.admin ?? null,
  };
}

/**
 * Refresh session using stored refresh token. Updates store with new access/refresh tokens.
 * Call this when the access token is expired or when you get 401.
 * On failure (invalid/expired refresh token), clears auth and returns false.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().logout();
    return false;
  }

  const result = await adminRefreshTokenMutation({ refreshToken });
  const { setAuth, logout } = useAuthStore.getState();

  if (!result.success || !result.accessToken) {
    logout();
    return false;
  }

  setAuth({
    accessToken: result.accessToken ?? null,
    refreshToken: result.refreshToken ?? null,
    expiresAt: Date.now() + 14 * 60 * 1000,
    admin: useAuthStore.getState().admin,
  });

  return true;
}

/**
 * Run an authenticated GraphQL request. Uses current access token; on 401, refreshes
 * and retries once. Use this for all admin-scoped operations (e.g. opportunities).
 */
export async function graphqlRequestWithAuth<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  await waitForAuthHydration();

  // Proactively refresh the token before it expires rather than waiting for a 401
  const expiresAt = useAuthStore.getState().expiresAt;
  if (expiresAt !== null && Date.now() >= expiresAt) {
    const proactiveRefresh = await refreshSession();
    if (!proactiveRefresh) {
      throw new Error("Session expired. Please sign in again.");
    }
  }

  const token = getAccessToken();
  try {
    return await graphqlRequest<TData, TVariables>(query, variables, token ?? undefined);
  } catch (err) {
    if (!(err instanceof GraphQLUnauthorizedError)) {
      throw err;
    }
    const refreshed = await refreshSession();
    if (!refreshed) {
      throw new Error("Session expired. Please sign in again.");
    }
    return await graphqlRequest<TData, TVariables>(
      query,
      variables,
      getAccessToken() ?? undefined,
    );
  }
}

export { useAuthStore, getAccessToken, getRefreshToken } from "@/stores/authStore";

/** Clear auth state and sessionStorage. */
export function logout(): void {
  useAuthStore.getState().logout();
}
