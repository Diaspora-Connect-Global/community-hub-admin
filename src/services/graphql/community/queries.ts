import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type {
  Community,
  CommunityStats,
  CommunityAnalytics,
  AnalyticsPeriod,
  MemberDetails,
  MemberDetailsListResponse,
  PendingMembershipListResponse,
  PendingInvitationListResponse,
  BannedUser,
  SuspendedUser,
  ModerationLog,
  Association,
  ListPendingMembershipsInput,
  ListPendingInvitationsByEntityInput,
  CommunityReportListResponse,
} from "./types";

export async function getCommunity(id: string): Promise<Community> {
  const query = `
    query GetCommunity($id: ID!) {
      getCommunity(id: $id) {
        id
        name
        description
        visibility
        joinPolicy
        memberCount
        avatarUrl
        coverUrl
        website
        contactEmail
        communityRules
        whoCanPost
        countriesServed
        communityType {
          id
          name
          isEmbassy
        }
        defaultGroup {
          id
          name
        }
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCommunity: Community }>(query, { id });
  return data.getCommunity;
}

/**
 * Requires the community service / gateway to authorize callers who hold a **community admin**
 * JWT (`role` / `roles` e.g. COMMUNITY_ADMIN, `scopeId` = communityId), not only rows in
 * `community_members` with moderator-style roles. If admins still see PERMISSION_DENIED here,
 * fix the `getCommunityStats` resolver auth (server-side).
 */
export async function getCommunityStats(communityId: string): Promise<CommunityStats> {
  const query = `
    query GetCommunityStats($communityId: ID!) {
      getCommunityStats(communityId: $communityId) {
        memberCount
        pendingRequestCount
        postCount
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCommunityStats: CommunityStats }>(
    query,
    { communityId }
  );
  return data.getCommunityStats;
}

export async function listCommunityMembers(
  communityId: string,
  limit = 20,
  offset = 0
): Promise<MemberDetailsListResponse> {
  const query = `
    query ListCommunityMembers($communityId: ID!, $limit: Int, $offset: Int) {
      listCommunityMembers(communityId: $communityId, limit: $limit, offset: $offset) {
        members {
          userId
          role
          status
          joinedAt
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ listCommunityMembers: MemberDetailsListResponse }>(
    query,
    { communityId, limit, offset }
  );
  return data.listCommunityMembers;
}

/** Same shape as {@link listCommunityMembers}; use when `scopeType === "ASSOCIATION"`. */
export async function listAssociationMembers(
  associationId: string,
  limit = 20,
  offset = 0
): Promise<MemberDetailsListResponse> {
  const query = `
    query ListAssociationMembers($associationId: ID!, $limit: Int, $offset: Int) {
      listAssociationMembers(associationId: $associationId, limit: $limit, offset: $offset) {
        members {
          userId
          role
          status
          joinedAt
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    listAssociationMembers: MemberDetailsListResponse;
  }>(query, { associationId, limit, offset });
  return data.listAssociationMembers;
}

export async function getMemberDetails(
  userId: string,
  entityId: string,
  entityType: string
): Promise<MemberDetails> {
  const query = `
    query GetMemberDetails($userId: ID!, $entityId: ID!, $entityType: String!) {
      getMemberDetails(userId: $userId, entityId: $entityId, entityType: $entityType) {
        userId
        role
        status
        joinedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getMemberDetails: MemberDetails }>(query, {
    userId,
    entityId,
    entityType,
  });
  return data.getMemberDetails;
}

export async function searchMembers(
  entityId: string,
  entityType: string,
  searchTerm: string,
  limit = 20
): Promise<MemberDetails[]> {
  const query = `
    query SearchMembers($entityId: ID!, $entityType: String!, $searchTerm: String!, $limit: Int) {
      searchMembers(
        entityId: $entityId
        entityType: $entityType
        searchTerm: $searchTerm
        limit: $limit
      ) {
        userId
        role
        status
        joinedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ searchMembers: MemberDetails[] }>(query, {
    entityId,
    entityType,
    searchTerm,
    limit,
  });
  return data.searchMembers;
}

export async function listPendingMemberships(
  input: ListPendingMembershipsInput
): Promise<PendingMembershipListResponse> {
  const query = `
    query ListPendingMemberships($input: ListPendingMembershipsInput!) {
      listPendingMemberships(input: $input) {
        requests {
          id
          userId
          entityId
          entityType
          status
          entityName
          requestedAt
          createdAt
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    listPendingMemberships: PendingMembershipListResponse;
  }>(query, { input });
  return data.listPendingMemberships;
}

export async function listPendingInvitationsByEntity(
  input: ListPendingInvitationsByEntityInput
): Promise<PendingInvitationListResponse> {
  const query = `
    query ListPendingInvitationsByEntity($input: ListPendingInvitationsByEntityInput!) {
      listPendingInvitationsByEntity(input: $input) {
        invitations {
          id
          userId
          entityId
          entityType
          status
          entityName
          invitedAt
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    listPendingInvitationsByEntity: PendingInvitationListResponse;
  }>(query, { input });
  return data.listPendingInvitationsByEntity;
}

export async function getBannedUsers(
  entityId: string,
  entityType: string
): Promise<BannedUser[]> {
  const query = `
    query GetBannedUsers($entityId: ID!, $entityType: String!) {
      getBannedUsers(entityId: $entityId, entityType: $entityType) {
        userId
        bannedBy
        reason
        bannedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getBannedUsers: BannedUser[] }>(query, {
    entityId,
    entityType,
  });
  return data.getBannedUsers;
}

export async function getSuspendedUsers(
  entityId: string,
  entityType: string
): Promise<SuspendedUser[]> {
  const query = `
    query GetSuspendedUsers($entityId: ID!, $entityType: String!) {
      getSuspendedUsers(entityId: $entityId, entityType: $entityType) {
        userId
        suspendedBy
        reason
        suspendedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getSuspendedUsers: SuspendedUser[] }>(query, {
    entityId,
    entityType,
  });
  return data.getSuspendedUsers;
}

export async function getModerationLogs(
  entityId: string,
  entityType: string,
  limit = 20,
  offset = 0
): Promise<ModerationLog[]> {
  const query = `
    query GetModerationLogs($entityId: ID!, $entityType: String!, $limit: Int, $offset: Int) {
      getModerationLogs(
        entityId: $entityId
        entityType: $entityType
        limit: $limit
        offset: $offset
      ) {
        id
        entityId
        entityType
        action
        performedBy
        targetUser
        details
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getModerationLogs: ModerationLog[] }>(query, {
    entityId,
    entityType,
    limit,
    offset,
  });
  return data.getModerationLogs;
}

export async function getCommunityReports(
  communityId: string,
  status?: string,
  type?: string,
  limit = 20,
  offset = 0,
): Promise<CommunityReportListResponse> {
  const query = `
    query GetCommunityReports(
      $communityId: ID!
      $status: String
      $type: String
      $limit: Int
      $offset: Int
    ) {
      getCommunityReports(
        communityId: $communityId
        status: $status
        type: $type
        limit: $limit
        offset: $offset
      ) {
        items {
          id
          type
          status
          reporterId
          reporterName
          targetId
          targetType
          description
          createdAt
          resolvedAt
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCommunityReports: CommunityReportListResponse }>(
    query,
    { communityId, status, type, limit, offset },
  );
  return data.getCommunityReports;
}

export async function getCommunityAssociations(communityId: string): Promise<Association[]> {
  const query = `
    query GetCommunityAssociations($communityId: ID!) {
      getCommunityAssociations(communityId: $communityId) {
        id
        name
        description
        visibility
        joinPolicy
        contactEmail
        website
        countriesServed
        avatarUrl
        createdAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCommunityAssociations: Association[] }>(
    query,
    { communityId }
  );
  return data.getCommunityAssociations;
}

export async function getCommunityAnalytics(
  communityId: string,
  period: AnalyticsPeriod = "MONTHLY",
): Promise<CommunityAnalytics> {
  const query = `
    query GetCommunityAnalytics($communityId: ID!, $period: String!) {
      getCommunityAnalytics(communityId: $communityId, period: $period) {
        period
        points {
          label
          posts
          interactions
          newMembers
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCommunityAnalytics: CommunityAnalytics }>(
    query,
    { communityId, period },
  );
  return data.getCommunityAnalytics;
}
