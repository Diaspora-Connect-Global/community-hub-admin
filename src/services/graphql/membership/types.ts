export type MembershipStatus = "ACTIVE" | "PENDING" | "PENDING_PAYMENT" | "CANCELLED" | "EXPIRED";

export interface RequestMembershipInput {
  entityId: string;
  entityType: "ASSOCIATION" | "COMMUNITY";
  message?: string;
}

export interface RequestMembershipResult {
  id: string;
  status: MembershipStatus;
  message: string | null;
  requiresPayment: boolean;
  clientSecret: string | null;
}

export interface CancelMembershipSubscriptionInput {
  membershipId: string;
}

export interface CancelMembershipSubscriptionResult {
  success: boolean;
  message: string | null;
}

export interface MyMembershipResult {
  id: string;
  status: MembershipStatus;
  requiresPayment: boolean;
  expiresAt?: string | null;
  hasActiveSubscription?: boolean | null;
  entityName?: string | null;
}
