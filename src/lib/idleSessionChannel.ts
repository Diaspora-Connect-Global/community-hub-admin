/**
 * Cross-tab transport for the idle session: BroadcastChannel, with a `storage`-event
 * fallback. Only timestamps and sign-out events travel here — NEVER tokens.
 */
import { parseRemoteMessage, type RemoteMessage, type SignOutReason } from "./idleSession";

const CHANNEL_NAME = "diaspoplug-admin-idle";
const EVENT_KEY = "admin_idle_evt";
const ACTIVITY_KEY = "admin_last_activity";
/** Per-tab (sessionStorage): why this tab was signed out, so /login can say so. */
export const SIGNOUT_REASON_KEY = "admin_signout_reason";

let channel: BroadcastChannel | null = null;
let seq = 0;

function getChannel(): BroadcastChannel | null {
  if (channel) return channel;
  try {
    if (typeof BroadcastChannel !== "undefined") channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
  return channel;
}

export function postRemote(msg: RemoteMessage): void {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(msg);
      return;
    } catch {
      // fall through to the storage fallback
    }
  }
  try {
    // A changing payload is what fires `storage` in the other tabs.
    localStorage.setItem(EVENT_KEY, JSON.stringify({ ...msg, n: ++seq, t: Date.now() }));
  } catch {
    // storage blocked — single-tab behaviour only
  }
}

/** Subscribe to messages from OTHER tabs. Returns an unsubscribe function. */
export function listenRemote(onMessage: (msg: RemoteMessage) => void): () => void {
  const ch = getChannel();
  const onBc = (e: MessageEvent) => {
    const msg = parseRemoteMessage(e.data);
    if (msg) onMessage(msg);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== EVENT_KEY || !e.newValue) return;
    try {
      const msg = parseRemoteMessage(JSON.parse(e.newValue));
      if (msg) onMessage(msg);
    } catch {
      // ignore malformed
    }
  };
  ch?.addEventListener("message", onBc);
  // Always listen for storage too: it is the fallback transport and costs nothing.
  window.addEventListener("storage", onStorage);
  return () => {
    ch?.removeEventListener("message", onBc);
    window.removeEventListener("storage", onStorage);
  };
}

// ── Persisted last activity (timestamp only) so a closed/reopened tab still honours idle ──

export function readStoredActivity(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeStoredActivity(at: number): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    // ignore
  }
}

export function clearStoredActivity(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

// ── Sign-out broadcast, called from the store's logout so EVERY sign-out path reaches all tabs ──

let pendingReason: SignOutReason = "manual";
let applyingRemote = false;

/** Tell the next broadcast why we are signing out (idle / expired). */
export function markSignOutReason(reason: SignOutReason): void {
  pendingReason = reason;
}

/** Run `fn` (a local logout triggered BY a remote message) without re-broadcasting it. */
export function withoutBroadcast(fn: () => void): void {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

/** Called by the store's logout. Clears the persisted activity and tells the other tabs. */
export function onLocalSignOut(): void {
  clearStoredActivity();
  const reason = pendingReason;
  pendingReason = "manual";
  if (applyingRemote) return;
  postRemote({ type: "logout", reason });
}

/** Remember (per tab) that the next /login should explain the sign-out. */
export function rememberSignOutReason(reason: SignOutReason): void {
  if (reason === "manual") return;
  try {
    sessionStorage.setItem(SIGNOUT_REASON_KEY, reason);
  } catch {
    // ignore
  }
}

/** Read and clear the reason, once. */
export function consumeSignOutReason(): SignOutReason | null {
  try {
    const v = sessionStorage.getItem(SIGNOUT_REASON_KEY);
    if (v) sessionStorage.removeItem(SIGNOUT_REASON_KEY);
    return v === "idle" || v === "expired" ? v : null;
  } catch {
    return null;
  }
}
