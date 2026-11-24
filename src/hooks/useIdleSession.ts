import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getOrRefreshSession } from "@/services/authentication/adminAuthService";
import {
  IDLE_CONFIG,
  applyRemoteMessage,
  evaluateIdleSession,
  isStoredActivityStale,
  shouldRecordActivity,
  type SignOutReason,
} from "@/lib/idleSession";
import {
  listenRemote,
  markSignOutReason,
  postRemote,
  readStoredActivity,
  rememberSignOutReason,
  withoutBroadcast,
  writeStoredActivity,
} from "@/lib/idleSessionChannel";

const TICK_MS = 1000;
const REFRESH_RETRY_MS = 30_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel", "mousemove"] as const;

/**
 * Sliding idle session. While the admin is active the access token is refreshed silently;
 * after IDLE_CONFIG.idleTimeoutMs of no activity a warning shows for the last minute, then the
 * session is signed out. Returns the warning state for <IdleSessionDialog />.
 */
export function useIdleSession() {
  const navigate = useNavigate();
  const signedIn = useAuthStore((s) => Boolean(s.accessToken));
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const stayRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!signedIn) {
      setSecondsLeft(null);
      return;
    }
    const cfg = IDLE_CONFIG;
    let disposed = false;
    let signedOut = false;
    let warningOpen = false;
    let refreshing = false;
    let nextRefreshAt = 0;
    let lastRecorded = 0;

    const stored = readStoredActivity();
    let lastActivity = Date.now();

    const signOut = (reason: SignOutReason, fromRemote = false) => {
      if (signedOut) return;
      signedOut = true;
      rememberSignOutReason(reason);
      const doLogout = () => {
        markSignOutReason(reason);
        useAuthStore.getState().logout();
      };
      if (fromRemote) withoutBroadcast(doLogout);
      else doLogout();
      setSecondsLeft(null);
      navigate("/login", { replace: true });
    };

    // A previous page load / closed tab that has been idle past the timeout must not revive.
    if (isStoredActivityStale(stored, lastActivity, cfg)) {
      signOut("idle");
      return;
    }
    writeStoredActivity(lastActivity);

    const silentRefresh = async () => {
      if (refreshing || Date.now() < nextRefreshAt) return;
      refreshing = true;
      try {
        const run = async () => {
          // Another tab sharing this storage may have refreshed already (the refresh token rotates).
          await useAuthStore.persist.rehydrate();
          const exp = useAuthStore.getState().expiresAt;
          const phase = evaluateIdleSession(
            { now: Date.now(), lastActivity, accessExpiresAt: exp },
            cfg,
          ).phase;
          if (phase !== "refreshDue") return true;
          return getOrRefreshSession();
        };
        markSignOutReason("expired"); // if this refresh is refused the store signs out; tell other tabs why
        const ok = navigator.locks
          ? await navigator.locks.request("admin-token-refresh", run)
          : await run();
        if (!ok && !disposed && !useAuthStore.getState().accessToken) {
          // Definitive refusal (refresh token dead/revoked): the store has already signed out.
          signedOut = true;
          rememberSignOutReason("expired");
          navigate("/login", { replace: true });
        }
      } catch {
        // Transient (network / 5xx): keep the session, try again later.
        nextRefreshAt = Date.now() + REFRESH_RETRY_MS;
      } finally {
        if (useAuthStore.getState().accessToken) markSignOutReason("manual");
        refreshing = false;
      }
    };

    const tick = () => {
      if (disposed || signedOut) return;
      const now = Date.now();
      const e = evaluateIdleSession(
        { now, lastActivity, accessExpiresAt: useAuthStore.getState().expiresAt },
        cfg,
      );
      if (e.phase === "expired") return signOut("idle");
      if (e.phase === "warning") {
        warningOpen = true;
        setSecondsLeft(e.secondsLeft);
      } else if (warningOpen) {
        warningOpen = false;
        setSecondsLeft(null);
      }
      if (e.phase === "refreshDue") void silentRefresh();
    };

    const record = () => {
      if (disposed || signedOut) return;
      const now = Date.now();
      // Check expiry BEFORE counting this event, so waking a sleeping tab cannot revive it.
      if (evaluateIdleSession({ now, lastActivity, accessExpiresAt: null }, cfg).phase === "expired") {
        return signOut("idle");
      }
      if (!shouldRecordActivity({ now, lastRecorded, warningOpen }, cfg)) return;
      lastRecorded = now;
      lastActivity = now;
      writeStoredActivity(now);
      postRemote({ type: "activity", at: now });
      tick();
    };

    stayRef.current = record;

    const onVisibility = () => {
      if (document.visibilityState === "visible") record();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, record, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    const stopRemote = listenRemote((msg) => {
      const r = applyRemoteMessage({ lastActivity }, msg, Date.now());
      if (r.signOut) return signOut(r.signOut, true);
      lastActivity = r.lastActivity;
      tick();
    });
    const timer = window.setInterval(tick, TICK_MS);
    tick();

    return () => {
      disposed = true;
      window.clearInterval(timer);
      stopRemote();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, record, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [signedIn, navigate]);

  const stay = useCallback(() => stayRef.current(), []);
  return { secondsLeft, stay };
}
