# Vendor Service — Quick Reference

## Import

```typescript
import VendorService from "@/services/vendorService";
import type { VendorDTO, ProductDTO, ... } from "@/services/graphql/vendor";
```

## Vendor Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `getVendor(vendorId)` | Get public vendor profile | `VendorDTO \| null` |
| `getMyVendor()` | Get authenticated user's vendor | `VendorDTO \| null` |
| `createVendor(input)` | Create vendor for auth user | `string \| null` (vendorId) |
| `getDashboard(vendorId?)` | Get sales analytics | `VendorDashboardDTO \| null` |
| `checkEligibility(vendorId?)` | Check payout/sell eligibility | `VendorEligibilityDTO \| null` |

## File Upload

| Method | Description | Returns |
|--------|-------------|---------|
| `requestUploadUrl(vendorId, fileName, contentType, fileType)` | Get GCS signed URL | `UploadUrlDTO \| null` |
| `uploadFile(uploadUrl, file)` | Upload file to GCS | `boolean` |
| `uploadFileWithUrl(vendorId, file, fileType)` | Upload + get read URL (all-in-one) | `string \| null` (readUrl) |

## Product Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `createProduct(input)` | Create product (DRAFT) | `string \| null` (productId) |
| `updateProduct(input)` | Update product (must be DRAFT) | `boolean` |
| `publishProduct(productId)` | Publish product (DRAFT → PUBLISHED) | `boolean` |
| `deleteProduct(productId)` | Delete product (hard delete) | `boolean` |
| `listProducts(vendorId?, status?, limit, offset)` | List products with pagination | `ProductListPaginatedDTO \| null` |
| `listPublishedProducts(vendorId?, limit, offset)` | List published products | `ProductListPaginatedDTO \| null` |

## Service Package Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `createServicePackage(input)` | Create service package (DRAFT) | `string \| null` (packageId) |
| `addMilestone(input)` | Add milestone to package | `string \| null` (milestoneId) |
| `publishServicePackage(packageId)` | Publish package (DRAFT → PUBLISHED) | `boolean` |
| `listServicePackages(vendorId?, status?, limit, offset)` | List packages | `ServicePackageListPaginatedDTO \| null` |
| `listPublishedServicePackages(vendorId?, limit, offset)` | List published packages | `ServicePackageListPaginatedDTO \| null` |

## Order Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `listOrders(vendorId?, status?, limit, offset)` | List orders | `VendorOrderListPaginatedDTO \| null` |
| `listPendingOrders(vendorId?, limit, offset)` | List CREATED orders | `VendorOrderListPaginatedDTO \| null` |
| `listShippedOrders(vendorId?, limit, offset)` | List SHIPPED orders | `VendorOrderListPaginatedDTO \| null` |

## Payout & Admin Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `requestPayout(input)` | Request payout (requires eligibility) | `string \| null` (payoutId) |
| `suspendVendor(input)` | Suspend vendor (admin only) | `boolean` |
| `reinstateVendor(vendorId)` | Reinstate vendor (admin only) | `boolean` |

## Pagination Helper

```typescript
const pagination = VendorService.calculatePagination(totalCount, offset, limit);
// Returns: { currentPage, totalPages, hasNextPage, nextOffset, ... }
```

---

## Status Enums

```typescript
VendorStatus:      DRAFT, ACTIVE, KYC_PENDING, SUSPENDED
VendorType:        INDIVIDUAL, BUSINESS
ProductStatus:     DRAFT, PUBLISHED, ARCHIVED
ProductType:       PHYSICAL, DIGITAL
OrderStatus:       CREATED, SHIPPED, DELIVERED, REFUNDED
FileType:          PRODUCT, LOGO, DOWNLOAD
```

---

## Common Code Snippets

### Check if vendor exists
```typescript
const vendor = await VendorService.getMyVendor();
if (!vendor) {
  // User is not a vendor, show "create vendor" prompt
}
```

### Check before publishing
```typescript
const eligibility = await VendorService.checkEligibility();
if (!eligibility?.canSell) {
  alert("Not eligible to publish");
  return;
}
```

### Upload product image
```typescript
const readUrl = await VendorService.uploadFileWithUrl(
  vendorId,
  imageFile,
  "product"
);
```

### List products with pagination
```typescript
const result = await VendorService.listPublishedProducts(vendorId, 20, 0);
if (result) {
  const nextPage = VendorService.calculatePagination(result.totalCount, 0, 20);
  console.log(`Page 1 of ${nextPage.totalPages}`);
}
```

### Suspend vendor (admin)
```typescript
await VendorService.suspendVendor({
  vendorId,
  reason: "Policy violation"
});
```

---

## Error Handling

All methods return `null` on error — handle gracefully:

```typescript
const vendor = await VendorService.getVendor(vendorId);
if (!vendor) {
  // Handle null response (vendor not found or error)
  console.log("Vendor not found or error occurred");
}
```

For authentication errors (401), the `graphqlRequestWithAuth` helper automatically redirects to login.

---

## See Also

- [Full Integration Guide](./INTEGRATION_GUIDE.md)
- [Example Page](../../../pages/Vendors.tsx)
- [Types Reference](./types.ts)
