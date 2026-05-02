import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUserInfo } from "@/services/graphql/authentication/adminLogin";
import type { AdminJwtClaims } from "@/services/authentication/adminTokenClaims";

export const AUTH_STORAGE_KEY = "admin_auth";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  admin: AdminUserInfo | null;
  claims: AdminJwtClaims | null;
  selectedCommunityId: string | null;
}

export interface SetAuthPayload {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  admin: AdminUserInfo | null;
  claims: AdminJwtClaims;
  selectedCommunityId: string | null;
}

export interface AuthActions {
  setAuth: (payload: SetAuthPayload) => void;
  setSelectedCommunityId: (communityId: string | null) => void;
  logout: () => void;
  clearAuth: () => void;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  admin: null,
  claims: null,
  selectedCommunityId: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (payload) => set(payload),
      setSelectedCommunityId: (communityId) => set({ selectedCommunityId: communityId }),
      logout: () => set(initialState),
      clearAuth: () => set(initialState),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage<AuthState>(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        admin: state.admin,
        claims: state.claims,
        selectedCommunityId: state.selectedCommunityId,
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
    let unsub: () => void = () => {};
    const finish = () => {
      if (done) return;
      done = true;
      unsub();
      clearTimeout(timer);
      resolve();
    };
    unsub = useAuthStore.persist.onFinishHydration(finish);
    const timer = window.setTimeout(() => {
      console.warn("[authStore] waitForAuthHydration timed out after", timeoutMs, "ms");
      finish();
    }, timeoutMs);
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
