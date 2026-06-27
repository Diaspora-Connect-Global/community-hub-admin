/**
 * GraphQL fragments for Resource Service types.
 * GraphQL type names mirror the api-gateway @ObjectType names.
 */

/** Slim summary used by list endpoints — `ResourceSummary`. */
export const RESOURCE_SUMMARY_FRAGMENT = `
  fragment ResourceSummaryInfo on ResourceSummary {
    id
    resourceNumber
    title
    fileType
    status
    visibility
    categoryIds
    tags
    featured
    pinned
    viewCount
    downloadCount
    publishedAt
    updatedAt
  }
`;

/**
 * Minimal safe selection of the full aggregate — `Resource`. Mutations return
 * the full Resource; we only read back the fields the UI needs.
 */
export const RESOURCE_FRAGMENT = `
  fragment ResourceInfo on Resource {
    id
    title
    status
    visibility
    fileType
  }
`;

/** A resource category — `ResourceCategory`. */
export const RESOURCE_CATEGORY_FRAGMENT = `
  fragment ResourceCategoryInfo on ResourceCategory {
    id
    ownerType
    ownerEntityId
    code
    displayName
    icon
    isActive
    sortOrder
    version
  }
`;
