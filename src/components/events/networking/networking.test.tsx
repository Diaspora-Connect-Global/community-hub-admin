import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("@/services/graphql/eventNetworking", async () => {
  const actual = await vi.importActual<typeof import("@/services/graphql/eventNetworking")>("@/services/graphql/eventNetworking");
  return {
    ...actual,
    fetchOrganizerDashboard: vi.fn(),
    listRegistrationsByStatus: vi.fn(),
    approveRegistration: vi.fn(),
    rejectRegistration: vi.fn(),
  };
});
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import * as api from "@/services/graphql/eventNetworking";
import type { ManagedRegistration } from "@/services/graphql/eventNetworking";
import { EventsDashboard } from "./EventsDashboard";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { toast } from "@/hooks/use-toast";

beforeAll(() => {
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
const later = new Date(Date.now() + 5 * 86_400_000 + 3_600_000).toISOString();
const past = new Date(Date.now() - 20 * 86_400_000).toISOString();
const pastEnd = new Date(Date.now() - 20 * 86_400_000 + 3_600_000).toISOString();

const dashboard = {
  events: [
    {
      eventId: "e1", title: "Spring Gala", startAt: future, endAt: later, status: "published", capacity: 100,
      registrationsByStatus: [{ status: "confirmed", count: 40 }, { status: "pending_approval", count: 3 }, { status: "waitlisted", count: 2 }],
      checkedInCount: 0, revenue: [{ currency: "GHS", amountMinor: "250000" }, { currency: "USD", amountMinor: "10000" }],
      fillRate: 0.4, communityJoins: null, communityJoinsPending: null,
    },
    {
      eventId: "e2", title: "Founders Brunch", startAt: past, endAt: pastEnd, status: "completed", capacity: null,
      registrationsByStatus: [{ status: "confirmed", count: 10 }], checkedInCount: 5, revenue: [],
      fillRate: null, communityJoins: 0, communityJoinsPending: 0,
    },
  ],
  totals: {
    eventCount: 2, checkedInCount: 5,
    registrationsByStatus: [{ status: "confirmed", count: 50 }, { status: "pending_approval", count: 3 }],
    revenue: [{ currency: "GHS", amountMinor: "250000" }, { currency: "USD", amountMinor: "10000" }],
  },
  nextCursor: null, pageCommunityJoins: null,
};

describe("EventsDashboard", () => {
  it("groups upcoming and past, keeps currencies apart and shows a dash for unknown joins", async () => {
    vi.mocked(api.fetchOrganizerDashboard).mockResolvedValue(dashboard);
    render(<EventsDashboard ownerType="COMMUNITY" ownerId="c1" locale="en-US" />);
    await screen.findByText("Spring Gala");

    const upcoming = screen.getByRole("region", { name: "Upcoming" });
    const row = within(upcoming).getByText("Spring Gala").closest("tr")!;
    // unknown joins → "—", not 0
    expect(within(row).getAllByText("—").length).toBeGreaterThan(0);
    // revenue per currency, never merged
    expect(within(row).getByText("$100.00")).toBeTruthy();
    expect(within(row).getByText(/2,500\.00/)).toBeTruthy();
    // pending approvals badge
    expect(within(row).getByText("3")).toBeTruthy();

    const pastSection = screen.getByRole("region", { name: "Past" });
    const pastRow = within(pastSection).getByText("Founders Brunch").closest("tr")!;
    expect(within(pastRow).getByText("No limit")).toBeTruthy();
    expect(within(pastRow).getByText("50%")).toBeTruthy(); // 5 of 10 checked in
    // a known zero is shown as 0
    expect(within(pastRow).getAllByText("0").length).toBeGreaterThan(0);
  });

  it("states honestly when there are no events", async () => {
    vi.mocked(api.fetchOrganizerDashboard).mockResolvedValue({ events: [], totals: null, nextCursor: null, pageCommunityJoins: null });
    render(<EventsDashboard ownerType="COMMUNITY" ownerId="c1" />);
    expect(await screen.findByText("No events in this period")).toBeTruthy();
  });

  it("maps the dark-launch refusal to 'not available yet'", async () => {
    vi.mocked(api.fetchOrganizerDashboard).mockRejectedValue(new api.EventOperationError("This isn't available yet.", ["EVENT_FEATURE_UNAVAILABLE"]));
    render(<EventsDashboard ownerType="COMMUNITY" ownerId="c1" />);
    expect(await screen.findByText("This isn't available yet.")).toBeTruthy();
  });
});

describe("ApprovalsPanel", () => {
  const person = (id: string, first: string, pos: number | null = null): ManagedRegistration => ({
    id, eventId: "e1", status: "x", registrationStatus: null, waitlistPosition: pos, quantity: 1,
    totalAmount: null, currency: null, registeredAt: null, user: { firstName: first, lastName: "Mensah", email: null, avatarUrl: null },
  });

  const onlyPending = (rows: ManagedRegistration[]) =>
    vi.mocked(api.listRegistrationsByStatus).mockImplementation(async (_e, status) =>
      status === "PENDING_APPROVAL" ? { registrations: rows, total: rows.length } : { registrations: [], total: 0 });

  it("lists pending people and waitlist ordered by position, with no ids on screen", async () => {
    vi.mocked(api.listRegistrationsByStatus).mockImplementation(async (_e, status) =>
      status === "PENDING_APPROVAL"
        ? { registrations: [person("11111111-2222-3333-4444-555555555555", "Ama")], total: 1 }
        : { registrations: [person("r3", "Kofi", 2), person("r2", "Esi", 1)], total: 2 });
    const { container } = render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    const text = container.textContent ?? "";
    expect(text.indexOf("Esi")).toBeLessThan(text.indexOf("Kofi"));
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
  });

  it("declines with the typed reason and refreshes", async () => {
    onlyPending([person("r1", "Ama")]);
    vi.mocked(api.rejectRegistration).mockResolvedValue({ id: "r1", status: "rejected", registrationStatus: "REJECTED" });
    render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    fireEvent.click(screen.getAllByRole("button", { name: /decline/i })[0]);
    fireEvent.change(await screen.findByLabelText(/reason/i), { target: { value: "Event is members only" } });
    fireEvent.click(screen.getByRole("button", { name: /decline registration/i }));
    await waitFor(() => expect(api.rejectRegistration).toHaveBeenCalledWith("r1", "Event is members only"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Registration declined" })));
  });

  it("shows a refused approval as a friendly message, not as success", async () => {
    onlyPending([person("r1", "Ama")]);
    vi.mocked(api.approveRegistration).mockRejectedValue(new api.EventOperationError("That can't be done in the registration's current state. Refresh and try again.", ["EVENT_CONFLICT"]));
    render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    fireEvent.click(screen.getAllByRole("button", { name: /approve/i })[0]);
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Could not approve", variant: "destructive" })));
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Registration approved" }));
  });
});
