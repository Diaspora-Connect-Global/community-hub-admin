/**
 * Merged sections of the console: one sidebar entry, several pages shown as
 * tabs. Each tab keeps its own route (old links and bookmarks still work);
 * the sidebar entry is active on every route of its section.
 *
 * Pure data + helpers (no React), so the sidebar and the tab bar read the
 * same definition and it can be unit-tested directly.
 */

export interface SectionTab {
  /** Route the tab opens. */
  path: string;
  /** i18n key of the tab label. */
  labelKey: string;
  /** Other routes that belong to this tab (e.g. detail pages). */
  extraPaths?: readonly string[];
}

export type SectionId = "members" | "serviceRequests" | "support" | "settings";

export const SECTION_TABS: Record<SectionId, readonly SectionTab[]> = {
  members: [
    { path: "/members", labelKey: "sectionTabs.members.members" },
    { path: "/members/requests", labelKey: "sectionTabs.members.requests" },
    { path: "/registries", labelKey: "sectionTabs.members.registries" },
  ],
  serviceRequests: [
    { path: "/service-requests", labelKey: "sectionTabs.serviceRequests.requests" },
    { path: "/service-request-types", labelKey: "sectionTabs.serviceRequests.types" },
  ],
  support: [
    { path: "/cases", labelKey: "sectionTabs.support.cases" },
    { path: "/support/case-types", labelKey: "sectionTabs.support.caseTypes" },
  ],
  settings: [
    { path: "/settings", labelKey: "sectionTabs.settings.community" },
    { path: "/roles-admins", labelKey: "sectionTabs.settings.roles" },
    { path: "/audit", labelKey: "sectionTabs.settings.audit" },
  ],
};

/** True when `pathname` is `path` itself or a page below it (`/` matches only itself). */
export function pathMatches(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The tab that is active for `pathname`. The most specific match wins, so
 * `/members/requests` selects "Join requests", not "Members".
 */
export function activeTabPath(tabs: readonly SectionTab[], pathname: string): string | null {
  let best: { path: string; length: number } | null = null;
  for (const tab of tabs) {
    for (const candidate of [tab.path, ...(tab.extraPaths ?? [])]) {
      if (pathMatches(pathname, candidate) && (!best || candidate.length > best.length)) {
        best = { path: tab.path, length: candidate.length };
      }
    }
  }
  return best?.path ?? null;
}

/** Every route a sidebar entry should light up on: its own path plus its section's tabs. */
export function sectionPaths(section: SectionId): string[] {
  return SECTION_TABS[section].flatMap((tab) => [tab.path, ...(tab.extraPaths ?? [])]);
}

/** The tabs of a section the signed-in admin may open (see `canOpenPath`). */
export function accessibleTabs(section: SectionId, canOpen: (path: string) => boolean): SectionTab[] {
  return SECTION_TABS[section].filter((tab) => canOpen(tab.path));
}

export interface AccessFilterableNavItem {
  path: string;
  /** Set on a sidebar entry that stands for a whole section of tabs. */
  section?: SectionId;
}

/**
 * Sidebar entries the admin may use. A plain entry needs its own page; a
 * section entry stays while any of its tabs is open to the admin and then
 * links to the first such tab. A group whose entries all disappear is dropped
 * by the caller.
 */
export function filterNavItemsByAccess<T extends AccessFilterableNavItem>(
  items: readonly T[],
  canOpen: (path: string) => boolean,
): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (item.section) {
      const tabs = accessibleTabs(item.section, canOpen);
      if (tabs.length > 0) out.push({ ...item, path: tabs[0].path });
    } else if (canOpen(item.path)) {
      out.push(item);
    }
  }
  return out;
}
