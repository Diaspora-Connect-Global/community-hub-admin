import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type { CommunityVerificationListResponse } from "./types";

export async function getCommunityVerifications(
  communityId: string,
  status?: string,
  limit = 20,
  offset = 0,
): Promise<CommunityVerificationListResponse> {
  const query = `
    query GetCommunityVerifications(
      $communityId: ID!
      $status: String
      $limit: Int
      $offset: Int
    ) {
      getCommunityVerifications(
        communityId: $communityId
        status: $status
        limit: $limit
        offset: $offset
      ) {
        items {
          id
          userId
          userName
          userEmail
          communityId
          docType
          documentDetails
          submittedAt
          reviewedAt
          reviewedBy
          rejectionReason
          status
        }
        total
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    getCommunityVerifications: CommunityVerificationListResponse;
  }>(query, { communityId, status, limit, offset });
  return data.getCommunityVerifications;
}
