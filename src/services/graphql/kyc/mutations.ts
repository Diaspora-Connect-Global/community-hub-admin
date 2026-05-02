import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";

export interface VerificationActionResponse {
  success: boolean;
  message?: string;
  reviewedAt?: string;
}

export async function approveVerification(
  verificationId: string,
): Promise<VerificationActionResponse> {
  const mutation = `
    mutation ApproveVerification($verificationId: ID!) {
      approveVerification(verificationId: $verificationId) {
        success
        message
        reviewedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    approveVerification: VerificationActionResponse;
  }>(mutation, { verificationId });
  return data.approveVerification;
}

export async function rejectVerification(
  verificationId: string,
  reason?: string,
): Promise<VerificationActionResponse> {
  const mutation = `
    mutation RejectVerification($verificationId: ID!, $reason: String) {
      rejectVerification(verificationId: $verificationId, reason: $reason) {
        success
        message
        reviewedAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{
    rejectVerification: VerificationActionResponse;
  }>(mutation, { verificationId, reason });
  return data.rejectVerification;
}
