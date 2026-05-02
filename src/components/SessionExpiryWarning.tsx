import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { refreshSession, logout } from "@/services/authentication/adminAuthService";

const WARNING_MS = 2 * 60 * 1000;

export function SessionExpiryWarning() {
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setSecondsLeft(null); return; }
    const tick = () => {
      const msLeft = expiresAt - Date.now();
      setSecondsLeft(msLeft > 0 && msLeft <= WARNING_MS ? Math.ceil(msLeft / 1000) : null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (secondsLeft === null) return null;

  const handleStay = async () => {
    setRefreshing(true);
    await refreshSession();
    setRefreshing(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 shadow-lg flex items-center gap-4 text-sm">
      <span className="text-yellow-800">
        Session expires in <strong>{secondsLeft}s</strong>
      </span>
      <button
        onClick={handleStay}
        disabled={refreshing}
        className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
      >
        {refreshing ? "Refreshing…" : "Stay logged in"}
      </button>
      <button onClick={() => logout()} className="text-yellow-700 underline text-xs">
        Log out
      </button>
    </div>
  );
}
