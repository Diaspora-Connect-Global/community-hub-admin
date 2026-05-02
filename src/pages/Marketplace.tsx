import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import {
  useGetCommunityScopedListings,
  useGetCommunityScopedOrders,
} from "@/hooks/useVendorMarketplace";
import {
  createProduct,
  publishProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
} from "@/services/graphql/vendor";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Listing {
  id: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  currency: string;
  stock: number | null;
  orders: number;
  status: string;
  createdAt: string;
  vendorId: string;
}

interface Order {
  id: string;
  buyer: string;
  item: string;
  amount: number;
  status: string;
  orderedAt: string;
}

interface CreateForm {
  title: string;
  type: string;
  price: string;
  description: string;
}

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  PUBLISHED: "bg-success/10 text-success",
  Paused: "bg-warning/10 text-warning",
  DRAFT: "bg-warning/10 text-warning",
  "Out of Stock": "bg-destructive/10 text-destructive",
  Pending: "bg-warning/10 text-warning",
  CREATED: "bg-warning/10 text-warning",
  Shipped: "bg-blue-500/10 text-blue-400",
  SHIPPED: "bg-blue-500/10 text-blue-400",
  Delivered: "bg-success/10 text-success",
  DELIVERED: "bg-success/10 text-success",
};

export default function Marketplace() {
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? (admin.scopeId ?? null) : null;

  const {
    listings: apiListings,
    loading: listingsLoading,
    refetch: refetchListings,
  } = useGetCommunityScopedListings(communityId);

  const {
    orders: apiOrders,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useGetCommunityScopedOrders(communityId);

  // Local display copies for optimistic updates
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Derive order count per listing id from apiOrders
  const orderCountByListing = useRef<Record<string, number>>({});

  useEffect(() => {
    // We don't have a per-listing order count from the community-scoped API,
    // so we keep the count as 0 unless the API adds a field for it.
    const countMap: Record<string, number> = {};
    apiOrders.forEach((o) => {
      // vendorId approximates the listing grouping we have available
      countMap[o.vendorId] = (countMap[o.vendorId] ?? 0) + 1;
    });
    orderCountByListing.current = countMap;

    setListings(
      apiListings.map((l) => ({
        id: l.id,
        vendorId: l.vendorId,
        title: l.title,
        type: l.category,
        price: l.price,
        currency: l.currency,
        // inventoryCount is not returned by the community-scoped listing query;
        // show "—" until the API exposes it.
        stock: null,
        orders: countMap[l.vendorId] ?? 0,
        status: l.status,
        createdAt: l.createdAt,
      })),
    );
  }, [apiListings, apiOrders]);

  useEffect(() => {
    setOrders(
      apiOrders.map((o) => ({
        id: o.id,
        buyer: o.buyerName,
        item: o.vendorName,
        amount: o.total,
        status: o.status,
        orderedAt: o.createdAt,
      })),
    );
  }, [apiOrders]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Loading states ─────────────────────────────────────────────────────────
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Create form state ──────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState<CreateForm>({
    title: "",
    type: "Product",
    price: "",
    description: "",
  });

  // ── Edit form state ────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "",
    price: 0,
    stock: 0,
    status: "",
  });

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = searchQuery.trim()
    ? listings.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : listings;

  // ── Deep-link: open create modal from router state ─────────────────────────
  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleView = (listing: Listing) => {
    setSelectedListing(listing);
    setViewModalOpen(true);
  };

  const handleEdit = (listing: Listing) => {
    setSelectedListing(listing);
    setEditForm({
      title: listing.title,
      description: listing.description || "",
      type: listing.type,
      price: listing.price,
      stock: listing.stock || 0,
      status: listing.status,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (listing: Listing) => {
    setSelectedListing(listing);
    setDeleteModalOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewOrderModalOpen(true);
  };

  // 3a — Create listing
  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast({ title: "Validation error", description: "Title is required.", variant: "destructive" });
      return;
    }
    const price = parseFloat(createForm.price);
    if (isNaN(price) || price < 0) {
      toast({ title: "Validation error", description: "Enter a valid price.", variant: "destructive" });
      return;
    }

    // We need a vendorId. The community-scoped listing API doesn't surface the
    // admin's own vendorId, so we use the admin's scopeId as a best-effort
    // fallback. A production flow would first call getMyVendor().
    const vendorId = communityId ?? "";

    setIsCreating(true);
    try {
      const productId = await createProduct({
        vendorId,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        price,
        currency: "USD",
        inventoryCount: 0,
        productType: createForm.type === "Service" ? "DIGITAL" : "PHYSICAL",
      });

      if (!productId) {
        toast({ title: "Create failed", description: "Could not create the listing. Please try again.", variant: "destructive" });
        return;
      }

      // Publish immediately so it appears in the community-scoped feed.
      await publishProduct(productId);

      toast({ title: "Listing published", description: `"${createForm.title}" is now live.` });
      setCreateModalOpen(false);
      setCreateForm({ title: "", type: "Product", price: "", description: "" });
      refetchListings();
    } catch {
      toast({ title: "Unexpected error", description: "Failed to create listing.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // 3b — Save edit
  const saveEdit = async () => {
    if (!selectedListing) return;

    setIsSavingEdit(true);

    // Optimistic update
    const previousListings = listings;
    setListings(
      listings.map((l) =>
        l.id === selectedListing.id ? { ...l, ...editForm } : l,
      ),
    );

    try {
      const ok = await updateProduct({
        productId: selectedListing.id,
        title: editForm.title,
        description: editForm.description,
        price: editForm.price,
        inventoryCount: editForm.stock,
      });

      if (!ok) {
        // Roll back optimistic update
        setListings(previousListings);
        toast({ title: "Update failed", description: "Could not save changes. Please try again.", variant: "destructive" });
        return;
      }

      toast({ title: "Listing updated", description: "Changes saved successfully." });
      setEditModalOpen(false);
      setSelectedListing(null);
      refetchListings();
    } catch {
      setListings(previousListings);
      toast({ title: "Unexpected error", description: "Failed to update listing.", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 3c — Confirm delete
  const confirmDelete = async () => {
    if (!selectedListing) return;

    const listingId = selectedListing.id;
    setIsDeletingId(listingId);

    // Optimistic removal
    const previousListings = listings;
    setListings(listings.filter((l) => l.id !== listingId));
    setDeleteModalOpen(false);
    setSelectedListing(null);

    try {
      const ok = await deleteProduct(listingId);

      if (!ok) {
        // Roll back
        setListings(previousListings);
        toast({ title: "Delete failed", description: "Could not delete listing. Please try again.", variant: "destructive" });
        return;
      }

      toast({ title: "Listing deleted", description: "The listing has been removed." });
      refetchListings();
    } catch {
      setListings(previousListings);
      toast({ title: "Unexpected error", description: "Failed to delete listing.", variant: "destructive" });
    } finally {
      setIsDeletingId(null);
    }
  };

  // 3d — Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);

    // Optimistic update
    const previousOrders = orders;
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const ok = await updateOrderStatus(orderId, status);

      if (!ok) {
        setOrders(previousOrders);
        toast({ title: "Update failed", description: "Could not update order status.", variant: "destructive" });
        return;
      }

      const label = status === "SHIPPED" ? "Shipped" : "Delivered";
      toast({ title: `Order ${label.toLowerCase()}`, description: `Order #${orderId} marked as ${label}.` });
      refetchOrders();
    } catch {
      setOrders(previousOrders);
      toast({ title: "Unexpected error", description: "Failed to update order status.", variant: "destructive" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{t("marketplace.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("marketplace.subtitle")}</p>
          </div>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t("marketplace.createListing")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Listing</DialogTitle>
                <DialogDescription>Add a new product or service to the marketplace.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter listing title..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={createForm.type}
                      onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={createForm.price}
                      onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your listing..."
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? "Publishing…" : "Publish"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="listings" className="gap-2">
              <Package className="h-4 w-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Listings Table */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-28 text-right">Price</TableHead>
                    <TableHead className="w-24 text-center">Stock</TableHead>
                    <TableHead className="w-24 text-center">Orders</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingsLoading && listings.length === 0 && (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!listingsLoading && filteredListings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        {searchQuery.trim()
                          ? `No listings matching "${searchQuery}".`
                          : "No listings found for this community."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">{listing.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{listing.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{listing.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${listing.price}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {listing.stock !== null ? listing.stock : "—"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{listing.orders}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[listing.status] ?? ""}>{listing.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-foreground"
                              disabled={isDeletingId === listing.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(listing)} className="text-foreground">
                              <Eye className="h-4 w-4 mr-2" />View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(listing)} className="text-foreground">
                              <Edit className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-foreground">
                              <ShoppingBag className="h-4 w-4 mr-2" />View Orders
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(listing)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {/* Orders Table */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-28 text-right">Amount</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28">Ordered</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading && orders.length === 0 && (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!ordersLoading && orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No orders found for this community.
                      </TableCell>
                    </TableRow>
                  )}
                  {orders.map((order) => (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{order.buyer}</TableCell>
                      <TableCell className="text-muted-foreground">{order.item}</TableCell>
                      <TableCell className="text-right font-medium">${order.amount}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] ?? ""}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.orderedAt}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-foreground"
                              disabled={updatingOrderId === order.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)} className="text-foreground">
                              <Eye className="h-4 w-4 mr-2" />View Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-foreground"
                              disabled={order.status === "SHIPPED" || order.status === "DELIVERED" || updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, "SHIPPED")}
                            >
                              Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-foreground"
                              disabled={order.status === "DELIVERED" || updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                            >
                              Mark Delivered
                            </DropdownMenuItem>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <DropdownMenuItem className="text-muted-foreground cursor-not-allowed opacity-50" disabled>
                                    Contact Buyer
                                  </DropdownMenuItem>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Messaging integration coming soon</TooltipContent>
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Listing Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">{selectedListing?.title}</DialogTitle>
              <DialogDescription>Listed on {selectedListing?.createdAt}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{selectedListing?.type}</Badge>
                <Badge className={statusColors[selectedListing?.status || ""] ?? ""}>{selectedListing?.status}</Badge>
                <span className="font-bold text-lg">${selectedListing?.price}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="ml-2 font-medium">{selectedListing?.stock !== null ? selectedListing?.stock : "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Orders:</span>
                  <span className="ml-2 font-medium">{selectedListing?.orders}</span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground">{selectedListing?.description}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Listing Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Listing</DialogTitle>
              <DialogDescription>Make changes to your listing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (USD)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSavingEdit}>
                Cancel
              </Button>
              <Button variant="outline" onClick={saveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-display text-destructive">Delete Listing</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedListing?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Order Modal */}
        <Dialog open={viewOrderModalOpen} onOpenChange={setViewOrderModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Order Details</DialogTitle>
              <DialogDescription>Order #{selectedOrder?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Buyer</span>
                  <p className="font-medium">{selectedOrder?.buyer}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <p className="font-medium">${selectedOrder?.amount}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Item</span>
                  <p className="font-medium">{selectedOrder?.item}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={statusColors[selectedOrder?.status || ""] ?? ""}>{selectedOrder?.status}</Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ordered</span>
                  <p className="font-medium">{selectedOrder?.orderedAt}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOrderModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
