import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { evaluateCommunityScopeAccess } from "@/services/authentication/adminTokenClaims";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Redirects unauthenticated users to `/login`, preserving the attempted path for post-login redirect.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const admin = useAuthStore((s) => s.admin);
  const claims = useAuthStore((s) => s.claims);
  const selectedCommunityId = useAuthStore((s) => s.selectedCommunityId);
  const location = useLocation();
  const [hasHydrated, setHasHydrated] = useState(() =>
    typeof window === "undefined" ? true : useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    return unsub;
  }, []);

  // Force a re-render when the token expires so the redirect fires automatically
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) return;
    const timer = setTimeout(() => forceUpdate((n) => n + 1), msUntilExpiry);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  if (!hasHydrated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!accessToken || (expiresAt !== null && Date.now() >= expiresAt)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const scopeAccess = evaluateCommunityScopeAccess({
    claims,
    admin,
    selectedCommunityId,
  });
  if (!scopeAccess.ok) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Unauthorized scope</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Your account is authenticated but does not match the required Community Admin role or scope
          for this workspace.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
