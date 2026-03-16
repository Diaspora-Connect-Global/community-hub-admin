// Vendor Service — High-level utility for vendor operations

import {
  getVendor,
  getMyVendor,
  getVendorDashboard,
  getVendorEligibility,
  listVendorProducts,
  listVendorServicePackages,
  listVendorOrders,
  createVendor,
  requestVendorUploadUrl,
  uploadFileToGCS,
  createProduct,
  updateProduct,
  publishProduct,
  deleteProduct,
  createServicePackage,
  addMilestone,
  publishServicePackage,
  requestPayout,
  suspendVendor,
  reinstateVendor,
} from "@/services/graphql/vendor";
import type {
  VendorDTO,
  VendorDashboardDTO,
  VendorEligibilityDTO,
  ProductDTO,
  ProductListPaginatedDTO,
  ServicePackageDTO,
  ServicePackageListPaginatedDTO,
  VendorOrderListPaginatedDTO,
  UploadUrlDTO,
  CreateVendorInput,
  CreateProductInput,
  UpdateProductInput,
  CreateServicePackageInput,
  AddMilestoneInput,
  RequestPayoutInput,
  SuspendVendorInput,
  FileType,
} from "@/services/graphql/vendor";

/**
 * High-level vendor service API
 */
export class VendorService {
  // ============================================================================
  // Vendor Profile Operations
  // ============================================================================

  /**
   * Get public vendor profile
   */
  static async getVendor(vendorId: string): Promise<VendorDTO | null> {
    return getVendor(vendorId);
  }

  /**
   * Get authenticated user's vendor profile
   * Returns null if user is not a vendor
   */
  static async getMyVendor(): Promise<VendorDTO | null> {
    return getMyVendor();
  }

  /**
   * Create a vendor profile for authenticated user
   */
  static async createVendor(input: CreateVendorInput): Promise<string | null> {
    return createVendor(input);
  }

  // ============================================================================
  // Vendor Analytics & Eligibility
  // ============================================================================

  /**
   * Get vendor dashboard (sales analytics)
   * @param vendorId Optional - if omitted, gets authenticated user's dashboard
   */
  static async getDashboard(vendorId?: string): Promise<VendorDashboardDTO | null> {
    return getVendorDashboard(vendorId);
  }

  /**
   * Check vendor eligibility (compliance, payout availability, etc)
   * @param vendorId Optional - if omitted, checks authenticated user's vendor
   */
  static async checkEligibility(vendorId?: string): Promise<VendorEligibilityDTO | null> {
    return getVendorEligibility(vendorId);
  }

  // ============================================================================
  // File Upload Operations
  // ============================================================================

  /**
   * Request a signed GCS upload URL for a file
   * @param vendorId Vendor ID
   * @param fileName Original file name
   * @param contentType MIME type (e.g. "image/jpeg")
   * @param fileType "product" | "logo" | "download"
   * @returns Upload URL, read URL, and object key
   */
  static async requestUploadUrl(
    vendorId: string,
    fileName: string,
    contentType: string,
    fileType: FileType | string
  ): Promise<UploadUrlDTO | null> {
    return requestVendorUploadUrl(vendorId, fileName, contentType, fileType);
  }

  /**
   * Upload a file directly to GCS
   * Use the uploadUrl from requestUploadUrl
   */
  static async uploadFile(uploadUrl: string, file: File): Promise<boolean> {
    return uploadFileToGCS(uploadUrl, file);
  }

  /**
   * Upload a file and get the read URL in one operation
   */
  static async uploadFileWithUrl(
    vendorId: string,
    file: File,
    fileType: FileType | string
  ): Promise<string | null> {
    try {
      // Step 1: Get signed URL
      const urlData = await this.requestUploadUrl(
        vendorId,
        file.name,
        file.type,
        fileType
      );
      if (!urlData) return null;

      // Step 2: Upload file to GCS
      const uploadSuccess = await this.uploadFile(urlData.uploadUrl, file);
      if (!uploadSuccess) return null;

      // Step 3: Return read URL for use in subsequent operations
      return urlData.readUrl;
    } catch (error) {
      console.error("Failed to upload file with URL:", error);
      return null;
    }
  }

  // ============================================================================
  // Product Operations
  // ============================================================================

  /**
   * Create a new product (initially in DRAFT status)
   */
  static async createProduct(input: CreateProductInput): Promise<string | null> {
    return createProduct(input);
  }

  /**
   * Update an existing product (must be in DRAFT status)
   */
  static async updateProduct(input: UpdateProductInput): Promise<boolean> {
    return updateProduct(input);
  }

  /**
   * Publish a product (DRAFT → PUBLISHED)
   */
  static async publishProduct(productId: string): Promise<boolean> {
    return publishProduct(productId);
  }

  /**
   * Delete a product (hard delete)
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    return deleteProduct(productId);
  }

  /**
   * List vendor products with pagination
   * @param vendorId Optional - defaults to authenticated user's vendor
   * @param status Optional - filter by DRAFT, PUBLISHED, ARCHIVED
   * @param limit Items per page (default: 20)
   * @param offset Items to skip (default: 0)
   */
  static async listProducts(
    vendorId?: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<ProductListPaginatedDTO | null> {
    return listVendorProducts(vendorId, status, limit, offset);
  }

  /**
   * List published products (shorthand)
   */
  static async listPublishedProducts(
    vendorId?: string,
    limit = 20,
    offset = 0
  ): Promise<ProductListPaginatedDTO | null> {
    return this.listProducts(vendorId, "PUBLISHED", limit, offset);
  }

  // ============================================================================
  // Service Package Operations
  // ============================================================================

  /**
   * Create a new service package (initially in DRAFT status)
   */
  static async createServicePackage(
    input: CreateServicePackageInput
  ): Promise<string | null> {
    return createServicePackage(input);
  }

  /**
   * Add a milestone to a service package
   */
  static async addMilestone(input: AddMilestoneInput): Promise<string | null> {
    return addMilestone(input);
  }

  /**
   * Publish a service package (DRAFT → PUBLISHED)
   */
  static async publishServicePackage(packageId: string): Promise<boolean> {
    return publishServicePackage(packageId);
  }

  /**
   * List vendor service packages with pagination
   * @param vendorId Optional - defaults to authenticated user's vendor
   * @param status Optional - filter by DRAFT, PUBLISHED, ARCHIVED
   * @param limit Items per page (default: 20)
   * @param offset Items to skip (default: 0)
   */
  static async listServicePackages(
    vendorId?: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<ServicePackageListPaginatedDTO | null> {
    return listVendorServicePackages(vendorId, status, limit, offset);
  }

  /**
   * List published service packages (shorthand)
   */
  static async listPublishedServicePackages(
    vendorId?: string,
    limit = 20,
    offset = 0
  ): Promise<ServicePackageListPaginatedDTO | null> {
    return this.listServicePackages(vendorId, "PUBLISHED", limit, offset);
  }

  // ============================================================================
  // Order Operations
  // ============================================================================

  /**
   * List vendor orders with pagination
   * @param vendorId Optional - defaults to authenticated user's vendor
   * @param status Optional - filter by CREATED, SHIPPED, DELIVERED, REFUNDED
   * @param limit Items per page (default: 20)
   * @param offset Items to skip (default: 0)
   */
  static async listOrders(
    vendorId?: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<VendorOrderListPaginatedDTO | null> {
    return listVendorOrders(vendorId, status, limit, offset);
  }

  /**
   * List pending orders (CREATED status)
   */
  static async listPendingOrders(
    vendorId?: string,
    limit = 20,
    offset = 0
  ): Promise<VendorOrderListPaginatedDTO | null> {
    return this.listOrders(vendorId, "CREATED", limit, offset);
  }

  /**
   * List shipped orders
   */
  static async listShippedOrders(
    vendorId?: string,
    limit = 20,
    offset = 0
  ): Promise<VendorOrderListPaginatedDTO | null> {
    return this.listOrders(vendorId, "SHIPPED", limit, offset);
  }

  // ============================================================================
  // Payout Operations
  // ============================================================================

  /**
   * Request a payout
   * Prerequisites: Vendor must have canReceivePayout: true
   */
  static async requestPayout(input: RequestPayoutInput): Promise<string | null> {
    return requestPayout(input);
  }

  // ============================================================================
  // Admin Operations
  // ============================================================================

  /**
   * Suspend a vendor (admin only)
   */
  static async suspendVendor(input: SuspendVendorInput): Promise<boolean> {
    return suspendVendor(input);
  }

  /**
   * Reinstate a vendor (admin only)
   */
  static async reinstateVendor(vendorId: string): Promise<boolean> {
    return reinstateVendor(vendorId);
  }

  // ============================================================================
  // Pagination Helper
  // ============================================================================

  /**
   * Calculate pagination details
   */
  static calculatePagination(
    totalCount: number,
    currentOffset: number,
    limit: number
  ) {
    const currentPage = Math.floor(currentOffset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentOffset + limit < totalCount;
    const nextOffset = hasNextPage ? currentOffset + limit : null;
    const hasPreviousPage = currentOffset > 0;
    const previousOffset = hasPreviousPage ? Math.max(0, currentOffset - limit) : null;

    return {
      currentPage,
      totalPages,
      hasNextPage,
      nextOffset,
      hasPreviousPage,
      previousOffset,
      itemsInPage: Math.min(limit, totalCount - currentOffset),
    };
  }
}

export default VendorService;
