import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getConsoleAccess, type ConsoleAccess } from "@/lib/rolePermissions";

/**
 * What the signed-in admin may use in the console. Built-in admins keep the
 * whole console; a custom-role admin sees only what its role grants. A UI
 * convenience — the server enforces every permission.
 */
export function useConsoleAccess(): ConsoleAccess {
  const claims = useAuthStore((s) => s.claims);
  const admin = useAuthStore((s) => s.admin);
  return useMemo(() => getConsoleAccess(claims, admin), [claims, admin]);
}
