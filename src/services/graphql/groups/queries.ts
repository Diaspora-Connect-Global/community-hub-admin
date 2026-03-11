import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Group,
  GroupListResponse,
  GroupMemberListResponse,
  JoinRequestListResponse,
  BlockedMemberListResponse,
  GroupMembership,
  MemberRole,
  MemberStatus,
  DiscoverGroupsInput,
} from "./types";

export async function getGroup(groupId: string): Promise<Group> {
  const query = `
    query GetGroup($groupId: ID!) {
      getGroup(groupId: $groupId) {
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
  `;
  const data = await graphqlRequestWithAuth<{ getGroup: Group }>(query, { groupId });
  return data.getGroup;
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
    ) {
      discoverGroups(
        category: $category
        search: $search
        privacy: $privacy
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
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getBlockedMembers: BlockedMemberListResponse }>(
    query,
    { groupId }
  );
  return data.getBlockedMembers;
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
