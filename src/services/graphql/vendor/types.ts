// TypeScript types for the Vendor service

// ============================================================================
// Vendor Types
// ============================================================================

export interface VendorCapability {
  type: string;
  enabled: boolean;
}

export interface PayoutAccount {
  id: string;
  provider: string;
  currency: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  verifiedAt?: string | null;
}

export interface VendorDTO {
  id: string;
  userId: string;
  displayName: string;
  description: string;
  type: VendorType; // INDIVIDUAL | BUSINESS
  status: VendorStatus; // DRAFT | ACTIVE | KYC_PENDING | SUSPENDED
  logoUrl?: string | null;
  rating?: number;
  completedOrders?: number;
  capabilities?: VendorCapability[];
  payoutAccounts?: PayoutAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorDashboardDTO {
  id: string;
  userId: string;
  displayName: string;
  totalSales: number;
  totalEarnings: number;
  averageRating: number;
  totalRatings: number;
  completedOrders: number;
  status: VendorStatus;
}

export interface VendorEligibilityDTO {
  vendorId: string;
  canSell: boolean; // can list products/services
  canReceivePayout: boolean; // KYC verified AND has a verified payout account
  isCompliant: boolean; // no active suspensions
  status: VendorStatus;
  payoutAccountCount: number;
  verifiedPayoutAccounts: number;
  activeSuspensionCount: number;
}

// ============================================================================
// Product Types
// ============================================================================

export interface ProductDTO {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  inventoryCount: number;
  productType: ProductType; // PHYSICAL | DIGITAL
  status: ProductStatus; // DRAFT | PUBLISHED | ARCHIVED
  shippingProfileId?: string | null;
  downloadUrl?: string | null;
  images?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListPaginatedDTO {
  totalCount: number;
  items: ProductDTO[];
}

// ============================================================================
// Service Package Types
// ============================================================================

export interface MilestoneDTO {
  id: string;
  title: string;
  description: string;
  percentageOfTotal: number;
  estimatedDays: number;
  deliverables?: string[];
  order: number;
}

export interface ServicePackageDTO {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  estimatedDuration: number;
  status: ProductStatus; // DRAFT | PUBLISHED | ARCHIVED
  benefits?: string[];
  milestones?: MilestoneDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicePackageListPaginatedDTO {
  totalCount: number;
  items: ServicePackageDTO[];
}

// ============================================================================
// Order Types
// ============================================================================

export interface VendorOrderDTO {
  id: string;
  vendorId: string;
  buyerId: string;
  status: OrderStatus; // CREATED | SHIPPED | DELIVERED | REFUNDED
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrderListPaginatedDTO {
  totalCount: number;
  items: VendorOrderDTO[];
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface UploadUrlDTO {
  uploadUrl: string; // PUT to this URL
  readUrl: string; // use in product.images[] or logoUrl
  objectKey: string; // GCS object key
}

// ============================================================================
// Enums
// ============================================================================

export enum VendorStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  KYC_PENDING = "KYC_PENDING",
  SUSPENDED = "SUSPENDED",
}

export enum VendorType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
}

export enum ProductStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum ProductType {
  PHYSICAL = "PHYSICAL",
  DIGITAL = "DIGITAL",
}

export enum OrderStatus {
  CREATED = "CREATED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  REFUNDED = "REFUNDED",
}

export enum FileType {
  PRODUCT = "product",
  LOGO = "logo",
  DOWNLOAD = "download",
}

// ============================================================================
// Request/Response Wrappers
// ============================================================================

export interface CreateVendorInput {
  vendorType: VendorType | string;
  displayName: string;
  description: string;
}

export interface UpdateVendorInput {
  displayName?: string;
  description?: string;
  logoUrl?: string;
}

export interface CreateProductInput {
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  inventoryCount: number;
  productType: ProductType | string;
  shippingProfileId?: string | null;
  downloadUrl?: string | null;
  images?: string[];
  tags?: string[];
}

export interface UpdateProductInput {
  productId: string;
  title: string;
  description: string;
  price: number;
  inventoryCount: number;
  images?: string[];
  tags?: string[];
}

export interface CreateServicePackageInput {
  vendorId: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  estimatedDuration: number;
  benefits: string[];
}

export interface AddMilestoneInput {
  packageId: string;
  title: string;
  description: string;
  percentageOfTotal: number;
  estimatedDays: number;
  deliverables: string[];
  order: number;
}

export interface RequestPayoutInput {
  vendorId: string;
  amount: number;
  currency: string;
}

export interface SuspendVendorInput {
  vendorId: string;
  reason: string;
}

// ============================================================================
// Query/Mutation response types
// ============================================================================

export interface GetVendorResponse {
  getVendor?: VendorDTO | null;
}

export interface GetMyVendorResponse {
  getMyVendor?: VendorDTO | null;
}

export interface GetVendorDashboardResponse {
  getVendorDashboard?: VendorDashboardDTO;
}

export interface GetVendorEligibilityResponse {
  getVendorEligibility?: VendorEligibilityDTO;
}

export interface ListVendorProductsResponse {
  listVendorProducts?: ProductListPaginatedDTO;
}

export interface ListVendorServicePackagesResponse {
  listVendorServicePackages?: ServicePackageListPaginatedDTO;
}

export interface ListVendorOrdersResponse {
  listVendorOrders?: VendorOrderListPaginatedDTO;
}

// ============================================================================
// Community-Scoped Listing Types
// ============================================================================

export interface VendorListingDTO {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface VendorListingListResponse {
  items: VendorListingDTO[];
  total: number;
}

export interface GetCommunityScopedListingsResponse {
  getCommunityScopedListings?: VendorListingListResponse;
}

// ============================================================================
// Community-Scoped Order Types
// ============================================================================

export interface CommunityScopedVendorOrderDTO {
  id: string;
  vendorId: string;
  vendorName: string;
  buyerId: string;
  buyerName: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface VendorOrderListResponse {
  items: CommunityScopedVendorOrderDTO[];
  total: number;
}

export interface GetCommunityScopedOrdersResponse {
  getCommunityScopedOrders?: VendorOrderListResponse;
}

export interface CreateVendorResponse {
  createVendor?: string; // vendorId
}

export interface RequestVendorUploadUrlResponse {
  requestVendorUploadUrl?: UploadUrlDTO;
}

export interface CreateProductResponse {
  createProduct?: string; // productId
}

export interface UpdateProductResponse {
  updateProduct?: boolean;
}

export interface PublishProductResponse {
  publishProduct?: boolean;
}

export interface DeleteProductResponse {
  deleteProduct?: boolean;
}

export interface CreateServicePackageResponse {
  createServicePackage?: string; // packageId
}

export interface AddMilestoneResponse {
  addMilestone?: string; // milestoneId
}

export interface PublishServicePackageResponse {
  publishServicePackage?: boolean;
}

export interface RequestPayoutResponse {
  requestPayout?: string; // payoutId
}

export interface SuspendVendorResponse {
  suspendVendor?: boolean;
}

export interface ReinstateVendorResponse {
  reinstateVendor?: boolean;
}
