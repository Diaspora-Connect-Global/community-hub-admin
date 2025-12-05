import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
}

interface Order {
  id: string;
  buyer: string;
  item: string;
  amount: number;
  status: string;
  orderedAt: string;
}

const listingsData: Listing[] = [
  { id: "LST001", title: "Handwoven Kente Cloth", description: "Authentic handwoven Kente cloth from Ghana. Perfect for special occasions and cultural celebrations.", type: "Product", price: 150, currency: "USD", stock: 12, orders: 45, status: "Active", createdAt: "2024-01-15" },
  { id: "LST002", title: "Business Consultation", description: "One-hour business consultation session covering strategy, marketing, and growth planning.", type: "Service", price: 100, currency: "USD", stock: null, orders: 23, status: "Active", createdAt: "2024-01-14" },
  { id: "LST003", title: "Traditional Beads Set", description: "Handcrafted traditional beads set. Available in multiple colors and patterns.", type: "Product", price: 75, currency: "USD", stock: 8, orders: 67, status: "Active", createdAt: "2024-01-12" },
  { id: "LST004", title: "Language Tutoring", description: "Private tutoring sessions for learning local languages. Beginner to advanced levels.", type: "Service", price: 50, currency: "USD", stock: null, orders: 12, status: "Paused", createdAt: "2024-01-10" },
  { id: "LST005", title: "Shea Butter Collection", description: "Pure, organic shea butter products. Great for skincare and haircare.", type: "Product", price: 35, currency: "USD", stock: 0, orders: 89, status: "Out of Stock", createdAt: "2024-01-08" },
];

const ordersData: Order[] = [
  { id: "ORD001", buyer: "Kwame Asante", item: "Handwoven Kente Cloth", amount: 150, status: "Pending", orderedAt: "2024-01-16" },
  { id: "ORD002", buyer: "Ama Mensah", item: "Traditional Beads Set", amount: 75, status: "Shipped", orderedAt: "2024-01-15" },
  { id: "ORD003", buyer: "Kofi Owusu", item: "Shea Butter Collection", amount: 35, status: "Delivered", orderedAt: "2024-01-14" },
];

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Paused: "bg-warning/10 text-warning",
  "Out of Stock": "bg-destructive/10 text-destructive",
  Pending: "bg-warning/10 text-warning",
  Shipped: "bg-blue-500/10 text-blue-400",
  Delivered: "bg-success/10 text-success",
};

export default function Marketplace() {
  const location = useLocation();
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>(listingsData);
  const [orders] = useState<Order[]>(ordersData);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "", price: 0, stock: 0, status: "" });

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const confirmDelete = () => {
    if (selectedListing) {
      setListings(listings.filter((l) => l.id !== selectedListing.id));
      setDeleteModalOpen(false);
      setSelectedListing(null);
    }
  };

  const saveEdit = () => {
    if (selectedListing) {
      setListings(
        listings.map((l) =>
          l.id === selectedListing.id
            ? { ...l, ...editForm }
            : l
        )
      );
      setEditModalOpen(false);
      setSelectedListing(null);
    }
  };

  return (
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
                <Input id="title" placeholder="Enter listing title..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
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
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your listing..." rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button variant="outline">Publish</Button>
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
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search listings..." className="pl-10" />
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
                {listings.map((listing) => (
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
                      <Badge className={statusColors[listing.status]}>{listing.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-foreground">
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
                {orders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{order.buyer}</TableCell>
                    <TableCell className="text-muted-foreground">{order.item}</TableCell>
                    <TableCell className="text-right font-medium">${order.amount}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order.orderedAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrder(order)} className="text-foreground">
                            <Eye className="h-4 w-4 mr-2" />View Order
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">Mark Shipped</DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">Mark Delivered</DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">Contact Buyer</DropdownMenuItem>
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
              <Badge className={statusColors[selectedListing?.status || ""]}>{selectedListing?.status}</Badge>
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
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={saveEdit}>Save Changes</Button>
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
                <Badge className={statusColors[selectedOrder?.status || ""]}>{selectedOrder?.status}</Badge>
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
  );
}
