import { useCallback, useEffect, useState } from "react";
import { Users, MessageSquare, Briefcase, ShoppingCart, Calendar, UsersRound, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/authStore";
import {
  getCommunityStats,
  getModerationLogs,
  getCommunityAnalytics,
} from "@/services/graphql/community/queries";
import { listOpportunities } from "@/services/graphql/opportunities";
import { discoverGroups } from "@/services/graphql/groups/queries";
import { listEvents } from "@/services/graphql/events/queries";
import { getCommunityScopedListings } from "@/services/graphql/vendor/queries";
import type { CommunityStats, CommunityAnalyticsPoint, ModerationLog, AnalyticsPeriod } from "@/services/graphql/community/types";

function formatInt(n: number): string {
  return n.toLocaleString();
}

function dateRangeToPeriod(range: string): AnalyticsPeriod {
  if (range === "7") return "WEEKLY";
  if (range === "90") return "QUARTERLY";
  return "MONTHLY";
}

export default function Dashboard() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? admin.scopeId ?? "" : "";

  const [dateRange, setDateRange] = useState("30");

  // Core stats
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Extra metric counts
  const [opportunityCount, setOpportunityCount] = useState<number | null>(null);
  const [listingsCount, setListingsCount] = useState<number | null>(null);
  const [groupsCount, setGroupsCount] = useState<number | null>(null);
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(false);

  // Analytics chart data
  const [analyticsData, setAnalyticsData] = useState<CommunityAnalyticsPoint[] | undefined>(undefined);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Activity feed
  const [activityEntries, setActivityEntries] = useState<ModerationLog[] | undefined>(undefined);
  const [activityLoading, setActivityLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!communityId) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const s = await getCommunityStats(communityId);
      setStats(s);
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, [communityId]);

  const refreshExtras = useCallback(async () => {
    if (!communityId) return;
    setExtrasLoading(true);
    try {
      const [oppsResult, listingsResult, groupsResult, eventsResult] = await Promise.allSettled([
        listOpportunities({ ownerType: "COMMUNITY", ownerId: communityId, status: "PUBLISHED", limit: 1, offset: 0 }),
        getCommunityScopedListings(communityId, 1, 0),
        discoverGroups({ limit: 1, offset: 0 }),
        listEvents({ ownerType: "COMMUNITY", ownerId: communityId, status: "published", limit: 1, offset: 0 }),
      ]);

      if (oppsResult.status === "fulfilled") setOpportunityCount(oppsResult.value.total);
      if (listingsResult.status === "fulfilled") setListingsCount(listingsResult.value?.total ?? 0);
      if (groupsResult.status === "fulfilled") setGroupsCount(groupsResult.value.total);
      if (eventsResult.status === "fulfilled") setEventsCount(eventsResult.value.total);
    } finally {
      setExtrasLoading(false);
    }
  }, [communityId]);

  const refreshAnalytics = useCallback(async () => {
    if (!communityId) return;
    setAnalyticsLoading(true);
    try {
      const result = await getCommunityAnalytics(communityId, dateRangeToPeriod(dateRange));
      setAnalyticsData(result.points);
    } catch {
      // silently fall back to empty / fallback data in chart
      setAnalyticsData(undefined);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [communityId, dateRange]);

  const refreshActivity = useCallback(async () => {
    if (!communityId) return;
    setActivityLoading(true);
    try {
      const logs = await getModerationLogs(communityId, "COMMUNITY", 5, 0);
      setActivityEntries(logs);
    } catch {
      setActivityEntries([]);
    } finally {
      setActivityLoading(false);
    }
  }, [communityId]);

  const refreshAll = useCallback(() => {
    void refreshStats();
    void refreshExtras();
    void refreshAnalytics();
    void refreshActivity();
  }, [refreshStats, refreshExtras, refreshAnalytics, refreshActivity]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Re-fetch analytics whenever date range changes
  useEffect(() => {
    void refreshAnalytics();
  }, [refreshAnalytics]);

  const extrasValue = (count: number | null) => {
    if (!communityId) return "—";
    if (extrasLoading && count === null) return "…";
    return count !== null ? formatInt(count) : "—";
  };

  const metrics = [
    {
      label: t("dashboard.totalMembers"),
      value: communityId ? (statsLoading ? "…" : formatInt(stats?.memberCount ?? 0)) : "—",
      icon: Users,
    },
    {
      label: t("dashboard.postsToday"),
      value: communityId ? (statsLoading ? "…" : formatInt(stats?.postCount ?? 0)) : "—",
      icon: MessageSquare,
    },
    {
      label: "Pending requests",
      value: communityId ? (statsLoading ? "…" : formatInt(stats?.pendingRequestCount ?? 0)) : "—",
      icon: Users,
    },
    {
      label: t("dashboard.activeOpportunities"),
      value: extrasValue(opportunityCount),
      icon: Briefcase,
    },
    {
      label: t("dashboard.myListings"),
      value: extrasValue(listingsCount),
      icon: ShoppingCart,
    },
    {
      label: t("dashboard.myGroups"),
      value: extrasValue(groupsCount),
      icon: UsersRound,
    },
    {
      label: t("dashboard.myEvents"),
      value: extrasValue(eventsCount),
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.welcome")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("dashboard.dateRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("dashboard.last7Days")}</SelectItem>
              <SelectItem value="30">{t("dashboard.last30Days")}</SelectItem>
              <SelectItem value="90">{t("dashboard.last90Days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={!communityId || statsLoading}
          >
            {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("dashboard.refresh")}
          </Button>
        </div>
      </div>

      {!communityId && (
        <Alert>
          <AlertTitle>Community dashboard</AlertTitle>
          <AlertDescription>
            Sign in with a community-scoped admin account to load live member, post, and pending-request counts.
          </AlertDescription>
        </Alert>
      )}

      {statsError && communityId && (
        <Alert variant="destructive">
          <AlertTitle>Stats unavailable</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{statsError}</p>
            {statsError.includes("PERMISSION_DENIED") ||
            statsError.includes("Only community administrators") ? (
              <p className="text-xs font-normal opacity-90">
                Your session is a community admin token and the community ID matches your scope. If this
                still appears, the <span className="font-mono">getCommunityStats</span> resolver on the
                API must allow community-scoped admin JWTs (not only membership roles in the database).
                That change is made in the gateway / community service, not in this admin app.
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} style={{ animationDelay: `${index * 100}ms` }}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart data={analyticsData} loading={analyticsLoading} />
        <ActivityFeed entries={activityEntries} loading={activityLoading} />
      </div>
    </div>
  );
}
