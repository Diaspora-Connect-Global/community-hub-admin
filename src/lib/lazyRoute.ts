import { lazy, type ComponentType } from "react";

const RELOAD_STAMP_KEY = "community-hub-admin:chunk-reload-at";
/** At most one automatic reload in this window, so a truly missing chunk can't loop. */
const RELOAD_WINDOW_MS = 10_000;

/** True when the error is the browser failing to fetch a build chunk (stale tab after a deploy). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(
    message,
  );
}

/**
 * Reloads the page once per window. Returns true when a reload was started,
 * false when one already happened within the window (caller should surface the error).
 * Shared by lazyRoute and the vite:preloadError listener.
 */
export function reloadOnceForNewVersion(): boolean {
  let lastReload = 0;
  try {
    lastReload = Number(window.sessionStorage.getItem(RELOAD_STAMP_KEY) ?? 0);
  } catch {
    // Storage unavailable (private mode): fall through to a single reload attempt.
  }
  if (Date.now() - lastReload <= RELOAD_WINDOW_MS) return false;
  try {
    window.sessionStorage.setItem(RELOAD_STAMP_KEY, String(Date.now()));
  } catch {
    // ignore
  }
  window.location.reload();
  return true;
}

/**
 * `React.lazy` for a page that survives a redeploy.
 *
 * Chunks are content-hashed and the previous deploy's files are gone once a new
 * one is live, so a tab opened before the deploy fails to import a page it
 * hasn't visited yet. Reloading once fetches the new index and its new chunk
 * names. If the import fails again within the window, the error is rethrown for
 * the error boundary to show.
 */
export function lazyRoute<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (reloadOnceForNewVersion()) {
        // Keep the Suspense fallback up until the reload replaces the page.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }),
  );
}

/** Recover from a failed Vite chunk/CSS preload with the same once-per-window guard. */
export function installPreloadErrorHandler(): void {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnceForNewVersion()) event.preventDefault();
  });
}
