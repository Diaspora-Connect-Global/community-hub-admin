import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";

/** A notification directed to the signed-in admin about the entity they manage. */
export interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationsPage {
  notifications: AdminNotificationItem[];
  total: number;
  unreadCount: number;
}

const MY_ADMIN_NOTIFICATIONS = /* GraphQL */ `
  query MyAdminNotifications($entityType: String, $entityId: String, $limit: Int, $offset: Int) {
    myAdminNotifications(scope: ENTITY, entityType: $entityType, entityId: $entityId, limit: $limit, offset: $offset) {
      notifications {
        id
        type
        title
        message
        isRead
        createdAt
      }
      total
      unreadCount
    }
  }
`;

const MARK_MY_ADMIN_NOTIFICATIONS_READ = /* GraphQL */ `
  mutation MarkMyAdminNotificationsRead($entityType: String, $entityId: String) {
    markMyAdminNotificationsRead(scope: ENTITY, entityType: $entityType, entityId: $entityId) {
      success
    }
  }
`;

const MARK_NOTIFICATION_AS_READ = /* GraphQL */ `
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId) {
      success
    }
  }
`;

/** Only notifications about this community - never the admin's personal inbox. */
export async function getMyAdminNotifications(
  entityType: "COMMUNITY" | "ASSOCIATION",
  entityId: string,
  limit = 20,
  offset = 0,
): Promise<AdminNotificationsPage> {
  const data = await graphqlRequestWithAuth<{ myAdminNotifications: AdminNotificationsPage }>(
    MY_ADMIN_NOTIFICATIONS,
    { entityType, entityId, limit, offset },
  );
  return data.myAdminNotifications;
}

export async function markMyAdminNotificationsRead(
  entityType: "COMMUNITY" | "ASSOCIATION",
  entityId: string,
): Promise<boolean> {
  const data = await graphqlRequestWithAuth<{ markMyAdminNotificationsRead: { success: boolean } }>(
    MARK_MY_ADMIN_NOTIFICATIONS_READ,
    { entityType, entityId },
  );
  return data.markMyAdminNotificationsRead.success;
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<{ markNotificationAsRead: { success: boolean } }>(
    MARK_NOTIFICATION_AS_READ,
    { notificationId },
  );
  return data.markNotificationAsRead.success;
}
