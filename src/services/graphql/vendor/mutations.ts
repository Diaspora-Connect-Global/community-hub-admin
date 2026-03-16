// GraphQL mutations for vendor service

import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type {
  CreateVendorInput,
  CreateProductInput,
  UpdateProductInput,
  CreateServicePackageInput,
  AddMilestoneInput,
  RequestPayoutInput,
  SuspendVendorInput,
  CreateVendorResponse,
  RequestVendorUploadUrlResponse,
  CreateProductResponse,
  UpdateProductResponse,
  PublishProductResponse,
  DeleteProductResponse,
  CreateServicePackageResponse,
  AddMilestoneResponse,
  PublishServicePackageResponse,
  RequestPayoutResponse,
  SuspendVendorResponse,
  ReinstateVendorResponse,
  UploadUrlDTO,
  FileType,
} from "./types";

function toVariables<T>(input: T): Record<string, unknown> {
  return input as unknown as Record<string, unknown>;
}

/**
 * Create a vendor profile for the authenticated user
 */
export async function createVendor(input: CreateVendorInput): Promise<string | null> {
  const mutation = `
    mutation CreateVendor(
      $vendorType: String!
      $displayName: String!
      $description: String!
    ) {
      createVendor(
        vendorType: $vendorType
        displayName: $displayName
        description: $description
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<CreateVendorResponse>(mutation, toVariables(input));
    return data.createVendor ?? null;
  } catch (error) {
    console.error("Failed to create vendor:", error);
    return null;
  }
}

/**
 * Request a signed GCS URL for file upload
 * @param vendorId Vendor ID
 * @param fileName Original file name
 * @param contentType MIME type (e.g. "image/jpeg")
 * @param fileType "product" | "logo" | "download"
 */
export async function requestVendorUploadUrl(
  vendorId: string,
  fileName: string,
  contentType: string,
  fileType: FileType | string
): Promise<UploadUrlDTO | null> {
  const mutation = `
    mutation RequestVendorUploadUrl(
      $vendorId: String!
      $fileName: String!
      $contentType: String!
      $fileType: String!
    ) {
      requestVendorUploadUrl(
        vendorId: $vendorId
        fileName: $fileName
        contentType: $contentType
        fileType: $fileType
      ) {
        uploadUrl
        readUrl
        objectKey
      }
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<RequestVendorUploadUrlResponse>(
      mutation,
      { vendorId, fileName, contentType, fileType }
    );
    return data.requestVendorUploadUrl ?? null;
  } catch (error) {
    console.error("Failed to request upload URL:", error);
    return null;
  }
}

/**
 * Upload file directly to GCS using the signed URL
 * @param uploadUrl The signed URL from requestVendorUploadUrl
 * @param file The File object to upload
 */
export async function uploadFileToGCS(uploadUrl: string, file: File): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to upload file to GCS:", error);
    return false;
  }
}

/**
 * Create a product (initially in DRAFT status)
 */
export async function createProduct(input: CreateProductInput): Promise<string | null> {
  const mutation = `
    mutation CreateProduct(
      $vendorId: String!
      $title: String!
      $description: String!
      $price: Float!
      $currency: String!
      $inventoryCount: Int!
      $productType: String!
      $shippingProfileId: String
      $downloadUrl: String
      $images: [String!]
      $tags: [String!]
    ) {
      createProduct(
        vendorId: $vendorId
        title: $title
        description: $description
        price: $price
        currency: $currency
        inventoryCount: $inventoryCount
        productType: $productType
        shippingProfileId: $shippingProfileId
        downloadUrl: $downloadUrl
        images: $images
        tags: $tags
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<CreateProductResponse>(mutation, toVariables(input));
    return data.createProduct ?? null;
  } catch (error) {
    console.error("Failed to create product:", error);
    return null;
  }
}

/**
 * Update an existing product (must be in DRAFT status)
 */
export async function updateProduct(input: UpdateProductInput): Promise<boolean> {
  const mutation = `
    mutation UpdateProduct(
      $productId: String!
      $title: String!
      $description: String!
      $price: Float!
      $inventoryCount: Int!
      $images: [String!]
      $tags: [String!]
    ) {
      updateProduct(
        productId: $productId
        title: $title
        description: $description
        price: $price
        inventoryCount: $inventoryCount
        images: $images
        tags: $tags
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<UpdateProductResponse>(mutation, toVariables(input));
    return data.updateProduct ?? false;
  } catch (error) {
    console.error("Failed to update product:", error);
    return false;
  }
}

/**
 * Publish a product (DRAFT → PUBLISHED, visible in marketplace)
 */
export async function publishProduct(productId: string): Promise<boolean> {
  const mutation = `
    mutation PublishProduct($productId: String!) {
      publishProduct(productId: $productId)
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<PublishProductResponse>(mutation, {
      productId,
    });
    return data.publishProduct ?? false;
  } catch (error) {
    console.error("Failed to publish product:", error);
    return false;
  }
}

/**
 * Delete a product (hard delete, not recoverable)
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  const mutation = `
    mutation DeleteProduct($productId: String!) {
      deleteProduct(productId: $productId)
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<DeleteProductResponse>(mutation, {
      productId,
    });
    return data.deleteProduct ?? false;
  } catch (error) {
    console.error("Failed to delete product:", error);
    return false;
  }
}

/**
 * Create a service package (initially in DRAFT status)
 */
export async function createServicePackage(
  input: CreateServicePackageInput
): Promise<string | null> {
  const mutation = `
    mutation CreateServicePackage(
      $vendorId: String!
      $title: String!
      $description: String!
      $basePrice: Float!
      $currency: String!
      $estimatedDuration: Int!
      $benefits: [String!]
    ) {
      createServicePackage(
        vendorId: $vendorId
        title: $title
        description: $description
        basePrice: $basePrice
        currency: $currency
        estimatedDuration: $estimatedDuration
        benefits: $benefits
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<CreateServicePackageResponse>(
      mutation,
      toVariables(input)
    );
    return data.createServicePackage ?? null;
  } catch (error) {
    console.error("Failed to create service package:", error);
    return null;
  }
}

/**
 * Add a milestone to a service package
 * Call once per milestone
 */
export async function addMilestone(input: AddMilestoneInput): Promise<string | null> {
  const mutation = `
    mutation AddMilestone(
      $packageId: String!
      $title: String!
      $description: String!
      $percentageOfTotal: Float!
      $estimatedDays: Int!
      $deliverables: [String!]!
      $order: Int!
    ) {
      addMilestone(
        packageId: $packageId
        title: $title
        description: $description
        percentageOfTotal: $percentageOfTotal
        estimatedDays: $estimatedDays
        deliverables: $deliverables
        order: $order
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<AddMilestoneResponse>(mutation, toVariables(input));
    return data.addMilestone ?? null;
  } catch (error) {
    console.error("Failed to add milestone:", error);
    return null;
  }
}

/**
 * Publish a service package (DRAFT → PUBLISHED, visible in marketplace)
 */
export async function publishServicePackage(packageId: string): Promise<boolean> {
  const mutation = `
    mutation PublishServicePackage($packageId: String!) {
      publishServicePackage(packageId: $packageId)
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<PublishServicePackageResponse>(mutation, {
      packageId,
    });
    return data.publishServicePackage ?? false;
  } catch (error) {
    console.error("Failed to publish service package:", error);
    return false;
  }
}

/**
 * Request a payout
 * Prerequisites: Vendor must have canReceivePayout: true (KYC verified + verified payout account)
 */
export async function requestPayout(input: RequestPayoutInput): Promise<string | null> {
  const mutation = `
    mutation RequestPayout(
      $vendorId: String!
      $amount: Float!
      $currency: String!
    ) {
      requestPayout(
        vendorId: $vendorId
        amount: $amount
        currency: $currency
      )
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<RequestPayoutResponse>(mutation, toVariables(input));
    return data.requestPayout ?? null;
  } catch (error) {
    console.error("Failed to request payout:", error);
    return null;
  }
}

/**
 * Suspend a vendor (admin only - SYSTEM_ADMIN / MODERATOR)
 */
export async function suspendVendor(input: SuspendVendorInput): Promise<boolean> {
  const mutation = `
    mutation SuspendVendor($vendorId: String!, $reason: String!) {
      suspendVendor(vendorId: $vendorId, reason: $reason)
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<SuspendVendorResponse>(mutation, toVariables(input));
    return data.suspendVendor ?? false;
  } catch (error) {
    console.error("Failed to suspend vendor:", error);
    return false;
  }
}

/**
 * Reinstate a vendor (admin only - SYSTEM_ADMIN / SUPER_ADMIN)
 */
export async function reinstateVendor(vendorId: string): Promise<boolean> {
  const mutation = `
    mutation ReinstateVendor($vendorId: String!) {
      reinstateVendor(vendorId: $vendorId)
    }
  `;

  try {
    const data = await graphqlRequestWithAuth<ReinstateVendorResponse>(mutation, {
      vendorId,
    });
    return data.reinstateVendor ?? false;
  } catch (error) {
    console.error("Failed to reinstate vendor:", error);
    return false;
  }
}
