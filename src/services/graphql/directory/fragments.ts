/**
 * GraphQL fragments for Directory Service types.
 * Reuse across queries and mutations.
 *
 * GraphQL type names mirror the api-gateway @ObjectType decorators:
 *   DirectoryListing, DirectoryListingSummary, DirectoryCategory,
 *   DirectoryListingContact, DirectoryListingLocation.
 */

export const DIRECTORY_CONTACT_FRAGMENT = `
  fragment DirectoryContactInfo on DirectoryListingContact {
    email
    phone
    website
    whatsapp
    facebook
    instagram
    linkedin
    twitter
  }
`;

export const DIRECTORY_LOCATION_FRAGMENT = `
  fragment DirectoryLocationInfo on DirectoryListingLocation {
    label
    addressLine1
    addressLine2
    city
    region
    country
    postalCode
    lat
    lng
  }
`;

/** Slim listing shape for list / search views. */
export const DIRECTORY_LISTING_SUMMARY_FRAGMENT = `
  fragment DirectoryListingSummaryInfo on DirectoryListingSummary {
    id
    ownerType
    ownerEntityId
    listingKind
    categoryCode
    displayName
    summary
    country
    languages
    tags
    status
    verificationStatus
    claimedUserId
    claimedVendorId
    publishedAt
    updatedAt
  }
`;

/** Full listing shape including contact, location and verification metadata. */
export const DIRECTORY_LISTING_FULL_FRAGMENT = `
  ${DIRECTORY_CONTACT_FRAGMENT}
  ${DIRECTORY_LOCATION_FRAGMENT}
  fragment DirectoryListingFullInfo on DirectoryListing {
    id
    ownerType
    ownerEntityId
    listingKind
    categoryId
    categoryCode
    displayName
    legalName
    summary
    description
    contact {
      ...DirectoryContactInfo
    }
    location {
      ...DirectoryLocationInfo
    }
    country
    languages
    tags
    status
    verificationStatus
    claimedUserId
    claimedVendorId
    verificationNote
    verifiedBy
    verificationSource
    claimedAt
    verifiedAt
    publishedAt
    archivedAt
    createdAt
    updatedAt
  }
`;

/** Directory category configuration row. */
export const DIRECTORY_CATEGORY_FRAGMENT = `
  fragment DirectoryCategoryInfo on DirectoryCategory {
    id
    ownerType
    ownerEntityId
    code
    displayName
    description
    listingKind
    isActive
    sortOrder
    version
    createdAt
    updatedAt
  }
`;
