import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Briefcase,
  ShoppingCart,
  Users,
  Calendar,
  FileCheck,
  AlertTriangle,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  PlusCircle,
  Tag,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import commAdminLogo from "@/assets/comm-admin-logo.svg";

const navItems = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: Home, path: "/" },
  { id: "posts", labelKey: "nav.posts", icon: MessageSquare, path: "/posts" },
  { id: "opportunities", labelKey: "nav.opportunities", icon: Briefcase, path: "/opportunities" },
  { id: "marketplace", labelKey: "nav.marketplace", icon: ShoppingCart, path: "/marketplace" },
  { id: "groups", labelKey: "nav.groups", icon: Users, path: "/groups" },
  { id: "events", labelKey: "nav.events", icon: Calendar, path: "/events" },
  { id: "members", labelKey: "nav.members", icon: Users, path: "/members" },
  { id: "registry", labelKey: "nav.registry", icon: FileCheck, path: "/registry" },
  { id: "reports", labelKey: "nav.reports", icon: AlertTriangle, path: "/reports" },
  { id: "settings", labelKey: "nav.settings", icon: Settings, path: "/settings" },
  { id: "audit", labelKey: "nav.audit", icon: FileText, path: "/audit" },
];

const quickActions = [
  { label: "New Post", icon: Plus, action: "post", path: "/posts" },
  { label: "New Opportunity", icon: PlusCircle, action: "opportunity", path: "/opportunities" },
  { label: "New Listing", icon: Tag, action: "listing", path: "/marketplace" },
  { label: "New Event", icon: CalendarPlus, action: "event", path: "/events" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleQuickAction = (action: typeof quickActions[0]) => {
    navigate(action.path, { state: { openCreate: true } });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={commAdminLogo} alt="Comm Admin" className="w-8 h-8" />
            <span className="font-display font-semibold text-foreground">Comm Admin</span>
          </div>
        )}
        {collapsed && (
          <img src={commAdminLogo} alt="Comm Admin" className="w-8 h-8 mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", collapsed && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant="secondary"
                size="sm"
                className="h-8 text-xs justify-start"
                onClick={() => handleQuickAction(action)}
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label.replace("New ", "")}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const label = t(item.labelKey);
            const NavItem = (
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <li key={item.id}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={item.id}>{NavItem}</li>;
          })}
        </ul>
      </nav>

      {/* Collapse Toggle - Always visible at bottom when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-border mt-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-full h-10 text-foreground hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Community Selector */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary">
            <div className="w-8 h-8 rounded-full surface-brand-light flex items-center justify-center">
              <span className="text-xs font-bold text-brand">GH</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Ghana Community</p>
              <p className="text-xs text-muted-foreground">12,450 members</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
