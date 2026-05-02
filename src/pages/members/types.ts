import type {
  MemberDetails,
  PendingMembershipRequest,
} from "@/services/graphql/community/types";

export type { MemberDetails, PendingMembershipRequest };

/** UI select values for assign-role (mapped to API enums via roleToApi). */
export const ROLE_UI_MEMBER = "member";
export const ROLE_UI_MODERATOR = "moderator";
export const ROLE_UI_ADMIN = "admin";

export const PAGE_SIZE = 20;

export function getInitials(id: string): string {
  return id.slice(0, 2).toUpperCase();
}

/** Normalize API role strings (MEMBER, COMMUNITY_ADMIN, …) to UI select value. */
export function apiRoleToSelectValue(role: string | undefined): string {
  const r = (role ?? "MEMBER").toUpperCase();
  if (r === "MEMBER") return ROLE_UI_MEMBER;
  if (r === "MODERATOR") return ROLE_UI_MODERATOR;
  if (
    r === "COMMUNITY_ADMIN" ||
    r === "ASSOCIATION_ADMIN" ||
    r === "ADMIN" ||
    r === "OWNER"
  ) {
    return ROLE_UI_ADMIN;
  }
  return ROLE_UI_MEMBER;
}

/** Map UI role to backend assignMemberRole enum. */
export function roleToApi(ui: string, entityType: string): string {
  const e = entityType.toUpperCase();
  if (ui === ROLE_UI_MEMBER) return "MEMBER";
  if (ui === ROLE_UI_MODERATOR) return "MODERATOR";
  if (ui === ROLE_UI_ADMIN) {
    return e === "ASSOCIATION" ? "ASSOCIATION_ADMIN" : "COMMUNITY_ADMIN";
  }
  return "MEMBER";
}

export function formatRoleLabel(role: string): string {
  const r = role?.toUpperCase() ?? "";
  const labels: Record<string, string> = {
    MEMBER: "Member",
    MODERATOR: "Moderator",
    COMMUNITY_ADMIN: "Admin",
    ASSOCIATION_ADMIN: "Admin",
    ADMIN: "Admin",
    OWNER: "Owner",
  };
  return labels[r] ?? role;
}

export function formatStatusLabel(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (!s) return status;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getRoleBadgeClass(role: string): string {
  const r = role?.toUpperCase() ?? "";
  if (r === "OWNER") {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  if (
    r === "COMMUNITY_ADMIN" ||
    r === "ASSOCIATION_ADMIN" ||
    r === "ADMIN" ||
    r === "MODERATOR"
  ) {
    return "bg-primary/10 text-primary";
  }
  return "";
}

export function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "active":
      return "default";
    case "suspended":
    case "banned":
      return "destructive";
    case "pending":
    case "invited":
      return "outline";
    case "expired":
    case "cancelled":
      return "secondary";
    default:
      return "secondary";
  }
}
