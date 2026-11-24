import { describe, expect, it } from "vitest";
import {
  IDLE_CONFIG as C,
  applyRemoteMessage,
  evaluateIdleSession,
  isStoredActivityStale,
  parseRemoteMessage,
  shouldRecordActivity,
} from "./idleSession";

const T0 = 1_000_000_000_000;
const ev = (now: number, lastActivity: number, accessExpiresAt: number | null = null) =>
  evaluateIdleSession({ now, lastActivity, accessExpiresAt });

describe("evaluateIdleSession", () => {
  it("is active while the admin is active, even past the access token lifetime window", () => {
    expect(ev(T0 + 10_000, T0, T0 + 14 * 60_000).phase).toBe("active");
  });

  it("asks for a silent refresh shortly before the access token expires, only while active", () => {
    const exp = T0 + 14 * 60_000;
    expect(ev(exp - C.refreshLeadMs - 1, exp - 30_000, exp).phase).toBe("active");
    expect(ev(exp - C.refreshLeadMs, exp - 30_000, exp).phase).toBe("refreshDue");
    expect(ev(exp + 5_000, exp - 30_000, exp).phase).toBe("refreshDue");
  });

  it("does not refresh an unattended session", () => {
    const exp = T0 + 14 * 60_000;
    expect(ev(exp, T0, exp).phase).toBe("active"); // 14 min idle > refresh window: no refresh
  });

  it("warns in the last minute before the idle timeout", () => {
    const warn = ev(T0 + C.idleTimeoutMs - C.warningMs, T0);
    expect(warn.phase).toBe("warning");
    expect(warn.secondsLeft).toBe(60);
    expect(ev(T0 + C.idleTimeoutMs - 1_500, T0)).toEqual({ phase: "warning", secondsLeft: 2 });
  });

  it("never refreshes during the warning", () => {
    expect(ev(T0 + C.idleTimeoutMs - 30_000, T0, T0).phase).toBe("warning");
  });

  it("expires at the idle timeout", () => {
    expect(ev(T0 + C.idleTimeoutMs, T0).phase).toBe("expired");
    expect(ev(T0 + C.idleTimeoutMs + 3_600_000, T0).phase).toBe("expired");
  });

  it("activity resets the clock", () => {
    const late = T0 + C.idleTimeoutMs - 10_000;
    expect(ev(late, T0).phase).toBe("warning");
    expect(ev(late, late).phase).toBe("active");
  });

  it("treats a future lastActivity as just now", () => {
    expect(ev(T0, T0 + 10 * 60_000).phase).toBe("active");
  });
});

describe("shouldRecordActivity", () => {
  it("throttles regular events", () => {
    expect(shouldRecordActivity({ now: T0 + 1_000, lastRecorded: T0, warningOpen: false })).toBe(false);
    expect(shouldRecordActivity({ now: T0 + C.activityThrottleMs, lastRecorded: T0, warningOpen: false })).toBe(true);
  });
  it("records every event while the warning is open", () => {
    expect(shouldRecordActivity({ now: T0 + 1, lastRecorded: T0, warningOpen: true })).toBe(true);
  });
});

describe("isStoredActivityStale", () => {
  it("is stale only at or past the timeout", () => {
    expect(isStoredActivityStale(null, T0)).toBe(false);
    expect(isStoredActivityStale(T0 - C.idleTimeoutMs + 1, T0)).toBe(false);
    expect(isStoredActivityStale(T0 - C.idleTimeoutMs, T0)).toBe(true);
  });
});

describe("cross-tab messages", () => {
  it("parses valid messages and rejects junk", () => {
    expect(parseRemoteMessage({ type: "activity", at: 5 })).toEqual({ type: "activity", at: 5 });
    expect(parseRemoteMessage({ type: "logout", reason: "idle" })).toEqual({ type: "logout", reason: "idle" });
    expect(parseRemoteMessage({ type: "logout", reason: "weird" })).toEqual({ type: "logout", reason: "manual" });
    expect(parseRemoteMessage({ type: "activity", at: "x" })).toBeNull();
    expect(parseRemoteMessage({ type: "activity", at: Infinity })).toBeNull();
    expect(parseRemoteMessage(null)).toBeNull();
    expect(parseRemoteMessage("logout")).toBeNull();
    expect(parseRemoteMessage({ type: "token", accessToken: "x" })).toBeNull();
  });

  it("remote activity keeps this tab alive but never moves the clock backwards or into the future", () => {
    expect(applyRemoteMessage({ lastActivity: T0 }, { type: "activity", at: T0 + 5_000 }, T0 + 10_000)).toEqual({
      lastActivity: T0 + 5_000,
      signOut: null,
    });
    expect(applyRemoteMessage({ lastActivity: T0 + 9_000 }, { type: "activity", at: T0 }, T0 + 10_000).lastActivity).toBe(T0 + 9_000);
    expect(applyRemoteMessage({ lastActivity: T0 }, { type: "activity", at: T0 + 99_999_999 }, T0 + 10_000).lastActivity).toBe(T0 + 10_000);
  });

  it("a remote logout signs this tab out with its reason", () => {
    expect(applyRemoteMessage({ lastActivity: T0 }, { type: "logout", reason: "idle" }, T0).signOut).toBe("idle");
  });
});
