import { describe, expect, it } from "vitest";
import {
  checkInRate, countForStatus, eventErrorMessage, eventPhase, filterNavForEventsOnly, formatJoins, formatMinor,
  formatPercent, isEventsOnly, isFeatureUnavailable, isPathAllowed, normalizeRegistrationStatus,
  paymentLabelOverride, rangeForPreset, registrationStatusLabel, registrationStatusTone, revenueLines, staffRoleLabel,
} from "./eventNetworking";

describe("events-only detection", () => {
  it("is true only when the services are exactly ['events']", () => {
    expect(isEventsOnly(["events"])).toBe(true);
    expect(isEventsOnly([" Events "])).toBe(true);
    expect(isEventsOnly(["events", "events"])).toBe(true);
  });
  it("is false for more services, none, or an unloaded record", () => {
    expect(isEventsOnly(["events", "posts"])).toBe(false);
    expect(isEventsOnly(["posts"])).toBe(false);
    expect(isEventsOnly([])).toBe(false);
    expect(isEventsOnly(null)).toBe(false);
    expect(isEventsOnly(undefined)).toBe(false);
  });
  const nav = ["dashboard", "posts", "events", "members", "marketplace", "rolesAdmins", "settings", "audit"].map((id) => ({ id }));
  const keep = ["dashboard", "events", "members", "rolesAdmins", "settings", "audit"];
  it("keeps only event-related menu entries when events-only", () => {
    expect(filterNavForEventsOnly(nav, true, keep).map((i) => i.id)).toEqual(keep);
  });
  it("keeps the whole menu otherwise", () => {
    expect(filterNavForEventsOnly(nav, false, keep)).toHaveLength(nav.length);
  });
  it("routes: allowed paths and their children pass, everything else is gated", () => {
    const allowed = ["/", "/events", "/members"];
    expect(isPathAllowed("/", allowed)).toBe(true);
    expect(isPathAllowed("/events", allowed)).toBe(true);
    expect(isPathAllowed("/events/123", allowed)).toBe(true);
    expect(isPathAllowed("/posts", allowed)).toBe(false);
    expect(isPathAllowed("/eventsX", allowed)).toBe(false);
  });
});

describe("money per currency", () => {
  it("divides minor units by 100 only at display", () => {
    expect(formatMinor("12550", "GHS", "en-US")).toContain("125.50");
    expect(formatMinor(1000, "USD", "en-US")).toBe("$10.00");
  });
  it("shows a dash, not zero, for missing or non-numeric amounts", () => {
    expect(formatMinor(null, "USD")).toBe("—");
    expect(formatMinor("abc", "USD")).toBe("—");
    expect(formatMinor(100, "")).toBe("—");
  });
  it("never sums across currencies", () => {
    const lines = revenueLines(
      [
        { currency: "usd", amountMinor: "1000" },
        { currency: "GHS", amountMinor: "2550" },
        { currency: "USD", amountMinor: "500" },
      ],
      "en-US",
    );
    expect(lines.map((l) => l.currency)).toEqual(["GHS", "USD"]);
    expect(lines.find((l) => l.currency === "USD")?.text).toBe("$15.00");
    expect(lines.find((l) => l.currency === "GHS")?.text).toContain("25.50");
  });
  it("has no revenue lines when nothing was paid", () => {
    expect(revenueLines([])).toEqual([]);
    expect(revenueLines(undefined)).toEqual([]);
  });
});

describe("unknown community joins", () => {
  it("null / undefined show a dash, a real zero stays 0", () => {
    expect(formatJoins(null)).toBe("—");
    expect(formatJoins(undefined)).toBe("—");
    expect(formatJoins(0)).toBe("0");
    expect(formatJoins(1234)).toBe((1234).toLocaleString());
  });
  it("percent: null is a dash", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(0.456)).toBe("46%");
  });
});

describe("registration statuses", () => {
  it("normalises case and separators", () => {
    expect(normalizeRegistrationStatus("pending approval")).toBe("PENDING_APPROVAL");
    expect(normalizeRegistrationStatus("Pending-Approval")).toBe("PENDING_APPROVAL");
  });
  it("labels the new statuses", () => {
    expect(registrationStatusLabel("PENDING_APPROVAL")).toBe("Awaiting approval");
    expect(registrationStatusLabel("waitlisted")).toBe("Waitlisted");
    expect(registrationStatusLabel("REJECTED")).toBe("Declined");
    expect(registrationStatusLabel("SOMETHING_NEW")).toBe("Something new");
    expect(registrationStatusLabel("")).toBe("Unknown");
  });
  it("tones", () => {
    expect(registrationStatusTone("PENDING_APPROVAL")).toBe("warning");
    expect(registrationStatusTone("REJECTED")).toBe("danger");
    expect(registrationStatusTone("nope")).toBe("muted");
  });
  it("counts by status case-insensitively", () => {
    const counts = [{ status: "confirmed", count: 4 }, { status: "pending_approval", count: 2 }];
    expect(countForStatus(counts, "CONFIRMED")).toBe(4);
    expect(countForStatus(counts, "WAITLISTED")).toBe(0);
    expect(countForStatus(null, "CONFIRMED")).toBe(0);
  });
  it("a registration awaiting approval is never labelled Paid", () => {
    expect(paymentLabelOverride("PENDING_APPROVAL")).toBe("Pending");
    expect(paymentLabelOverride("WAITLISTED")).toBe("Pending");
    expect(paymentLabelOverride("REJECTED")).toBe("—");
    expect(paymentLabelOverride("CONFIRMED")).toBeNull();
  });
  it("staff role labels", () => {
    expect(staffRoleLabel("NETWORKING_MANAGER")).toBe("Networking manager");
    expect(staffRoleLabel("EVENT_MANAGER")).toBe("Event manager");
  });
});

describe("error-code mapping", () => {
  it("reads the dark-launch refusal as 'not available yet'", () => {
    const errs = [{ code: "EVENT_FEATURE_UNAVAILABLE", message: "x" }];
    expect(isFeatureUnavailable(errs)).toBe(true);
    expect(eventErrorMessage(errs)).toBe("This isn't available yet.");
  });
  it("maps conflict / rate-limit / not-found codes to fixed wording", () => {
    expect(eventErrorMessage([{ code: "EVENT_CONFLICT" }])).toMatch(/current state/);
    expect(eventErrorMessage([{ code: "EVENT_RATE_LIMITED" }])).toMatch(/too often/);
    expect(eventErrorMessage([{ code: "EVENT_NOT_FOUND" }])).toMatch(/could not find/i);
  });
  it("uses a specific server reason for an EVENT_ code without its own wording, unless it names an id", () => {
    expect(eventErrorMessage([{ code: "EVENT_CONTENT_STARTS_BEFORE_EVENT", message: "The session must start inside the event." }]))
      .toBe("The session must start inside the event.");
    expect(eventErrorMessage([{ code: "EVENT_REFUSED", message: "Event 3f2504e0-4f89-11d3-9a0c-0305e82c3301 is closed" }]))
      .toBe("That isn't available right now.");
  });
  it("hides id fragments, not just full UUIDs", () => {
    expect(eventErrorMessage([{ code: "EVENT_REFUSED", message: "Registration 3f2504e04f89 not found" }])).toBe("That isn't available right now.");
  });
  it("never surfaces FORBIDDEN as a normal error path", () => {
    const text = eventErrorMessage([{ code: "FORBIDDEN", message: "Forbidden resource" }]);
    expect(text).not.toMatch(/forbidden/i);
    expect(text).toMatch(/access/);
  });
  it("falls back for unknown errors", () => {
    expect(eventErrorMessage([], "Fallback")).toBe("Fallback");
  });
});

describe("dashboard grouping and rates", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const ev = (startAt: string, endAt: string, status = "published") => ({ startAt, endAt, status });
  it("classifies upcoming / live / past, with draft and cancelled winning over the clock", () => {
    expect(eventPhase(ev("2026-10-20T10:00:00Z", "2026-10-20T12:00:00Z"), now)).toBe("upcoming");
    expect(eventPhase(ev("2026-10-10T10:00:00Z", "2026-10-10T14:00:00Z"), now)).toBe("live");
    expect(eventPhase(ev("2026-10-01T10:00:00Z", "2026-10-01T12:00:00Z"), now)).toBe("past");
    expect(eventPhase(ev("2026-10-20T10:00:00Z", "2026-10-20T12:00:00Z", "cancelled"), now)).toBe("cancelled");
    expect(eventPhase(ev("2026-10-20T10:00:00Z", "2026-10-20T12:00:00Z", "draft"), now)).toBe("draft");
  });
  it("check-in rate is checked-in over registered, null with nobody registered", () => {
    expect(checkInRate(3, [{ status: "confirmed", count: 6 }, { status: "attended", count: 2 }])).toBeCloseTo(0.375);
    expect(checkInRate(0, [])).toBeNull();
    expect(checkInRate(9, [{ status: "confirmed", count: 3 }])).toBe(1);
  });
  it("range presets produce ordered ISO windows", () => {
    const { from, to } = rangeForPreset("last30", now);
    expect(Date.parse(from)).toBeLessThan(Date.parse(to));
    expect(from.startsWith("2026-09-10")).toBe(true);
  });
});
