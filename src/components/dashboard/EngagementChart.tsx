import { useTranslation } from "react-i18next";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { CommunityAnalyticsPoint } from "@/services/graphql/community/types";

function formatTick(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface EngagementChartProps {
  data?: CommunityAnalyticsPoint[];
  loading?: boolean;
}

type OptionalSeries = "posts" | "engagement";

/** A series is plotted only if the server actually reported numbers for it. */
function hasValues(points: CommunityAnalyticsPoint[], key: OptionalSeries): boolean {
  return points.some((p) => typeof p[key] === "number");
}

const SERIES_COLOUR = {
  members: "hsl(217 91% 60%)",
  posts: "hsl(38 92% 50%)",
  engagement: "hsl(142 76% 36%)",
} as const;

/**
 * Community trend: the real member-growth series. Posts and engagement are
 * plotted only when the server reports them; while they come back null the
 * legend says "not available" instead of drawing an empty or zero line. With
 * no data at all, nothing is drawn — no invented flat line.
 */
export function EngagementChart({ data, loading }: EngagementChartProps) {
  const { t } = useTranslation();
  const points = data ?? [];
  const hasData = points.length > 0;
  const optional: Array<{ key: OptionalSeries; label: string; available: boolean }> = [
    { key: "posts", label: t("dashboard.trend.posts"), available: hasData && hasValues(points, "posts") },
    { key: "engagement", label: t("dashboard.trend.engagement"), available: hasData && hasValues(points, "engagement") },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {t("dashboard.trend.title")}
          {loading && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">{t("dashboard.trend.loading")}</span>
          )}
        </h3>
        <ul className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground" aria-label={t("dashboard.trend.legend")}>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SERIES_COLOUR.members }} aria-hidden="true" />
            {t("dashboard.trend.members")}
          </li>
          {optional.map((s) =>
            s.available ? (
              <li key={s.key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SERIES_COLOUR[s.key] }} aria-hidden="true" />
                {s.label}
              </li>
            ) : (
              <li key={s.key} className="flex items-center gap-2 opacity-70">
                <span className="h-3 w-3 rounded-full border border-dashed border-muted-foreground" aria-hidden="true" />
                {t("dashboard.trend.seriesNotAvailable", { series: s.label })}
              </li>
            ),
          )}
        </ul>
      </div>
      <div className="h-64">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground" role="status">
            {loading ? t("dashboard.trend.loading") : t("dashboard.trend.noData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                {(["members", "posts", "engagement"] as const).map((key) => (
                  <linearGradient key={key} id={`trend-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES_COLOUR[key]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SERIES_COLOUR[key]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 14% 18%)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTick} stroke="hsl(36 10% 55%)" fontSize={12} />
              <YAxis stroke="hsl(36 10% 55%)" fontSize={12} allowDecimals={false} />
              <Tooltip
                labelFormatter={(label) => formatTick(String(label))}
                contentStyle={{
                  backgroundColor: "hsl(20 14% 7%)",
                  border: "1px solid hsl(20 14% 18%)",
                  borderRadius: "8px",
                  color: "hsl(36 33% 94%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="members"
                name={t("dashboard.trend.members")}
                stroke={SERIES_COLOUR.members}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trend-members)"
              />
              {optional
                .filter((s) => s.available)
                .map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={SERIES_COLOUR[s.key]}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#trend-${s.key})`}
                    connectNulls={false}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
