import { beforeEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadOnceForNewVersion } from "./lazyRoute";

const KEY = "community-hub-adminhunk-reload-at";
const reload = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  reload.mockReset();
  window.sessionStorage.clear();
  Object.defineProperty(window, "location", { value: { ...window.location, reload }, configurable: true });
});

describe("reloadOnceForNewVersion", () => {
  it("reloads on the first failure and stamps the time", () => {
    expect(reloadOnceForNewVersion()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(KEY)).not.toBeNull();
  });

  it("does not reload again within the window", () => {
    expect(reloadOnceForNewVersion()).toBe(true);
    expect(reloadOnceForNewVersion()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again once the window has passed", () => {
    window.sessionStorage.setItem(KEY, String(Date.now() - 60_000));
    expect(reloadOnceForNewVersion()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("still reloads once when sessionStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(reloadOnceForNewVersion()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("lazyRoute", () => {
  it("never resolves (keeps the fallback) when it reloads, and rethrows on the second failure", async () => {
    const { lazyRoute } = await import("./lazyRoute");
    const fail = () => Promise.reject(new Error("Failed to fetch dynamically imported module: x"));
    const first = lazyRoute(fail) as unknown as { _payload: { _result: () => Promise<unknown> } };
    const settled = vi.fn();
    first._payload._result().then(settled, settled);
    await Promise.resolve();
    await Promise.resolve();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();

    const second = lazyRoute(fail) as unknown as { _payload: { _result: () => Promise<unknown> } };
    await expect(second._payload._result()).rejects.toThrow("Failed to fetch dynamically imported module");
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("isChunkLoadError", () => {
  it("recognises chunk failures only", () => {
    expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module: https://x/a.js"))).toBe(true);
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("boom"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});
