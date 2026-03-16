# Vendor Service Integration — Community Admin

This guide documents the Vendor Service GraphQL integration in the community admin application.

---

## Quick Start

### 1. Import the Vendor Service

```typescript
import VendorService from "@/services/vendorService";
// or import specific types/functions:
import { 
  getVendor, 
  getMyVendor, 
  createVendor,
  type VendorDTO,
  type ProductDTO,
  VendorStatus,
} from "@/services/graphql/vendor";
```

### 2. Example: Fetch and Display a Vendor

```typescript
import { useEffect, useState } from "react";
import VendorService from "@/services/vendorService";
import type { VendorDTO } from "@/services/graphql/vendor";

export function VendorProfile({ vendorId }: { vendorId: string }) {
  const [vendor, setVendor] = useState<VendorDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const v = await VendorService.getVendor(vendorId);
        setVendor(v);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  if (loading) return <p>Loading...</p>;
  if (!vendor) return <p>Vendor not found</p>;

  return (
    <div>
      <h2>{vendor.displayName}</h2>
      <p>Status: {vendor.status}</p>
      <p>Type: {vendor.type}</p>
      <p>Rating: {vendor.rating ?? "N/A"}</p>
    </div>
  );
}
```

---

## Project Structure

```
src/
├── services/
│   ├── graphql/
│   │   └── vendor/                      ← NEW
│   │       ├── types.ts                 # TypeScript types (DTO, enums)
│   │       ├── fragments.ts             # GraphQL fragments
│   │       ├── queries.ts               # GraphQL queries
│   │       ├── mutations.ts             # GraphQL mutations
│   │       └── index.ts                 # Barrel export
│   └── vendorService.ts                 ← NEW (High-level API)
│
├── pages/
│   └── Vendors.tsx                      ← NEW (Example page)
│
└── ...existing pages...
```

---

## Available Methods

### VendorService Class

The main service class provides static methods organized by feature:

#### Vendor Profile Operations

```typescript
// Get public vendor profile
const vendor = await VendorService.getVendor(vendorId: string);

// Get authenticated user's vendor profile
const myVendor = await VendorService.getMyVendor();

// Create vendor for authenticated user
const vendorId = await VendorService.createVendor({
  vendorType: "INDIVIDUAL",
  displayName: "Kwame Designs",
  description: "Custom fashion pieces",
});
```

#### Vendor Analytics & Eligibility

```typescript
// Get sales dashboard
const dashboard = await VendorService.getDashboard(vendorId?: string);
// Returns: { totalSales, totalEarnings, averageRating, completedOrders, ... }

// Check vendor eligibility (payout, selling capability)
const eligibility = await VendorService.checkEligibility(vendorId?: string);
// Returns: { canSell, canReceivePayout, isCompliant, ... }
```

#### File Upload Operations

```typescript
// Request signed GCS upload URL
const uploadData = await VendorService.requestUploadUrl(
  vendorId: string,
  fileName: string,
  contentType: string,  // e.g. "image/jpeg"
  fileType: "product" | "logo" | "download"
);
// Returns: { uploadUrl, readUrl, objectKey }

// Upload file to GCS
const success = await VendorService.uploadFile(uploadUrl: string, file: File);

// Upload and get read URL in one call
const readUrl = await VendorService.uploadFileWithUrl(
  vendorId: string,
  file: File,
  fileType: "product" | "logo" | "download"
);
```

#### Product Operations

```typescript
// Create product (initially DRAFT)
const productId = await VendorService.createProduct({
  vendorId,
  title: "Ankara Tote Bag",
  description: "Handcrafted...",
  price: 45,
  currency: "GHS",
  inventoryCount: 10,
  productType: "PHYSICAL",
  images: [readUrl1, readUrl2],
  tags: ["bag", "fashion"],
});

// Update product (must be DRAFT)
const success = await VendorService.updateProduct({
  productId,
  title: "Updated Title",
  description: "...",
  price: 50,
  inventoryCount: 8,
  images: [...],
  tags: [...],
});

// Publish product (DRAFT → PUBLISHED)
const success = await VendorService.publishProduct(productId);

// Delete product (hard delete)
const success = await VendorService.deleteProduct(productId);

// List products with pagination
const result = await VendorService.listProducts(
  vendorId?: string,
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  limit?: 20,
  offset?: 0
);
// Returns: { totalCount, items: ProductDTO[] }

// List published products (shorthand)
const result = await VendorService.listPublishedProducts(vendorId, limit, offset);
```

#### Service Package Operations

```typescript
// Create service package (initially DRAFT)
const packageId = await VendorService.createServicePackage({
  vendorId,
  title: "UI Design",
  description: "Custom design...",
  basePrice: 500,
  currency: "GHS",
  estimatedDuration: 14,
  benefits: ["3 revisions", "Source files"],
});

// Add milestone to package
const milestoneId = await VendorService.addMilestone({
  packageId,
  title: "Research & Wireframes",
  description: "Initial phase",
  percentageOfTotal: 30,
  estimatedDays: 4,
  deliverables: ["Wireframes", "Research report"],
  order: 1,
});

// Publish service package (DRAFT → PUBLISHED)
const success = await VendorService.publishServicePackage(packageId);

// List service packages
const result = await VendorService.listServicePackages(
  vendorId?: string,
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  limit?: 20,
  offset?: 0
);

// List published packages (shorthand)
const result = await VendorService.listPublishedServicePackages(vendorId, limit, offset);
```

#### Order Operations

```typescript
// List all orders
const result = await VendorService.listOrders(
  vendorId?: string,
  status?: "CREATED" | "SHIPPED" | "DELIVERED" | "REFUNDED",
  limit?: 20,
  offset?: 0
);

// List pending orders (CREATED)
const result = await VendorService.listPendingOrders(vendorId, limit, offset);

// List shipped orders
const result = await VendorService.listShippedOrders(vendorId, limit, offset);
```

#### Payout Operations

```typescript
// Request payout
// Prerequisites: Vendor must have canReceivePayout: true
const payoutId = await VendorService.requestPayout({
  vendorId,
  amount: 200,
  currency: "GHS",
});
```

#### Admin Operations

```typescript
// Suspend vendor (SYSTEM_ADMIN / MODERATOR only)
const success = await VendorService.suspendVendor({
  vendorId,
  reason: "Policy violation",
});

// Reinstate vendor (SYSTEM_ADMIN / SUPER_ADMIN only)
const success = await VendorService.reinstateVendor(vendorId);
```

#### Pagination Helper

```typescript
const pagination = VendorService.calculatePagination(
  totalCount: number,
  currentOffset: number,
  limit: number
);
// Returns: {
//   currentPage,
//   totalPages,
//   hasNextPage,
//   nextOffset,
//   hasPreviousPage,
//   previousOffset,
//   itemsInPage,
// }
```

---

## Data Types

### Core Vendor Types

```typescript
interface VendorDTO {
  id: string;
  userId: string;
  displayName: string;
  description: string;
  type: "INDIVIDUAL" | "BUSINESS";
  status: "DRAFT" | "ACTIVE" | "KYC_PENDING" | "SUSPENDED";
  logoUrl?: string | null;
  rating?: number;
  completedOrders?: number;
  capabilities?: { type: string; enabled: boolean }[];
  payoutAccounts?: PayoutAccount[];
  createdAt: string;
  updatedAt: string;
}

interface VendorDashboardDTO {
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

interface VendorEligibilityDTO {
  vendorId: string;
  canSell: boolean;
  canReceivePayout: boolean;
  isCompliant: boolean;
  status: VendorStatus;
  payoutAccountCount: number;
  verifiedPayoutAccounts: number;
  activeSuspensionCount: number;
}
```

### Product Types

```typescript
interface ProductDTO {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  inventoryCount: number;
  productType: "PHYSICAL" | "DIGITAL";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  shippingProfileId?: string | null;
  downloadUrl?: string | null;
  images?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductListPaginatedDTO {
  totalCount: number;
  items: ProductDTO[];
}
```

### Service Package Types

```typescript
interface ServicePackageDTO {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  estimatedDuration: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  benefits?: string[];
  milestones?: MilestoneDTO[];
  createdAt: string;
  updatedAt: string;
}

interface MilestoneDTO {
  id: string;
  title: string;
  description: string;
  percentageOfTotal: number;
  estimatedDays: number;
  deliverables?: string[];
  order: number;
}
```

### Enums

```typescript
enum VendorStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  KYC_PENDING = "KYC_PENDING",
  SUSPENDED = "SUSPENDED",
}

enum VendorType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
}

enum ProductStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

enum ProductType {
  PHYSICAL = "PHYSICAL",
  DIGITAL = "DIGITAL",
}

enum OrderStatus {
  CREATED = "CREATED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  REFUNDED = "REFUNDED",
}

enum FileType {
  PRODUCT = "product",
  LOGO = "logo",
  DOWNLOAD = "download",
}
```

---

## Common Patterns

### Pagination Pattern

```typescript
const ITEMS_PER_PAGE = 20;
const [offset, setOffset] = useState(0);

const loadPage = async () => {
  const result = await VendorService.listProducts(
    undefined,
    undefined,
    ITEMS_PER_PAGE,
    offset
  );
  
  if (result) {
    const pagination = VendorService.calculatePagination(
      result.totalCount,
      offset,
      ITEMS_PER_PAGE
    );
    
    // Navigate to next page
    if (pagination.hasNextPage && pagination.nextOffset !== null) {
      setOffset(pagination.nextOffset);
    }
  }
};
```

### File Upload Pattern

```typescript
const handleFileUpload = async (file: File) => {
  // Get signed URL and upload in one call
  const readUrl = await VendorService.uploadFileWithUrl(
    vendorId,
    file,
    "product" // or "logo" or "download"
  );
  
  if (readUrl) {
    // Use readUrl in product creation
    const productId = await VendorService.createProduct({
      vendorId,
      title: "My Product",
      description: "...",
      price: 45,
      currency: "GHS",
      inventoryCount: 10,
      productType: "PHYSICAL",
      images: [readUrl], // ← Use the uploaded image
      tags: [],
    });
  }
};
```

### Multi-File Upload Pattern

```typescript
const handleMultipleFileUpload = async (files: File[]) => {
  const uploadedUrls: string[] = [];
  
  for (const file of files) {
    const readUrl = await VendorService.uploadFileWithUrl(
      vendorId,
      file,
      "product"
    );
    if (readUrl) {
      uploadedUrls.push(readUrl);
    }
  }
  
  // Use all URLs in product
  await VendorService.createProduct({
    vendorId,
    title: "Product with Multiple Images",
    // ... other fields ...
    images: uploadedUrls,
  });
};
```

### Eligibility Check Pattern

```typescript
const handlePublish = async (productId: string) => {
  // Check eligibility before allowing publish
  const eligibility = await VendorService.checkEligibility();
  
  if (!eligibility?.canSell) {
    alert("Your vendor account is not eligible to sell");
    return;
  }
  
  // Proceed with publish
  const success = await VendorService.publishProduct(productId);
  if (success) {
    alert("Product published!");
  }
};
```

### Error Handling

```typescript
try {
  const vendor = await VendorService.getVendor(vendorId);
  if (!vendor) {
    console.log("Vendor not found");
    return;
  }
  // Use vendor data
} catch (error) {
  if (error instanceof GraphQLUnauthorizedError) {
    // Handle 401 - redirect to login
    window.location.href = "/login";
  } else {
    console.error("Failed to fetch vendor:", error);
    // Show error toast/notification
  }
}
```

---

## Integration with React Components

### Using with Custom Hooks

```typescript
// hooks/useVendor.ts
import { useState, useEffect } from "react";
import VendorService from "@/services/vendorService";
import type { VendorDTO } from "@/services/graphql/vendor";

export function useVendor(vendorId: string) {
  const [vendor, setVendor] = useState<VendorDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const v = await VendorService.getVendor(vendorId);
        setVendor(v);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  return { vendor, loading, error };
}

// Usage in component
export function MyComponent({ vendorId }: { vendorId: string }) {
  const { vendor, loading, error } = useVendor(vendorId);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!vendor) return <p>Vendor not found</p>;
  
  return <div>{vendor.displayName}</div>;
}
```

---

## Authentication

All vendor service operations use the authenticated session token from `adminAuthService`. No additional authentication setup is required.

The `graphqlRequestWithAuth` helper in queries and mutations automatically:
- Retrieves the current access token
- Adds the `Authorization: Bearer <token>` header
- Handles 401 errors and re-authentication

---

## Examples Page

A complete example implementation is available in **[src/pages/Vendors.tsx](./Vendors.tsx)**

The page demonstrates:
- Searching for vendors by ID
- Displaying vendor profile information
- Listing products with status indicators
- Listing service packages with milestones
- Listing orders by status
- Admin actions (suspend/reinstate)
- Status badge styling
- Error handling and loading states

---

## Notes

- All methods return `null` on error (no exceptions thrown)
- The backend GraphQL endpoint is configured via `VITE_GRAPHQL_ENDPOINT` environment variable
- File uploads go directly to GCS — the API Gateway never sees the file content
- `vendorId` parameter is often optional; omit it to refer to the authenticated user's vendor
- Pagination uses offset-based pattern: `offset = currentPage * limit`

---

## Related Documentation

- Backend GraphQL Schema: See API.md in this directory
- Authentication Service: `/src/services/authentication/adminAuthService.ts`
- GraphQL Client: `/src/services/graphql/client.ts`
