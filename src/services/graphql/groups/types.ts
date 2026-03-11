// TypeScript types for the Group Management service

export type GroupPrivacy = "PUBLIC" | "PRIVATE" | "SECRET";
export type MemberRole = "MEMBER" | "MODERATOR" | "ADMIN" | "OWNER";
export type MemberStatus = "ACTIVE" | "MUTED" | "BANNED" | "LEFT" | "REMOVED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type GroupBlockReason = "SPAM" | "ABUSE" | "POLICY_VIOLATION" | "SELF_BLOCK" | "OTHER";
export type GroupReportReason = "SPAM" | "ABUSE" | "POLICY_VIOLATION" | "OTHER";

export interface GroupOwnerProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  privacy: GroupPrivacy;
  category?: string;
  memberCount: number;
  maxMembers?: number;
  owner?: GroupOwnerProfile;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupListResponse {
  groups: Group[];
  total: number;
}

export interface GroupMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt?: string;
  createdAt: string;
  profile?: GroupMemberProfile;
}

export interface GroupMemberListResponse {
  members: GroupMember[];
  total: number;
}

export interface JoinRequestRequesterProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  message?: string;
  createdAt: string;
  requesterProfile?: JoinRequestRequesterProfile;
}

export interface JoinRequestListResponse {
  requests: JoinRequest[];
  total: number;
}

export interface BlockedUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface BlockedMember {
  id: string;
  groupId: string;
  userId: string;
  blockedBy: string;
  reason?: GroupBlockReason;
  expiresAt?: string;
  createdAt: string;
  blockedUserProfile?: BlockedUserProfile;
}

export interface BlockedMemberListResponse {
  blocks: BlockedMember[];
  total: number;
}

export interface GroupMembership {
  isMember: boolean;
  role?: MemberRole;
  status?: MemberStatus;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedUserId: string;
  status: InvitationStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface GroupReport {
  id: string;
  groupId: string;
  reporterId: string;
  reportedUserId: string;
  reason: GroupReportReason;
  description?: string;
  createdAt: string;
}

export interface TransferGroupOwnershipResponse {
  success: boolean;
  message?: string;
  newOwnerId?: string;
  previousOwnerId?: string;
}

export interface GroupCommonResponse {
  success: boolean;
  message?: string;
}

// ── Input types ────────────────────────────────────────────────────────────────

export interface CreateGroupInput {
  /** 1–100 characters, required */
  name: string;
  /** max 500 characters */
  description?: string;
  /** defaults to PUBLIC */
  privacy?: GroupPrivacy;
  category?: string;
  /** optional user UUIDs to add on creation */
  memberIds?: string[];
}

export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  description?: string;
  privacy?: GroupPrivacy;
  category?: string;
  avatarUrl?: string;
}

export interface DiscoverGroupsInput {
  category?: string;
  search?: string;
  privacy?: GroupPrivacy;
  limit?: number;
  offset?: number;
}

export interface InviteToGroupInput {
  groupId: string;
  userId: string;
}

export interface CancelInvitationInput {
  invitationId: string;
}

export interface ModerateJoinRequestInput {
  groupId: string;
  userId: string;
}

export interface RejectJoinRequestInput {
  groupId: string;
  userId: string;
  reason?: string;
}

export interface UpdateMemberRoleInput {
  groupId: string;
  userId: string;
  role: MemberRole;
}

export interface GroupRemoveMemberInput {
  groupId: string;
  userId: string;
  reason?: string;
}

export interface BlockMemberInput {
  groupId: string;
  userId: string;
  /** SPAM | ABUSE | POLICY_VIOLATION | SELF_BLOCK | OTHER */
  reason: GroupBlockReason;
  /** Omit for a permanent block */
  expiresAt?: string;
}

export interface UnblockMemberInput {
  groupId: string;
  userId: string;
}

export interface GroupTransferOwnershipInput {
  groupId: string;
  newOwnerId: string;
}

export interface ReportMemberInput {
  groupId: string;
  reportedUserId: string;
  reason: GroupReportReason;
  description?: string;
}
