import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  RESOURCE_SUMMARY_FRAGMENT,
  RESOURCE_CATEGORY_FRAGMENT,
} from "./fragments";
import type {
  ResourceSummary,
  ResourceCategory,
  ResourceOwnerType,
} from "./types";

const RESOURCES_BY_OWNER = `
  ${RESOURCE_SUMMARY_FRAGMENT}
  query ResourcesByOwner($ownerType: ResourceOwnerType!, $ownerEntityId: ID!) {
    resourcesByOwner(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...ResourceSummaryInfo
    }
  }
`;

const RESOURCE_CATEGORIES = `
  ${RESOURCE_CATEGORY_FRAGMENT}
  query ResourceCategories($ownerType: ResourceOwnerType!, $ownerEntityId: ID) {
    resourceCategories(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...ResourceCategoryInfo
    }
  }
`;

/**
 * Staff list of ALL resources owned by a community / association — INCLUDES
 * drafts and archived (the management screen needs to see every state). The
 * gateway membership-gates this to staff of the owner (fail-closed).
 */
export async function resourcesByOwner(
  ownerType: ResourceOwnerType,
  ownerEntityId: string,
): Promise<ResourceSummary[]> {
  const data = await graphqlRequestWithAuth<
    { resourcesByOwner: ResourceSummary[] },
    { ownerType: ResourceOwnerType; ownerEntityId: string }
  >(RESOURCES_BY_OWNER, { ownerType, ownerEntityId });
  return data.resourcesByOwner;
}

/**
 * Active categories for an owner — used to populate the create/edit form's
 * `categoryIds` multi-select. `ownerEntityId` omitted returns the owner_type
 * SYSTEM defaults; pass the scope id for org-specific categories.
 */
export async function resourceCategories(
  ownerType: ResourceOwnerType,
  ownerEntityId?: string,
): Promise<ResourceCategory[]> {
  const data = await graphqlRequestWithAuth<
    { resourceCategories: ResourceCategory[] },
    { ownerType: ResourceOwnerType; ownerEntityId?: string }
  >(RESOURCE_CATEGORIES, { ownerType, ownerEntityId });
  return data.resourceCategories;
}
