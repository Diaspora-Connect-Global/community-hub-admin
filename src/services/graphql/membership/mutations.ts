import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type {
  CancelMembershipSubscriptionInput,
  CancelMembershipSubscriptionResult,
  RequestMembershipInput,
  RequestMembershipResult,
} from "./types";

const REQUEST_MEMBERSHIP = `
  mutation RequestMembership($input: RequestMembershipInput!) {
    requestMembership(input: $input) {
      id
      status
      message
      requiresPayment
      clientSecret
    }
  }
`;

const CANCEL_MEMBERSHIP_SUBSCRIPTION = `
  mutation CancelMembershipSubscription($input: CancelMembershipSubscriptionInput!) {
    cancelMembershipSubscription(input: $input) {
      success
      message
    }
  }
`;

export async function requestMembership(
  input: RequestMembershipInput
): Promise<RequestMembershipResult> {
  const data = await graphqlRequestWithAuth<
    { requestMembership: RequestMembershipResult },
    { input: RequestMembershipInput }
  >(REQUEST_MEMBERSHIP, { input });
  return data.requestMembership;
}

export async function cancelMembershipSubscription(
  input: CancelMembershipSubscriptionInput
): Promise<CancelMembershipSubscriptionResult> {
  const data = await graphqlRequestWithAuth<
    { cancelMembershipSubscription: CancelMembershipSubscriptionResult },
    { input: CancelMembershipSubscriptionInput }
  >(CANCEL_MEMBERSHIP_SUBSCRIPTION, { input });
  return data.cancelMembershipSubscription;
}
