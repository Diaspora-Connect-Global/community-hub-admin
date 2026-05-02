// GraphQL queries for vendor service

import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type {
  GetVendorResponse,
  GetMyVendorResponse,
  GetVendorDashboardResponse,
  GetVendorEligibilityResponse,
  ListVendorProductsResponse,
  ListVendorServicePackagesResponse,
  ListVendorOrdersResponse,
  VendorDTO,
  VendorDashboardDTO,
  VendorEligibilityDTO,
  ProductListPaginatedDTO,
  ServicePackageListPaginatedDTO,
  VendorOrderListPaginatedDTO,
  GetCommunityScopedListingsResponse,
  GetCommunityScopedOrdersResponse,
  VendorListingListResponse,
  VendorOrderListResponse,
} from "./types";

/**
 * Get a public vendor profile by vendorId
 * No authentication required
 */
export async function getVendor(vendorId: string): Promise<VendorDTO | null> {
  const query = `
    query GetVendor($vendorId: String!) {
      getVendor(vendorId: $vendorId) {
        id
        userId
        displayName
        description
        type
        status
        logoUrl
        rating
        completedOrders
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
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetVendorResponse>(query, { vendorId });
    return data.getVendor ?? null;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user's vendor profile
 * Returns null if user has no vendor
 */
export async function getMyVendor(): Promise<VendorDTO | null> {
  const query = `
    query GetMyVendor {
      getMyVendor {
        id
        userId
        displayName
        description
        type
        status
        logoUrl
        rating
        completedOrders
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
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetMyVendorResponse>(query);
    return data.getMyVendor ?? null;
  } catch {
    return null;
  }
}

/**
 * Get vendor dashboard (sales analytics)
 * @param vendorId Optional - if omitted, gets authenticated user's dashboard
 */
export async function getVendorDashboard(
  vendorId?: string
): Promise<VendorDashboardDTO | null> {
  const query = `
    query GetVendorDashboard($vendorId: String) {
      getVendorDashboard(vendorId: $vendorId) {
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
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetVendorDashboardResponse>(query, {
      vendorId,
    });
    return data.getVendorDashboard ?? null;
  } catch {
    return null;
  }
}

/**
 * Get vendor eligibility (compliance status)
 * Use to gate "Request Payout" or "Publish Product" buttons
 */
export async function getVendorEligibility(
  vendorId?: string
): Promise<VendorEligibilityDTO | null> {
  const query = `
    query GetVendorEligibility($vendorId: String) {
      getVendorEligibility(vendorId: $vendorId) {
        vendorId
        canSell
        canReceivePayout
        isCompliant
        status
        payoutAccountCount
        verifiedPayoutAccounts
        activeSuspensionCount
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetVendorEligibilityResponse>(query, {
      vendorId,
    });
    return data.getVendorEligibility ?? null;
  } catch {
    return null;
  }
}

/**
 * List vendor products with pagination
 * @param vendorId Optional - if omitted, defaults to authenticated vendor
 * @param status Optional - filter by status (DRAFT, PUBLISHED, ARCHIVED)
 * @param limit Default: 20
 * @param offset Default: 0
 */
export async function listVendorProducts(
  vendorId?: string,
  status?: string,
  limit = 20,
  offset = 0
): Promise<ProductListPaginatedDTO | null> {
  const query = `
    query ListVendorProducts(
      $vendorId: String
      $status: String
      $limit: Int
      $offset: Int
    ) {
      listVendorProducts(
        vendorId: $vendorId
        status: $status
        limit: $limit
        offset: $offset
      ) {
        totalCount
        items {
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
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<ListVendorProductsResponse>(query, {
      vendorId,
      status,
      limit,
      offset,
    });
    return data.listVendorProducts ?? null;
  } catch {
    return null;
  }
}

/**
 * List vendor service packages with pagination
 * @param vendorId Optional - if omitted, defaults to authenticated vendor
 * @param status Optional - filter by status (DRAFT, PUBLISHED, ARCHIVED)
 * @param limit Default: 20
 * @param offset Default: 0
 */
export async function listVendorServicePackages(
  vendorId?: string,
  status?: string,
  limit = 20,
  offset = 0
): Promise<ServicePackageListPaginatedDTO | null> {
  const query = `
    query ListVendorServicePackages(
      $vendorId: String
      $status: String
      $limit: Int
      $offset: Int
    ) {
      listVendorServicePackages(
        vendorId: $vendorId
        status: $status
        limit: $limit
        offset: $offset
      ) {
        totalCount
        items {
          id
          vendorId
          title
          description
          basePrice
          currency
          estimatedDuration
          status
          benefits
          milestones {
            id
            title
            description
            percentageOfTotal
            estimatedDays
            deliverables
            order
          }
          createdAt
          updatedAt
        }
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<ListVendorServicePackagesResponse>(
      query,
      { vendorId, status, limit, offset }
    );
    return data.listVendorServicePackages ?? null;
  } catch {
    return null;
  }
}

/**
 * List vendor orders with pagination
 * @param vendorId Optional - if omitted, defaults to authenticated vendor
 * @param status Optional - filter by status (CREATED, SHIPPED, DELIVERED, REFUNDED)
 * @param limit Default: 20
 * @param offset Default: 0
 */
export async function listVendorOrders(
  vendorId?: string,
  status?: string,
  limit = 20,
  offset = 0
): Promise<VendorOrderListPaginatedDTO | null> {
  const query = `
    query ListVendorOrders(
      $vendorId: String
      $status: String
      $limit: Int
      $offset: Int
    ) {
      listVendorOrders(
        vendorId: $vendorId
        status: $status
        limit: $limit
        offset: $offset
      ) {
        totalCount
        items {
          id
          vendorId
          buyerId
          status
          totalAmount
          currency
          createdAt
          updatedAt
        }
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<ListVendorOrdersResponse>(query, {
      vendorId,
      status,
      limit,
      offset,
    });
    return data.listVendorOrders ?? null;
  } catch {
    return null;
  }
}

/**
 * Get all vendor listings scoped to a community
 * @param communityId The community to scope listings to
 * @param limit Default: 20
 * @param offset Default: 0
 */
export async function getCommunityScopedListings(
  communityId: string,
  limit = 20,
  offset = 0,
): Promise<VendorListingListResponse | null> {
  const query = `
    query GetCommunityScopedListings(
      $communityId: String!
      $limit: Int
      $offset: Int
    ) {
      getCommunityScopedListings(
        communityId: $communityId
        limit: $limit
        offset: $offset
      ) {
        items {
          id
          vendorId
          vendorName
          title
          price
          currency
          category
          status
          createdAt
        }
        total
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetCommunityScopedListingsResponse>(query, {
      communityId,
      limit,
      offset,
    });
    return data.getCommunityScopedListings ?? null;
  } catch {
    return null;
  }
}

/**
 * Get all vendor orders scoped to a community
 * @param communityId The community to scope orders to
 * @param limit Default: 20
 * @param offset Default: 0
 */
export async function getCommunityScopedOrders(
  communityId: string,
  limit = 20,
  offset = 0,
): Promise<VendorOrderListResponse | null> {
  const query = `
    query GetCommunityScopedOrders(
      $communityId: String!
      $limit: Int
      $offset: Int
    ) {
      getCommunityScopedOrders(
        communityId: $communityId
        limit: $limit
        offset: $offset
      ) {
        items {
          id
          vendorId
          vendorName
          buyerId
          buyerName
          total
          currency
          status
          createdAt
        }
        total
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<GetCommunityScopedOrdersResponse>(query, {
      communityId,
      limit,
      offset,
    });
    return data.getCommunityScopedOrders ?? null;
  } catch {
    return null;
  }
}
