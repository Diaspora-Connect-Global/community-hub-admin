import { graphqlRequestWithAuth } from "../../authentication/adminAuthService";
import type { AdminCommonResponse } from "./types";

export interface AdminProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  notificationPreferences: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  };
}

export interface AdminSession {
  sessionId: string;
  device?: string;
  browser?: string;
  ipAddress?: string;
  location?: string;
  lastActive?: string;
  isCurrent: boolean;
}

export interface UpdateAdminProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UpdateNotificationPreferencesInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface AdminAvatarUploadUrlResponse {
  uploadUrl: string;
  readUrl: string;
}

export interface TwoFactorResponse {
  success: boolean;
  message?: string;
  /** Base64-encoded QR code PNG (only returned when method is "APP") */
  qrCode?: string;
}

export interface VerifyTwoFactorResponse {
  success: boolean;
  message?: string;
}

export async function getCurrentAdmin(): Promise<AdminProfile> {
  const query = `
    query GetCurrentAdmin {
      getCurrentAdmin {
        id
        firstName
        lastName
        email
        phone
        avatarUrl
        twoFactorEnabled
        notificationPreferences {
          emailEnabled
          pushEnabled
          inAppEnabled
        }
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getCurrentAdmin: AdminProfile }>(query);
  return data.getCurrentAdmin;
}

export async function getAdminActiveSessions(): Promise<AdminSession[]> {
  const query = `
    query GetAdminActiveSessions {
      getAdminActiveSessions {
        sessionId
        device
        browser
        ipAddress
        location
        lastActive
        isCurrent
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getAdminActiveSessions: AdminSession[] }>(query);
  return data.getAdminActiveSessions;
}

export async function updateAdminProfile(
  input: UpdateAdminProfileInput,
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation UpdateAdminProfile($input: UpdateAdminProfileInput!) {
      updateAdminProfile(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { updateAdminProfile: AdminCommonResponse },
    { input: UpdateAdminProfileInput }
  >(mutation, { input });
  return data.updateAdminProfile;
}

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
      updateNotificationPreferences(input: $input) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { updateNotificationPreferences: AdminCommonResponse },
    { input: UpdateNotificationPreferencesInput }
  >(mutation, { input });
  return data.updateNotificationPreferences;
}

/** Wave 1 backend: change current admin's password */
export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AdminCommonResponse> {
  const mutation = `
    mutation UpdateAdminPassword($currentPassword: String!, $newPassword: String!) {
      updateAdminPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { updateAdminPassword: AdminCommonResponse },
    { currentPassword: string; newPassword: string }
  >(mutation, { currentPassword, newPassword });
  return data.updateAdminPassword;
}

/** Wave 1 backend: request a presigned upload URL for the admin's own avatar */
export async function requestAdminAvatarUploadUrl(
  filename: string,
  contentType: string,
): Promise<AdminAvatarUploadUrlResponse> {
  const mutation = `
    mutation RequestAdminAvatarUploadUrl($filename: String!, $contentType: String!) {
      requestAdminAvatarUploadUrl(filename: $filename, contentType: $contentType) {
        uploadUrl
        readUrl
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { requestAdminAvatarUploadUrl: AdminAvatarUploadUrlResponse },
    { filename: string; contentType: string }
  >(mutation, { filename, contentType });
  return data.requestAdminAvatarUploadUrl;
}

/** Wave 1 backend: initiate 2FA setup; returns qrCode for APP method */
export async function enableTwoFactor(
  method: "APP" | "SMS",
): Promise<TwoFactorResponse> {
  const mutation = `
    mutation EnableTwoFactor($method: String!) {
      enableTwoFactor(method: $method) {
        success
        message
        qrCode
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { enableTwoFactor: TwoFactorResponse },
    { method: string }
  >(mutation, { method });
  return data.enableTwoFactor;
}

/** Wave 1 backend: verify TOTP/SMS code to complete 2FA setup */
export async function verifyTwoFactor(
  code: string,
): Promise<VerifyTwoFactorResponse> {
  const mutation = `
    mutation VerifyTwoFactor($code: String!) {
      verifyTwoFactor(code: $code) {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<
    { verifyTwoFactor: VerifyTwoFactorResponse },
    { code: string }
  >(mutation, { code });
  return data.verifyTwoFactor;
}

/** Wave 1 backend: disable 2FA entirely */
export async function disableTwoFactor(): Promise<AdminCommonResponse> {
  const mutation = `
    mutation DisableTwoFactor {
      disableTwoFactor {
        success
        message
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ disableTwoFactor: AdminCommonResponse }>(mutation);
  return data.disableTwoFactor;
}
