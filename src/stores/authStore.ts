import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUserInfo } from "@/services/graphql/authentication/adminLogin";

const AUTH_STORAGE_KEY = "admin_auth";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  admin: AdminUserInfo | null;
}

export interface AuthActions {
  setAuth: (payload: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    admin: AdminUserInfo | null;
  }) => void;
  logout: () => void;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  admin: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (payload) => set(payload),
      logout: () => set(initialState),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage<AuthState & AuthActions>(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        admin: state.admin,
      }),
    },
  ),
);

/**
 * Persist loads session from sessionStorage asynchronously. Call this before using
 * tokens from the store on a cold load, or GraphQL may run without Authorization and
 * resolvers can return FORBIDDEN.
 */
export function waitForAuthHydration(timeoutMs = 3000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      unsub();
      clearTimeout(timer);
      resolve();
    };
    const unsub = useAuthStore.persist.onFinishHydration(finish);
    const timer = window.setTimeout(finish, timeoutMs);
    if (useAuthStore.persist.hasHydrated()) finish();
  });
}

/** For use outside React (e.g. GraphQL client): get current access token */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/** For use outside React: get current refresh token */
export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

/** For use outside React: get access token expiry timestamp (ms since epoch) */
export function getAccessTokenExpiry(): number | null {
  return useAuthStore.getState().expiresAt;
}
