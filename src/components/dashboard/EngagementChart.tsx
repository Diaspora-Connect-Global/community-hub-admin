import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { CommunityAnalyticsPoint } from "@/services/graphql/community/types";

const FALLBACK_DATA: CommunityAnalyticsPoint[] = [
  { label: "Mon", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Tue", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Wed", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Thu", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Fri", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Sat", posts: 0, interactions: 0, newMembers: 0 },
  { label: "Sun", posts: 0, interactions: 0, newMembers: 0 },
];

interface EngagementChartProps {
  data?: CommunityAnalyticsPoint[];
  loading?: boolean;
}

export function EngagementChart({ data, loading }: EngagementChartProps) {
  const chartData = data && data.length > 0 ? data : FALLBACK_DATA;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Engagement Trend
          {loading && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">Loading…</span>
          )}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="text-sm text-muted-foreground">Interactions</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 14% 18%)" />
            <XAxis dataKey="label" stroke="hsl(36 10% 55%)" fontSize={12} />
            <YAxis stroke="hsl(36 10% 55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(20 14% 7%)",
                border: "1px solid hsl(20 14% 18%)",
                borderRadius: "8px",
                color: "hsl(36 33% 94%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="hsl(38 92% 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPosts)"
            />
            <Area
              type="monotone"
              dataKey="interactions"
              stroke="hsl(142 76% 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInteractions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
