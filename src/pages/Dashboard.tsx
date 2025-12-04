import { Users, MessageSquare, Briefcase, ShoppingCart, Calendar, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const metrics = [
  { label: "Total Members", value: "12,450", icon: Users, trend: { value: 12, isPositive: true } },
  { label: "Posts Today", value: "47", icon: MessageSquare, trend: { value: 8, isPositive: true } },
  { label: "Active Opportunities", value: "23", icon: Briefcase, trend: { value: 5, isPositive: true } },
  { label: "My Listings", value: "18", icon: ShoppingCart, trend: { value: 3, isPositive: false } },
  { label: "My Groups", value: "8", icon: UsersRound },
  { label: "My Events", value: "5", icon: Calendar, trend: { value: 15, isPositive: true } },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Community Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening in your community.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Refresh</Button>
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
