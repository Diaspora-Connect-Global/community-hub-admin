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
import { useAuthStore, getAccessToken } from "@/stores/authStore";

export interface LoginResult {
  success: boolean;
  admin: AdminUserInfo | null;
  error?: string | null;
}

/**
 * Log in admin; state and tokens are stored in Zustand and persisted to sessionStorage.
 */
export async function login(input: AdminLoginInput): Promise<LoginResult> {
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
