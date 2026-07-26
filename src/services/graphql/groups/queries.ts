import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Group,
  GroupListResponse,
  GroupMemberListResponse,
  JoinRequestListResponse,
  BlockedMemberListResponse,
  GroupMembership,
  GroupInvitation,
  InvitationStatus,
  MemberRole,
  MemberStatus,
  DiscoverGroupsInput,
} from "./types";

export interface GroupInvitationRow {
  invitation: GroupInvitation;
  group?: Pick<Group, "id" | "name">;
  inviteeProfile?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  inviterProfile?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

export interface GroupInvitationListResult {
  success: boolean;
  message?: string;
  invitations: GroupInvitationRow[];
  total: number;
}

export async function getGroup(groupId: string): Promise<Group> {
  const query = `
    query GetGroup($groupId: ID!) {
      getGroup(groupId: $groupId) {
        success
        message
        group {
          id
          ownerId
          name
          description
          avatarUrl
          privacy
          category
          memberCount
          maxMembers
          owner {
            id
            firstName
            lastName
            avatarUrl
          }
          ownerName
          createdAt
          updatedAt
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getGroup: { success: boolean; message?: string; group?: Group };
  }>(query, { groupId });
  if (!data.getGroup?.group) {
    throw new Error(data.getGroup?.message || "Group not found");
  }
  return data.getGroup.group;
}

export async function getMyGroups(limit = 20, offset = 0): Promise<GroupListResponse> {
  const query = `
    query GetMyGroups($limit: Int, $offset: Int) {
      getMyGroups(limit: $limit, offset: $offset) {
        groups {
          id
          name
          description
          privacy
          memberCount
          avatarUrl
          category
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getMyGroups: GroupListResponse }>(query, {
    limit,
    offset,
  });
  return data.getMyGroups;
}

/**
 * Admin-only listing of every group owned by a specific community or
 * association — regardless of privacy or owner. Requires the caller's
 * admin scope to match the entity (or SYSTEM_ADMIN).
 */
export async function getEntityGroups(input: {
  entityId: string;
  entityType: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<GroupListResponse> {
  const query = `
    query GetEntityGroups(
      $entityId: ID!
      $entityType: String!
      $search: String
      $limit: Int
      $offset: Int
    ) {
      getEntityGroups(
        entityId: $entityId
        entityType: $entityType
        search: $search
        limit: $limit
        offset: $offset
      ) {
        groups {
          id
          name
          description
          privacy
          memberCount
          avatarUrl
          category
          entityId
          entityType
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getEntityGroups: GroupListResponse }>(
    query,
    input as Record<string, unknown>,
  );
  return data.getEntityGroups;
}

export async function discoverGroups(
  input: DiscoverGroupsInput = {}
): Promise<GroupListResponse> {
  const query = `
    query DiscoverGroups(
      $category: String
      $search: String
      $privacy: GroupPrivacy
      $limit: Int
      $offset: Int
      $entityId: ID
      $entityType: String
    ) {
      discoverGroups(
        category: $category
        search: $search
        privacy: $privacy
        limit: $limit
        offset: $offset
        entityId: $entityId
        entityType: $entityType
      ) {
        groups {
          id
          name
          description
          privacy
          memberCount
          avatarUrl
          category
          entityId
          entityType
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ discoverGroups: GroupListResponse }>(
    query,
    input as Record<string, unknown>
  );
  return data.discoverGroups;
}

export async function getGroupMembers(
  groupId: string,
  limit = 20,
  offset = 0,
  role?: MemberRole,
  statuses?: MemberStatus[]
): Promise<GroupMemberListResponse> {
  const query = `
    query GetGroupMembers(
      $groupId: ID!
      $limit: Int
      $offset: Int
      $role: MemberRole
      $statuses: [MemberStatus!]
    ) {
      getGroupMembers(
        groupId: $groupId
        limit: $limit
        offset: $offset
        role: $role
        statuses: $statuses
      ) {
        members {
          id
          userId
          groupId
          role
          status
          joinedAt
          createdAt
          profile {
            id
            firstName
            lastName
            avatarUrl
          }
        }
        total
        hasMore
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getGroupMembers: GroupMemberListResponse }>(query, {
    groupId,
    limit,
    offset,
    role,
    statuses,
  });
  return data.getGroupMembers;
}

export async function getPendingJoinRequestsForGroup(
  groupId: string,
  limit = 20,
  offset = 0
): Promise<JoinRequestListResponse> {
  const query = `
    query GetPendingJoinRequests($groupId: ID!, $limit: Int, $offset: Int) {
      getPendingJoinRequestsForGroup(groupId: $groupId, limit: $limit, offset: $offset) {
        requests {
          id
          groupId
          userId
          status
          message
          createdAt
          requesterProfile {
            id
            firstName
            lastName
            avatarUrl
          }
        }
        total
        hasMore
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getPendingJoinRequestsForGroup: JoinRequestListResponse;
  }>(query, { groupId, limit, offset });
  return data.getPendingJoinRequestsForGroup;
}

export async function getBlockedMembers(groupId: string): Promise<BlockedMemberListResponse> {
  const query = `
    query GetBlockedMembers($groupId: ID!) {
      getBlockedMembers(groupId: $groupId) {
        success
        message
        blocks {
          id
          groupId
          userId
          blockedBy
          reason
          expiresAt
          createdAt
          blockedUserProfile {
            id
            firstName
            lastName
            avatarUrl
          }
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getBlockedMembers: { success: boolean; message: string; blocks: BlockedMemberListResponse["blocks"] };
  }>(query, { groupId });
  return {
    blocks: data.getBlockedMembers.blocks ?? [],
    total: data.getBlockedMembers.blocks?.length ?? 0,
  };
}

export async function getSentGroupInvitations(
  limit = 50,
  offset = 0
): Promise<GroupInvitationListResult> {
  const query = `
    query GetSentGroupInvitations($limit: Int, $offset: Int) {
      getSentGroupInvitations(limit: $limit, offset: $offset) {
        success
        message
        total
        invitations {
          invitation {
            id
            groupId
            invitedUserId
            status
            expiresAt
            createdAt
          }
          group {
            id
            name
          }
          inviterProfile {
            id
            firstName
            lastName
            avatarUrl
          }
          inviteeProfile {
            id
            firstName
            lastName
            avatarUrl
          }
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getSentGroupInvitations: GroupInvitationListResult;
  }>(query, { limit, offset });
  return data.getSentGroupInvitations;
}

/**
 * List ALL invitations belonging to a specific group, optionally filtered by
 * status. Authorized for SYSTEM_ADMIN and the COMMUNITY_ADMIN / ASSOCIATION_ADMIN
 * that owns the group's entity scope.
 *
 * Pass `status: undefined` for all statuses.
 */
export async function getGroupInvitations(input: {
  groupId: string;
  status?: InvitationStatus;
  limit?: number;
  offset?: number;
}): Promise<GroupInvitationListResult> {
  const query = `
    query GetGroupInvitations(
      $groupId: ID!
      $status: InvitationStatus
      $limit: Int
      $offset: Int
    ) {
      getGroupInvitations(
        groupId: $groupId
        status: $status
        limit: $limit
        offset: $offset
      ) {
        success
        message
        total
        invitations {
          invitation {
            id
            groupId
            invitedBy
            invitedUserId
            status
            expiresAt
            createdAt
          }
          group {
            id
            name
          }
          inviterProfile {
            id
            firstName
            lastName
            avatarUrl
          }
          inviteeProfile {
            id
            firstName
            lastName
            avatarUrl
          }
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getGroupInvitations: GroupInvitationListResult;
  }>(query, input as Record<string, unknown>);
  return data.getGroupInvitations;
}

export async function checkGroupMembership(groupId: string): Promise<GroupMembership> {
  const query = `
    query CheckGroupMembership($groupId: ID!) {
      checkGroupMembership(groupId: $groupId) {
        isMember
        role
        status
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ checkGroupMembership: GroupMembership }>(query, {
    groupId,
  });
  return data.checkGroupMembership;
}
