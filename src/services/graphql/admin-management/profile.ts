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
