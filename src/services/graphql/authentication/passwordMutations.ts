import { graphqlRequest } from "@/services/graphql/client";

const FORGOT_PASSWORD = `
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

const RESET_PASSWORD = `
  mutation ResetPassword($email: String!, $resetCode: String!, $newPassword: String!) {
    resetPassword(email: $email, resetCode: $resetCode, newPassword: $newPassword)
  }
`;

/**
 * Request a password-reset code by email.
 *
 * The gateway always responds with a human-readable status STRING — never throws for a
 * missing account (to avoid email enumeration): "Password reset instructions sent to …"
 * on success, "Password reset failed: …" on error. Use {@link passwordMutationError} to branch.
 */
export async function forgotPasswordMutation(email: string): Promise<string> {
  const data = await graphqlRequest<{ forgotPassword: string }, { email: string }>(
    FORGOT_PASSWORD,
    { email },
  );
  return data.forgotPassword;
}

/**
 * Complete a password reset using the emailed code.
 *
 * Returns the gateway's status string ("Password reset successfully! …" on success,
 * "Password reset failed: …" on error). Use {@link passwordMutationError} to branch.
 */
export async function resetPasswordMutation(input: {
  email: string;
  resetCode: string;
  newPassword: string;
}): Promise<string> {
  const data = await graphqlRequest<
    { resetPassword: string },
    { email: string; resetCode: string; newPassword: string }
  >(RESET_PASSWORD, input);
  return data.resetPassword;
}

/**
 * The forgotPassword / resetPassword gateway mutations signal failure with a
 * "Password reset failed: …" status string rather than throwing. Returns the cleaned-up
 * error message when the result represents a failure, or null when it represents success.
 */
export function passwordMutationError(result: string): string | null {
  if (/reset failed/i.test(result)) {
    return (
      result.replace(/^Password reset failed:\s*/i, "").trim() ||
      "Request failed. Please try again."
    );
  }
  return null;
}
