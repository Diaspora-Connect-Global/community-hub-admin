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

export async function forgotPasswordMutation(email: string): Promise<unknown> {
  const data = await graphqlRequest<{ forgotPassword: unknown }, { email: string }>(
    FORGOT_PASSWORD,
    { email },
  );
  return data.forgotPassword;
}

export async function resetPasswordMutation(input: {
  email: string;
  resetCode: string;
  newPassword: string;
}): Promise<unknown> {
  const data = await graphqlRequest<
    { resetPassword: unknown },
    { email: string; resetCode: string; newPassword: string }
  >(RESET_PASSWORD, input);
  return data.resetPassword;
}
