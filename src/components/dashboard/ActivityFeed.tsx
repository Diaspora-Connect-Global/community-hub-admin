import { cn } from "@/lib/utils";
import { MessageSquare, ShoppingCart, Briefcase, Users, Calendar } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "post",
    icon: MessageSquare,
    title: "New comment on your announcement",
    description: "Kwame Asante commented on 'Community Meetup Next Week'",
    time: "2 min ago",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    id: 2,
    type: "order",
    icon: ShoppingCart,
    title: "New order received",
    description: "Ama Mensah ordered 'Handwoven Kente Cloth'",
    time: "15 min ago",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 3,
    type: "opportunity",
    icon: Briefcase,
    title: "New application",
    description: "Kofi Owusu applied for 'Marketing Internship'",
    time: "1 hour ago",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
  {
    id: 4,
    type: "member",
    icon: Users,
    title: "New member joined",
    description: "Akua Boateng joined Ghana Community",
    time: "2 hours ago",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    id: 5,
    type: "event",
    icon: Calendar,
    title: "Event RSVP",
    description: "5 new RSVPs for 'Cultural Festival 2024'",
    time: "3 hours ago",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
  },
];

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-lg text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", activity.bgColor)}>
              <activity.icon className={cn("h-5 w-5", activity.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
