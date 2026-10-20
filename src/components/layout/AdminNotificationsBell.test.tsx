// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const getMyAdminNotifications = vi.fn();
vi.mock("@/services/graphql/notifications", () => ({
  getMyAdminNotifications: (...a: unknown[]) => getMyAdminNotifications(...a),
  markMyAdminNotificationsRead: vi.fn(async () => true),
  markNotificationRead: vi.fn(async () => true),
}));
const EN: Record<string, string> = {
  "adminNotifications.title": "Notifications",
  "adminNotifications.empty": "Nothing needs your attention right now.",
  "adminNotifications.markAllRead": "Mark all read",
  "adminNotifications.loadError": "Couldn't load notifications.",
  "adminNotifications.unread": "unread",
  "adminNotifications.refresh": "Refresh",
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => EN[k] ?? k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

import { AdminNotificationsBell } from "./AdminNotificationsBell";

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const UUID = "0b9a6b1e-5f1c-4a52-9f0b-1d2c3e4f5a6b";

describe("AdminNotificationsBell", () => {
  beforeEach(() => getMyAdminNotifications.mockReset());
  afterEach(() => cleanup());

  it("asks only for the managed community's directed notifications", async () => {
    getMyAdminNotifications.mockResolvedValue({ notifications: [], total: 0, unreadCount: 0 });
    wrap(<AdminNotificationsBell communityId="comm-1" />);
    await waitFor(() => expect(getMyAdminNotifications).toHaveBeenCalledWith("COMMUNITY", "comm-1"));
  });

  it("does not query without an community", () => {
    wrap(<AdminNotificationsBell communityId={null} />);
    expect(getMyAdminNotifications).not.toHaveBeenCalled();
  });

  it("badge equals the server unread count and the list shows the directed items without ids", async () => {
    getMyAdminNotifications.mockResolvedValue({
      notifications: [
        { id: "n1", type: "servicerequest.approved", title: "Request approved", message: `Ref ${UUID}`, isRead: false, createdAt: "2026-10-19T10:00:00Z" },
        { id: "n2", type: "case.assigned", title: "Case assigned", message: "A case is yours", isRead: true, createdAt: "2026-10-19T09:00:00Z" },
      ],
      total: 2,
      unreadCount: 1,
    });
    wrap(<AdminNotificationsBell communityId="comm-1" />);
    await waitFor(() => expect(screen.getByTestId("admin-notif-badge").textContent).toBe("1"));
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("Request approved")).toBeTruthy();
    expect(screen.getByText("Case assigned")).toBeTruthy();
    expect(screen.queryByText(new RegExp(UUID))).toBeNull();
    expect(document.body.textContent).not.toContain("n1");
  });

  it("shows the empty state", async () => {
    getMyAdminNotifications.mockResolvedValue({ notifications: [], total: 0, unreadCount: 0 });
    wrap(<AdminNotificationsBell communityId="comm-1" />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    await waitFor(() => expect(screen.getByText("Nothing needs your attention right now.")).toBeTruthy());
  });
});
