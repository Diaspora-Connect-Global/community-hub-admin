import {
  adminLoginMutation,
  type AdminLoginInput,
  type AdminUserInfo,
} from "@/services/graphql/authentication/adminLogin";
import { useAuthStore } from "@/stores/authStore";

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

export { useAuthStore, getAccessToken, getRefreshToken } from "@/stores/authStore";

/** Clear auth state and sessionStorage. */
export function logout(): void {
  useAuthStore.getState().logout();
}
