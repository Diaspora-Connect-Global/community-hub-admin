// TypeScript types for the Community Management service

export interface CommunityTypeInfo {
  id: string;
  name: string;
  isEmbassy: boolean;
}

export interface DefaultGroup {
  id: string;
  name: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  joinPolicy: string;
  memberCount: number;
  avatarUrl?: string;
  coverUrl?: string;
  website?: string;
  contactEmail?: string;
  communityRules?: string;
  whoCanPost?: string;
  groupCreationPermission?: string;
  countriesServed?: string[];
  communityType?: CommunityTypeInfo;
  defaultGroup?: DefaultGroup;
  createdAt: string;
}

export interface CommunityStats {
  memberCount: number;
  pendingRequestCount: number;
  postCount: number;
}

export interface MemberDetails {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface MemberDetailsListResponse {
  members: MemberDetails[];
  total: number;
}

export interface PendingMembershipRequest {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  status: string;
  entityName?: string;
  requestedAt?: string;
  createdAt: string;
}

export interface PendingMembershipListResponse {
  requests: PendingMembershipRequest[];
  total: number;
}

export interface PendingInvitation {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  status: string;
  entityName?: string;
  invitedAt: string;
}

export interface PendingInvitationListResponse {
  invitations: PendingInvitation[];
  total: number;
}

export interface BannedUser {
  userId: string;
  bannedBy: string;
  reason?: string;
  bannedAt: string;
}

export interface SuspendedUser {
  userId: string;
  suspendedBy: string;
  reason?: string;
  suspendedAt: string;
}

export interface ModerationLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  performedBy: string;
  targetUser?: string;
  details?: string;
  createdAt: string;
}

export interface Association {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  joinPolicy: string;
  contactEmail?: string;
  website?: string;
  countriesServed?: string[];
  avatarUrl?: string;
  createdAt: string;
}

// ── Input types ────────────────────────────────────────────────────────────────

export interface UpdateCommunityInput {
  communityId: string;
  name?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  communityRules?: string;
  whoCanPost?: string;
  groupCreationPermission?: string;
  countriesServed?: string[];
  locationCountry?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export interface UpdateCommunityVisibilityInput {
  communityId: string;
  /** "public" | "private" | "secret" */
  visibility: string;
}

export interface UpdateCommunityJoinPolicyInput {
  communityId: string;
  /** "open" | "approval_required" | "invite_only" | "paid" */
  joinPolicy: string;
  priceAmount?: number;
  priceCurrency?: string;
}

export interface ListPendingMembershipsInput {
  entityId: string;
  entityType: string;
  limit?: number;
  offset?: number;
}

export interface ListPendingInvitationsByEntityInput {
  entityId: string;
  entityType: string;
  limit?: number;
  offset?: number;
}

export interface ApproveMembershipInput {
  /** userId from the pending membership request */
  startUserId: string;
  entityId: string;
  entityType: string;
}

export interface ApproveResponse {
  success: boolean;
  message?: string;
  approvedAt?: string;
}

export interface RejectMembershipInput {
  targetUserId: string;
  entityId: string;
  entityType: string;
  reason?: string;
}

export interface RejectResponse {
  success: boolean;
  message?: string;
  rejectedAt?: string;
}

export interface InviteMemberInput {
  targetUserId: string;
  entityId: string;
  entityType: string;
}

export interface InviteMemberResponse {
  status: string;
  inviteId: string;
  message?: string;
}

export interface CommunityRemoveMemberInput {
  userId: string;
  entityId: string;
  entityType: string;
  reason?: string;
}

export interface RemoveResponse {
  success: boolean;
  message?: string;
  removedAt?: string;
}

export interface BanUserInput {
  userId: string;
  entityId: string;
  entityType: string;
  reason?: string;
}

export interface BanResponse {
  success: boolean;
  message?: string;
  bannedAt?: string;
}

export interface UnbanUserInput {
  userId: string;
  entityId: string;
  entityType: string;
}

export interface UnbanResponse {
  success: boolean;
  message?: string;
  unbannedAt?: string;
}

export interface SuspendResponse {
  success: boolean;
  message?: string;
  suspendedAt?: string;
}

export interface UnsuspendResponse {
  success: boolean;
  message?: string;
  unsuspendedAt?: string;
}

export interface AssignMemberRoleInput {
  userId: string;
  entityId: string;
  entityType: string;
  /** e.g. "moderator" | "member" */
  role: string;
}

export interface CommunityOperationResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface CommunityTransferOwnershipInput {
  currentOwnerId: string;
  newOwnerId: string;
  entityId: string;
  entityType: string;
}

export interface CommunityUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface DeleteEntityImageResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface CreateAssociationInput {
  name: string;
  visibility: string;
  joinPolicy: string;
  associationTypeId: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  countriesServed?: string[];
}

export interface UpdateAssociationInput {
  associationId: string;
  name?: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  countriesServed?: string[];
}

export interface LinkAssociationInput {
  communityId: string;
  associationId: string;
}

export interface LinkAssociationResponse {
  success: boolean;
  message?: string;
  communityId?: string;
  associationId?: string;
  linkedBy?: string;
  linkedAt?: string;
}
