import { useAuthStore } from "@/stores/authStore";
import type { AdminJwtClaims } from "@/services/authentication/adminTokenClaims";
import {
  COMMUNITY_SCOPE,
  SYSTEM_ADMIN_ROLE,
  getNormalizedRoles,
} from "@/services/authentication/adminTokenClaims";

export interface CommunityScope {
  communityId: string;
  isSystemAdmin: boolean;
  isValid: boolean;
  claims: AdminJwtClaims | null;
}

export function useCommunityScope(): CommunityScope {
  const admin = useAuthStore((s) => s.admin);
  const claims = useAuthStore((s) => s.claims);
  const selectedCommunityId = useAuthStore((s) => s.selectedCommunityId);

  const roles = getNormalizedRoles(claims);
  const isSystemAdmin = roles.includes(SYSTEM_ADMIN_ROLE);

  const communityId = isSystemAdmin
    ? (selectedCommunityId ?? "")
    : admin?.scopeType?.toUpperCase() === COMMUNITY_SCOPE
      ? (admin.scopeId ?? "")
      : "";

  const isValid = communityId.length > 0 || isSystemAdmin;

  return { communityId, isSystemAdmin, isValid, claims };
}
