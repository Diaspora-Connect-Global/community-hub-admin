import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import VendorService from "@/services/vendorService";
import type {
  VendorDTO,
  ProductDTO,
  ServicePackageDTO,
  VendorOrderDTO,
} from "@/services/graphql/vendor";
import { VendorStatus, ProductStatus, OrderStatus } from "@/services/graphql/vendor";

export default function Vendors() {
  const [_vendors, _setVendors] = useState<VendorDTO[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorDTO | null>(null);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackageDTO[]>([]);
  const [orders, setOrders] = useState<VendorOrderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [searchVendorId, setSearchVendorId] = useState("");

  // Load vendor details
  const loadVendor = async (vendorId: string) => {
    setLoading(true);
    try {
      const vendor = await VendorService.getVendor(vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
        await Promise.all([
          loadProducts(vendorId),
          loadServicePackages(vendorId),
          loadOrders(vendorId),
        ]);
      }
    } catch (error) {
      console.error("Failed to load vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load products
  const loadProducts = async (vendorId?: string) => {
    try {
      const result = await VendorService.listProducts(vendorId);
      if (result) {
        setProducts(result.items);
        setTotalProductCount(result.totalCount);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  // Load service packages
  const loadServicePackages = async (vendorId?: string) => {
    try {
      const result = await VendorService.listServicePackages(vendorId);
      if (result) {
        setServicePackages(result.items);
      }
    } catch (error) {
      console.error("Failed to load service packages:", error);
    }
  };

  // Load orders
  const loadOrders = async (vendorId?: string) => {
    try {
      const result = await VendorService.listOrders(vendorId);
      if (result) {
        setOrders(result.items);
        setTotalOrderCount(result.totalCount);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (searchVendorId.trim()) {
      loadVendor(searchVendorId);
    }
  };

  // Suspend/Reinstate vendor
  const handleSuspendVendor = async () => {
    if (!selectedVendor) return;
    setLoading(true);
    try {
      const success = await VendorService.suspendVendor({
        vendorId: selectedVendor.id,
        reason: "Admin action",
      });
      if (success) {
        await loadVendor(selectedVendor.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReinstateVendor = async () => {
    if (!selectedVendor) return;
    setLoading(true);
    try {
      const success = await VendorService.reinstateVendor(selectedVendor.id);
      if (success) {
        await loadVendor(selectedVendor.id);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case VendorStatus.DRAFT:
      case ProductStatus.DRAFT:
        return "secondary";
      case VendorStatus.KYC_PENDING:
      case ProductStatus.ARCHIVED:
      case OrderStatus.CREATED:
        return "outline";
      case VendorStatus.SUSPENDED:
      case OrderStatus.REFUNDED:
        return "destructive";
      case VendorStatus.ACTIVE:
      case ProductStatus.PUBLISHED:
      case OrderStatus.SHIPPED:
      case OrderStatus.DELIVERED:
      default:
        return "default";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor profiles and monitor activity</p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter vendor ID..."
                value={searchVendorId}
                onChange={(e) => setSearchVendorId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || !searchVendorId.trim()}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Details */}
        {selectedVendor && (
          <>
            {/* Vendor Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedVendor.displayName}</CardTitle>
                    <CardDescription>{selectedVendor.userId}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadge(selectedVendor.status)}>
                    {selectedVendor.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVendor.logoUrl && (
                  <img
                    src={selectedVendor.logoUrl}
                    alt={selectedVendor.displayName}
                    className="w-24 h-24 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p>{selectedVendor.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rating</p>
                    <p>{selectedVendor.rating ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed Orders</p>
                    <p>{selectedVendor.completedOrders ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Payout Accounts
                    </p>
                    <p>{selectedVendor.payoutAccounts?.length ?? 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedVendor.description}</p>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedVendor.status === VendorStatus.SUSPENDED ? (
                    <Button
                      onClick={handleReinstateVendor}
                      disabled={loading}
                      variant="outline"
                    >
                      Reinstate Vendor
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSuspendVendor}
                      disabled={loading}
                      variant="destructive"
                    >
                      Suspend Vendor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Products, Services, Orders */}
            <Tabs defaultValue="products" className="space-y-4">
              <TabsList>
                <TabsTrigger value="products">Products ({totalProductCount})</TabsTrigger>
                <TabsTrigger value="services">Services ({servicePackages.length})</TabsTrigger>
                <TabsTrigger value="orders">Orders ({totalOrderCount})</TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage vendor products and listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <p className="text-muted-foreground">No products found</p>
                    ) : (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Inventory</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{product.title}</p>
                                    <p className="text-sm text-muted-foreground">{product.id}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {product.price} {product.currency}
                                </TableCell>
                                <TableCell>{product.inventoryCount}</TableCell>
                                <TableCell>{product.productType}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadge(product.status)}>
                                    {product.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Packages</CardTitle>
                    <CardDescription>Manage vendor services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {servicePackages.length === 0 ? (
                      <p className="text-muted-foreground">No service packages found</p>
                    ) : (
                      <div className="space-y-4">
                        {servicePackages.map((pkg) => (
                          <Card key={pkg.id} className="bg-secondary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{pkg.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {pkg.basePrice} {pkg.currency}
                                  </p>
                                </div>
                                <Badge variant={getStatusBadge(pkg.status)}>
                                  {pkg.status}
                                </Badge>
                              </div>
                              {pkg.milestones && pkg.milestones.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-2">
                                    Milestones ({pkg.milestones.length})
                                  </p>
                                  <ul className="space-y-1">
                                    {pkg.milestones.map((milestone) => (
                                      <li key={milestone.id} className="text-sm text-muted-foreground">
                                        • {milestone.title} ({milestone.percentageOfTotal}%)
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>Monitor vendor orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground">No orders found</p>
                    ) : (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Buyer ID</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {order.buyerId}
                                </TableCell>
                                <TableCell>
                                  {order.totalAmount} {order.currency}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadge(order.status)}>
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
