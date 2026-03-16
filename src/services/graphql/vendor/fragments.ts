// GraphQL fragments for vendor service

export const VENDOR_CORE_FRAGMENT = `
  fragment VendorCore on Vendor {
    id
    userId
    displayName
    description
    type
    status
    logoUrl
    rating
    completedOrders
    createdAt
    updatedAt
  }
`;

export const VENDOR_WITH_CAPABILITIES_FRAGMENT = `
  fragment VendorWithCapabilities on Vendor {
    ...VendorCore
    capabilities {
      type
      enabled
    }
  }
`;

export const VENDOR_WITH_PAYOUTS_FRAGMENT = `
  fragment VendorWithPayouts on Vendor {
    ...VendorCore
    payoutAccounts {
      id
      provider
      currency
      isDefault
      isVerified
      createdAt
      verifiedAt
    }
  }
`;

export const VENDOR_FULL_FRAGMENT = `
  fragment VendorFull on Vendor {
    ...VendorCore
    capabilities {
      type
      enabled
    }
    payoutAccounts {
      id
      provider
      currency
      isDefault
      isVerified
      createdAt
      verifiedAt
    }
  }
`;

export const PRODUCT_FRAGMENT = `
  fragment Product on Product {
    id
    vendorId
    title
    description
    price
    currency
    inventoryCount
    productType
    status
    shippingProfileId
    downloadUrl
    images
    tags
    createdAt
    updatedAt
  }
`;

export const SERVICE_PACKAGE_FRAGMENT = `
  fragment ServicePackage on ServicePackage {
    id
    vendorId
    title
    description
    basePrice
    currency
    estimatedDuration
    status
    benefits
    createdAt
    updatedAt
  }
`;

export const MILESTONE_FRAGMENT = `
  fragment Milestone on Milestone {
    id
    title
    description
    percentageOfTotal
    estimatedDays
    deliverables
    order
  }
`;

export const SERVICE_PACKAGE_WITH_MILESTONES_FRAGMENT = `
  fragment ServicePackageWithMilestones on ServicePackage {
    ...ServicePackage
    milestones {
      ...Milestone
    }
  }
`;

export const VENDOR_ORDER_FRAGMENT = `
  fragment VendorOrder on Order {
    id
    vendorId
    buyerId
    status
    totalAmount
    currency
    createdAt
    updatedAt
  }
`;

export const VENDOR_DASHBOARD_FRAGMENT = `
  fragment VendorDashboard on VendorDashboard {
    id
    userId
    displayName
    totalSales
    totalEarnings
    averageRating
    totalRatings
    completedOrders
    status
  }
`;

export const VENDOR_ELIGIBILITY_FRAGMENT = `
  fragment VendorEligibility on VendorEligibility {
    vendorId
    canSell
    canReceivePayout
    isCompliant
    status
    payoutAccountCount
    verifiedPayoutAccounts
    activeSuspensionCount
  }
`;

export const UPLOAD_URL_FRAGMENT = `
  fragment UploadUrl on UploadUrl {
    uploadUrl
    readUrl
    objectKey
  }
`;
