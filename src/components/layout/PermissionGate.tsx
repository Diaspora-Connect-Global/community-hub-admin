import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";
import { canOpenPath } from "@/lib/rolePermissions";

/**
 * A custom-role admin who opens a page its role does not cover (an old link, a
 * bookmark) goes to the dashboard instead of a page whose every action would be
 * refused. Built-in admins are never redirected. UX only: the server refuses
 * the actions anyway.
 */
export function PermissionGate({ children }: { children: ReactNode }) {
  const access = useConsoleAccess();
  const { pathname } = useLocation();
  if (!canOpenPath(access, pathname)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
