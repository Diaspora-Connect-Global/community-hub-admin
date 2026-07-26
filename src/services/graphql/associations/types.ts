// Values match the backend JoinPolicy enum exactly. "PAID" is included so a paid
// association read from the backend round-trips without being downgraded; it is
// not offered as a selectable option here (this console has no price fields).
export type AssociationJoinPolicy = "OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID";
export type AssociationVisibility = "PUBLIC" | "PRIVATE";
export type AssociationMemberStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface AssociationTypeDefinition {
  id: string;
  name: string;
  description?: string | null;
}

export interface AssociationAdminSeedInput {
  email: string;
  password: string;
}

export interface AssociationSummary {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  joinPolicy: AssociationJoinPolicy;
  visibility?: AssociationVisibility;
  avatarUrl?: string | null;
}

export interface AssociationDetail {
  id: string;
  name: string;
  description?: string | null;
  joinPolicy: AssociationJoinPolicy;
  visibility: AssociationVisibility;
  defaultGroupId: string;
  memberCount: number;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AssociationStats {
  totalMembers: number;
  activeMembers: number;
  pendingRequests: number;
}

export interface SearchAssociationsInput {
  query?: string;
  page?: number;
  limit?: number;
  associationTypeId?: string;
  visibility?: AssociationVisibility;
}

export interface SearchAssociationsResponse {
  associations: AssociationSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAssociationInput {
  name: string;
  description?: string;
  associationTypeId: string;
  joinPolicy: AssociationJoinPolicy;
  visibility: AssociationVisibility;
  communityIds?: string[];
  associationAdmins?: AssociationAdminSeedInput[];
}

export interface CreateAssociationResult {
  id: string;
  name: string;
  defaultGroupId: string;
  joinPolicy: AssociationJoinPolicy;
  visibility: AssociationVisibility;
  createdAt: string;
}

export interface UpdateAssociationInput {
  id: string;
  name?: string;
  description?: string;
  joinPolicy?: AssociationJoinPolicy;
  visibility?: AssociationVisibility;
  avatarKey?: string;
}

export interface AssociationOperationResponse {
  success: boolean;
  message?: string;
}

export interface LinkAssociationInput {
  associationId: string;
  communityId: string;
}

export interface AssociationMember {
  userId: string;
  role: string;
  status: AssociationMemberStatus;
  joinedAt?: string | null;
}

export interface AssociationMembersResponse {
  members: AssociationMember[];
  total: number;
  page: number;
  /** True when more rows exist beyond this page (backend caps a page at 200). */
  hasMore?: boolean;
}

export interface AssociationPendingRequest {
  userId: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  requestedAt: string;
  message?: string | null;
}

export interface AssociationPendingRequestsResponse {
  requests: AssociationPendingRequest[];
  total: number;
  /** True when more rows exist beyond this page (backend caps a page at 200). */
  hasMore?: boolean;
}

export interface AssociationMembershipMutationInput {
  entityId: string;
  entityType: "ASSOCIATION";
  userId: string;
  reason?: string;
}

export interface RemoveAssociationMemberInput extends AssociationMembershipMutationInput {
  reason?: string;
}

export interface AssociationAvatarUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}
