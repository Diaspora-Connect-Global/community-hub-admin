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
  // The login-established `admin` record is the authoritative identity. A refreshed
  // access token may omit the optional scope claims (the backend rebuilds them from a
  // re-fetched admin and can return a weaker `scopeType`/`scopeId`), so fall back to
  // `admin` rather than treating the refreshed token as a downgrade and logging out.
  if (!claims && !admin) {
    return { ok: false, reason: "missing_claims" };
  }

  const roles = getNormalizedRoles(claims);
  const adminRoleName = normalizeRole(admin?.role?.name);
  const adminScopeType = admin?.scopeType?.toUpperCase() ?? null;
  const isCommunityAdmin =
    roles.includes(COMMUNITY_ADMIN_ROLE) ||
    adminRoleName === COMMUNITY_ADMIN_ROLE ||
    adminScopeType === COMMUNITY_SCOPE;
  const isSystemAdmin =
    roles.includes(SYSTEM_ADMIN_ROLE) || adminRoleName === SYSTEM_ADMIN_ROLE;

  if (!isCommunityAdmin && !isSystemAdmin) {
    return { ok: false, reason: "invalid_role" };
  }

  const effectiveScopeType =
    claims?.scopeType?.toUpperCase() ?? adminScopeType ?? null;
  if (!isSystemAdmin && effectiveScopeType !== COMMUNITY_SCOPE) {
    return { ok: false, reason: "invalid_scope_type" };
  }

  const effectiveScopeId = claims?.scopeId ?? admin?.scopeId ?? null;
  if (!isSystemAdmin && !effectiveScopeId) {
    return { ok: false, reason: "missing_scope_id" };
  }

  const tokenScopeId = claims?.scopeId ?? null;
  const adminScopeId = admin?.scopeId ?? null;
  if (tokenScopeId && adminScopeId && tokenScopeId !== adminScopeId) {
    return { ok: false, reason: "scope_mismatch" };
  }

  if (
    !isSystemAdmin &&
    selectedCommunityId &&
    effectiveScopeId &&
    selectedCommunityId !== effectiveScopeId
  ) {
    return { ok: false, reason: "scope_mismatch" };
  }

  return { ok: true };
}

