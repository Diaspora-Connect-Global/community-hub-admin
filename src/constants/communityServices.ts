/**
 * Canonical catalog of member-facing "services" that a community can enable
 * for its members. This is the single source of truth used by:
 *  - Settings → Services panel (per-community module toggles)
 *
 * The `key` values are the contract with the backend
 * (`enabledServices: [String!]`). Labels/descriptions here are plain English
 * strings used directly by the UI.
 */
import {
  Newspaper,
  Calendar,
  Briefcase,
  Store,
  Users,
  LifeBuoy,
  ClipboardList,
  FileText,
  Contact,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface CommunityServiceDef {
  /** Stable identifier sent to / received from the backend. */
  key: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Short description shown under the label. */
  description: string;
  /** Lucide icon used to visually represent the service. */
  icon: LucideIcon;
}

/** Ordered catalog of all available services. Order drives display order. */
export const COMMUNITY_SERVICES: readonly CommunityServiceDef[] = [
  {
    key: "posts",
    label: "Posts & Feed",
    description: "Community feed where members share posts and updates.",
    icon: Newspaper,
  },
  {
    key: "events",
    label: "Events",
    description: "Create, publish and manage events members can attend.",
    icon: Calendar,
  },
  {
    key: "opportunities",
    label: "Opportunities",
    description: "Jobs, grants and other opportunities shared with members.",
    icon: Briefcase,
  },
  {
    key: "marketplace",
    label: "Marketplace / Vendor",
    description: "Vendor listings and marketplace for products and services.",
    icon: Store,
  },
  {
    key: "groups",
    label: "Groups",
    description: "Sub-groups members can join for focused discussion.",
    icon: Users,
  },
  {
    key: "support",
    label: "Support Cases",
    description: "Member support cases and help requests.",
    icon: LifeBuoy,
  },
  {
    key: "service_requests",
    label: "Service Requests",
    description: "Requests members submit for community-provided services.",
    icon: ClipboardList,
  },
  {
    key: "resources",
    label: "Resources & Documents",
    description: "Shared documents, guides and downloadable resources.",
    icon: FileText,
  },
  {
    key: "directory",
    label: "Directory",
    description: "Searchable directory of members and contacts.",
    icon: Contact,
  },
  {
    key: "registry",
    label: "Membership Registry",
    description: "Official registry of members and their status.",
    icon: ScrollText,
  },
] as const;

/** All service keys, in canonical catalog order. */
export const ALL_SERVICE_KEYS: string[] = COMMUNITY_SERVICES.map((s) => s.key);

const SERVICE_BY_KEY = new Map<string, CommunityServiceDef>(
  COMMUNITY_SERVICES.map((s) => [s.key, s]),
);

/** Look up a service definition by key. */
export function getServiceDef(key: string): CommunityServiceDef | undefined {
  return SERVICE_BY_KEY.get(key);
}

/** True when the key exists in the canonical catalog. */
export function isKnownServiceKey(key: string): boolean {
  return SERVICE_BY_KEY.has(key);
}

/** Sort an arbitrary list of keys into canonical catalog order (dropping unknowns). */
export function sortServiceKeys(keys: string[]): string[] {
  const set = new Set(keys);
  return ALL_SERVICE_KEYS.filter((k) => set.has(k));
}

/**
 * Resolve the effective enabled-services selection for an existing record.
 *
 * Semantics (per product spec):
 *  - `undefined` / `null` (field not populated / not yet loaded) → treat as ALL
 *    selected, to avoid destructively unchecking everything on legacy records.
 *  - `[]` (explicit empty array) → genuinely no services enabled.
 */
export function resolveEnabledServices(
  enabledServices: string[] | null | undefined,
): string[] {
  if (enabledServices == null) return [...ALL_SERVICE_KEYS];
  return sortServiceKeys(enabledServices);
}
