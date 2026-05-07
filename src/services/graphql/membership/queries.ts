import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type { MyMembershipResult } from "./types";

const MY_MEMBERSHIP = `
  query MyMembership($entityId: ID!, $entityType: String!) {
    myMembership(entityId: $entityId, entityType: $entityType) {
      id
      status
      requiresPayment
      expiresAt
      hasActiveSubscription
      entityName
    }
  }
`;

export async function getMyMembership(
  entityId: string,
  entityType: "ASSOCIATION" | "COMMUNITY"
): Promise<MyMembershipResult | null> {
  const data = await graphqlRequestWithAuth<
    { myMembership: MyMembershipResult | null },
    { entityId: string; entityType: "ASSOCIATION" | "COMMUNITY" }
  >(MY_MEMBERSHIP, { entityId, entityType });
  return data.myMembership;
}
