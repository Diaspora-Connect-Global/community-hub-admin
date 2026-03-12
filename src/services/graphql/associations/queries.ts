import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  ASSOCIATION_DETAIL_FRAGMENT,
  ASSOCIATION_MEMBER_FRAGMENT,
  ASSOCIATION_SUMMARY_FRAGMENT,
} from "./fragments";
import type {
  AssociationDetail,
  AssociationMemberStatus,
  AssociationMembersResponse,
  AssociationPendingRequestsResponse,
  AssociationStats,
  AssociationTypeDefinition,
  SearchAssociationsInput,
  SearchAssociationsResponse,
} from "./types";

const LIST_ASSOCIATION_TYPES = `
  query ListAssociationTypes {
    listAssociationTypes {
      id
      name
      description
    }
  }
`;

const GET_ASSOCIATION = `
  ${ASSOCIATION_DETAIL_FRAGMENT}
  query GetAssociation($id: ID!) {
    getAssociation(id: $id) {
      ...AssociationDetailFields
    }
  }
`;

const SEARCH_ASSOCIATIONS = `
  ${ASSOCIATION_SUMMARY_FRAGMENT}
  query SearchAssociations($input: SearchAssociationsInput!) {
    searchAssociations(input: $input) {
      associations {
        ...AssociationSummaryFields
      }
      total
      page
      limit
    }
  }
`;

const GET_ASSOCIATION_STATS = `
  query GetAssociationStats($associationId: ID!) {
    getAssociationStats(associationId: $associationId) {
      totalMembers
      activeMembers
      pendingRequests
    }
  }
`;

const GET_ASSOCIATION_MEMBERS = `
  ${ASSOCIATION_MEMBER_FRAGMENT}
  query GetAssociationMembers($associationId: ID!, $page: Int, $limit: Int, $status: String) {
    getAssociationMembers(
      associationId: $associationId
      page: $page
      limit: $limit
      status: $status
    ) {
      members {
        ...AssociationMemberFields
      }
      total
      page
    }
  }
`;

const GET_PENDING_MEMBERSHIP_REQUESTS = `
  query GetPendingMembershipRequests($entityId: ID!, $entityType: String!) {
    getPendingMembershipRequests(entityId: $entityId, entityType: $entityType) {
      requests {
        userId
        requestedAt
        message
      }
      total
    }
  }
`;

export async function listAssociationTypes(): Promise<AssociationTypeDefinition[]> {
  const data = await graphqlRequestWithAuth<{ listAssociationTypes: AssociationTypeDefinition[] }>(
    LIST_ASSOCIATION_TYPES,
  );
  return data.listAssociationTypes;
}

export async function getAssociation(id: string): Promise<AssociationDetail> {
  const data = await graphqlRequestWithAuth<{ getAssociation: AssociationDetail }, { id: string }>(
    GET_ASSOCIATION,
    { id },
  );
  return data.getAssociation;
}

export async function searchAssociations(
  input: SearchAssociationsInput,
): Promise<SearchAssociationsResponse> {
  const data = await graphqlRequestWithAuth<
    { searchAssociations: SearchAssociationsResponse },
    { input: SearchAssociationsInput }
  >(SEARCH_ASSOCIATIONS, { input });
  return data.searchAssociations;
}

export async function getAssociationStats(associationId: string): Promise<AssociationStats> {
  const data = await graphqlRequestWithAuth<
    { getAssociationStats: AssociationStats },
    { associationId: string }
  >(GET_ASSOCIATION_STATS, { associationId });
  return data.getAssociationStats;
}

export async function getAssociationMembers(
  associationId: string,
  page = 1,
  limit = 20,
  status?: AssociationMemberStatus,
): Promise<AssociationMembersResponse> {
  const data = await graphqlRequestWithAuth<
    { getAssociationMembers: AssociationMembersResponse },
    { associationId: string; page: number; limit: number; status?: AssociationMemberStatus }
  >(GET_ASSOCIATION_MEMBERS, { associationId, page, limit, status });
  return data.getAssociationMembers;
}

export async function getPendingMembershipRequests(
  entityId: string,
  entityType: "ASSOCIATION" = "ASSOCIATION",
): Promise<AssociationPendingRequestsResponse> {
  const data = await graphqlRequestWithAuth<
    { getPendingMembershipRequests: AssociationPendingRequestsResponse },
    { entityId: string; entityType: "ASSOCIATION" }
  >(GET_PENDING_MEMBERSHIP_REQUESTS, { entityId, entityType });
  return data.getPendingMembershipRequests;
}
