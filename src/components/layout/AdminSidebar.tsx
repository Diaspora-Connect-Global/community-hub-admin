import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { getCommunity } from "@/services/graphql/community/queries";
import {
  Home,
  MessageSquare,
  Briefcase,
  ShoppingCart,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  PlusCircle,
  Tag,
  CalendarPlus,
  Building2,
  BookUser,
  LifeBuoy,
  FileStack,
  Library,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEventsOnly } from "@/hooks/useEventsOnly";
import { filterNavForEventsOnly } from "@/lib/eventNetworking";
import commAdminLogo from "@/assets/comm-admin-logo.svg";
import { pathMatches, sectionPaths } from "@/lib/navSections";

interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  path: string;
  /** Other routes that light this entry up (the section's tabs and detail pages). */
  matchPaths?: readonly string[];
}

interface NavGroup {
  id: string;
  /** Group heading; the first and last groups have none. */
  headingKey?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "home",
    items: [{ id: "dashboard", labelKey: "nav.dashboard", icon: Home, path: "/" }],
  },
  {
    id: "content",
    headingKey: "navSection.content",
    items: [
      { id: "posts", labelKey: "nav.posts", icon: MessageSquare, path: "/posts" },
      { id: "events", labelKey: "nav.events", icon: Calendar, path: "/events" },
      { id: "opportunities", labelKey: "nav.opportunities", icon: Briefcase, path: "/opportunities" },
      { id: "marketplace", labelKey: "nav.marketplace", icon: ShoppingCart, path: "/marketplace" },
      { id: "groups", labelKey: "nav.groups", icon: Users, path: "/groups" },
    ],
  },
  {
    id: "people",
    headingKey: "navSection.people",
    items: [
      // Members · Join requests · Registries
      { id: "members", labelKey: "nav.members", icon: Users, path: "/members", matchPaths: sectionPaths("members") },
      { id: "associations", labelKey: "nav.associations", icon: Building2, path: "/associations" },
      // "Registry & Verification" (KYC review) is hidden: kyc-service cannot scope
      // verifications to a community, so the backend restricts those operations to
      // platform admins. Restore once verifications carry a community id.
    ],
  },
  {
    id: "memberServices",
    headingKey: "navSection.memberServices",
    items: [
      // Requests · Request types
      {
        id: "serviceRequests",
        labelKey: "nav.serviceRequests",
        icon: FileStack,
        path: "/service-requests",
        matchPaths: sectionPaths("serviceRequests"),
      },
      { id: "resources", labelKey: "nav.resources", icon: Library, path: "/resources" },
      { id: "directory", labelKey: "nav.directory", icon: BookUser, path: "/directory" },
    ],
  },
  {
    id: "support",
    headingKey: "navSection.support",
    items: [
      // Cases · Case types
      { id: "cases", labelKey: "nav.cases", icon: LifeBuoy, path: "/cases", matchPaths: sectionPaths("support") },
      { id: "reports", labelKey: "nav.reports", icon: AlertTriangle, path: "/reports" },
    ],
  },
  {
    id: "admin",
    items: [
      // Community · Roles & admins · Audit log
      { id: "settings", labelKey: "nav.settings", icon: Settings, path: "/settings", matchPaths: sectionPaths("settings") },
    ],
  },
];

/** Menu entries an events-only community keeps: events, approvals (inside events), members, settings (with admins and audit). */
const EVENTS_ONLY_NAV_IDS = ["dashboard", "events", "members", "settings"];

function isItemActive(item: NavItem, pathname: string): boolean {
  return [item.path, ...(item.matchPaths ?? [])].some((p) => pathMatches(pathname, p));
}

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
  const admin = useAuthStore((s) => s.admin);
  const claims = useAuthStore((s) => s.claims);
  const { eventsOnly } = useEventsOnly();
  const visibleNavGroups = navGroups
    .map((group) => ({ ...group, items: filterNavForEventsOnly(group.items, eventsOnly, EVENTS_ONLY_NAV_IDS) }))
    .filter((group) => group.items.length > 0);
  const visibleQuickActions = eventsOnly ? quickActions.filter((a) => a.action === "event") : quickActions;

  const communityId = admin?.scopeType === "COMMUNITY" ? admin.scopeId ?? null : null;
  const { data: community } = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => getCommunity(communityId!),
    enabled: !!communityId,
    staleTime: 5 * 60_000,
  });

  const communityName =
    community?.name ??
    (claims as (typeof claims & { communityName?: string }) | null)?.communityName ??
    "Community";

  // Initials for the avatar placeholder (up to 2 chars)
  const initials = communityName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

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
            {visibleQuickActions.map((action) => (
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
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label={t("navSection.menu")}>
        {visibleNavGroups.map((group, groupIndex) => (
          <div key={group.id} className={cn(groupIndex > 0 && "mt-4")}>
            {group.headingKey &&
              (collapsed ? (
                <div className="mx-3 mb-2 border-t border-border" aria-hidden="true" />
              ) : (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(group.headingKey)}
                </p>
              ))}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = isItemActive(item, location.pathname);
                const label = eventsOnly && item.id === "dashboard" ? "Events dashboard" : t(item.labelKey);
                const NavItem = (
                  <Link
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span>{label}</span>}
                  </Link>
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
          </div>
        ))}
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
              <span className="text-xs font-bold text-brand">{initials || "C"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{communityName}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
