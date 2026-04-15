import type { AdminUserInfo } from "@/services/graphql/authentication/adminLogin";

export const COMMUNITY_ADMIN_ROLE = "COMMUNITY_ADMIN";
export const SYSTEM_ADMIN_ROLE = "SYSTEM_ADMIN";
export const COMMUNITY_SCOPE = "COMMUNITY";

export interface AdminJwtClaims {
  sub?: string;
  userId?: string;
  email?: string;
  adminType?: string;
  role?: string;
  roles?: string[];
  scopeType?: string;
  scopeId?: string;
  permissions?: string[];
}

export type GuardFailureReason =
  | "missing_claims"
  | "invalid_role"
  | "invalid_scope_type"
  | "missing_scope_id"
  | "scope_mismatch";

export interface GuardEvaluationResult {
  ok: boolean;
  reason?: GuardFailureReason;
}

function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim().toUpperCase();
}

export function getNormalizedRoles(claims: AdminJwtClaims | null): string[] {
  if (!claims) return [];
  const fromList = Array.isArray(claims.roles) ? claims.roles : [];
  const merged = [...fromList, claims.role ?? ""]
    .map((role) => normalizeRole(role))
    .filter(Boolean);
  return Array.from(new Set(merged));
}

export function getNormalizedPermissions(claims: AdminJwtClaims | null): string[] {
  if (!claims?.permissions?.length) return [];
  const permissions = claims.permissions
    .map((permission) => permission.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(permissions));
}

export function extractClaimsFromAccessToken(token: string): AdminJwtClaims | null {
  try {
    const segments = token.split(".");
    if (segments.length < 2) return null;
    const payloadSegment = segments[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as AdminJwtClaims;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function evaluateCommunityScopeAccess(input: {
  claims: AdminJwtClaims | null;
  admin: AdminUserInfo | null;
  selectedCommunityId: string | null;
}): GuardEvaluationResult {
  const { claims, admin, selectedCommunityId } = input;
  if (!claims) {
    return { ok: false, reason: "missing_claims" };
  }

  const roles = getNormalizedRoles(claims);
  const isCommunityAdmin = roles.includes(COMMUNITY_ADMIN_ROLE);
  const isSystemAdmin = roles.includes(SYSTEM_ADMIN_ROLE);

  if (!isCommunityAdmin && !isSystemAdmin) {
    return { ok: false, reason: "invalid_role" };
  }

  if (!isSystemAdmin && claims.scopeType?.toUpperCase() !== COMMUNITY_SCOPE) {
    return { ok: false, reason: "invalid_scope_type" };
  }

  const tokenScopeId = claims.scopeId ?? null;
  if (!isSystemAdmin && !tokenScopeId) {
    return { ok: false, reason: "missing_scope_id" };
  }

  const adminScopeId = admin?.scopeId ?? null;
  if (tokenScopeId && adminScopeId && tokenScopeId !== adminScopeId) {
    return { ok: false, reason: "scope_mismatch" };
  }

  if (!isSystemAdmin && selectedCommunityId && tokenScopeId && selectedCommunityId !== tokenScopeId) {
    return { ok: false, reason: "scope_mismatch" };
  }

  return { ok: true };
}

