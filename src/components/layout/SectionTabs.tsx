import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useEventsOnly } from "@/hooks/useEventsOnly";
import { isPathAllowed } from "@/lib/eventNetworking";
import { EVENTS_ONLY_ALLOWED_PATHS } from "@/components/events/networking/EventsOnlyGate";
import { SECTION_TABS, activeTabPath, type SectionId } from "@/lib/navSections";
import { useConsoleAccess } from "@/hooks/useConsoleAccess";
import { canOpenPath } from "@/lib/rolePermissions";

interface SectionTabsProps {
  section: SectionId;
  /** i18n key naming the section, read out by screen readers. */
  labelKey: string;
  /** Counts shown beside a tab, keyed by the tab's path. */
  badges?: Partial<Record<string, number>>;
}

/**
 * Tab bar shared by the pages of one merged section. Each tab is a link to its
 * own route, so the browser's back button and old bookmarks keep working.
 * An events-only community only sees the tabs it is allowed to open, and a
 * custom-role admin only the tabs its role covers.
 */
export function SectionTabs({ section, labelKey, badges }: SectionTabsProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { eventsOnly } = useEventsOnly();

  const access = useConsoleAccess();
  // Tabs a custom-role admin's role does not cover are hidden (UX only).
  const tabs = SECTION_TABS[section].filter(
    (tab) =>
      (!eventsOnly || isPathAllowed(tab.path, EVENTS_ONLY_ALLOWED_PATHS)) && canOpenPath(access, tab.path),
  );
  if (tabs.length < 2) return null;

  const active = activeTabPath(tabs, pathname);

  return (
    <div className="border-b border-border overflow-x-auto">
      <nav className="flex gap-1 -mb-px" aria-label={t(labelKey)}>
        {tabs.map((tab) => {
          const isActive = tab.path === active;
          const count = badges?.[tab.path] ?? 0;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {t(tab.labelKey)}
              {count > 0 && (
                <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
