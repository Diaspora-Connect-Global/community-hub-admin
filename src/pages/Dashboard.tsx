import { Users, MessageSquare, Briefcase, ShoppingCart, Calendar, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { t } = useTranslation();
  
  const metrics = [
    { label: t("dashboard.totalMembers"), value: "12,450", icon: Users, trend: { value: 12, isPositive: true } },
    { label: t("dashboard.postsToday"), value: "47", icon: MessageSquare, trend: { value: 8, isPositive: true } },
    { label: t("dashboard.activeOpportunities"), value: "23", icon: Briefcase, trend: { value: 5, isPositive: true } },
    { label: t("dashboard.myListings"), value: "18", icon: ShoppingCart, trend: { value: 3, isPositive: false } },
    { label: t("dashboard.myGroups"), value: "8", icon: UsersRound },
    { label: t("dashboard.myEvents"), value: "5", icon: Calendar, trend: { value: 15, isPositive: true } },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.welcome")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("dashboard.dateRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("dashboard.last7Days")}</SelectItem>
              <SelectItem value="30">{t("dashboard.last30Days")}</SelectItem>
              <SelectItem value="90">{t("dashboard.last90Days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">{t("dashboard.refresh")}</Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} style={{ animationDelay: `${index * 100}ms` }}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart />
        <ActivityFeed />
      </div>
    </div>
  );
}
