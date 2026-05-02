import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import type { ModerationLog } from "@/services/graphql/community/types";

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ActivityFeedProps {
  entries?: ModerationLog[];
  loading?: boolean;
}

export function ActivityFeed({ entries, loading }: ActivityFeedProps) {
  const navigate = useNavigate();

  const hasEntries = entries && entries.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-lg text-foreground">Recent Activity</h3>
        <button
          className="text-sm text-primary hover:underline"
          onClick={() => navigate("/audit")}
        >
          View all
        </button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading activity…</p>
      )}

      {!loading && !hasEntries && (
        <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
      )}

      {!loading && hasEntries && (
        <div className="space-y-4">
          {entries.map((log, index) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", "bg-primary/10")}>
                <Shield className={cn("h-5 w-5", "text-primary")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{actionLabel(log.action)}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {log.details ?? (log.targetUser ? `Target: ${log.targetUser}` : `By: ${log.performedBy}`)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
