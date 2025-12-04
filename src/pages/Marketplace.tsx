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

const listings = [
  { id: "LST001", title: "Handwoven Kente Cloth", type: "Product", price: 150, currency: "USD", stock: 12, orders: 45, status: "Active", createdAt: "2024-01-15" },
  { id: "LST002", title: "Business Consultation", type: "Service", price: 100, currency: "USD", stock: null, orders: 23, status: "Active", createdAt: "2024-01-14" },
  { id: "LST003", title: "Traditional Beads Set", type: "Product", price: 75, currency: "USD", stock: 8, orders: 67, status: "Active", createdAt: "2024-01-12" },
  { id: "LST004", title: "Language Tutoring", type: "Service", price: 50, currency: "USD", stock: null, orders: 12, status: "Paused", createdAt: "2024-01-10" },
  { id: "LST005", title: "Shea Butter Collection", type: "Product", price: 35, currency: "USD", stock: 0, orders: 89, status: "Out of Stock", createdAt: "2024-01-08" },
];

const orders = [
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Marketplace — My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your products and services.</p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Listing
        </Button>
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
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem><ShoppingBag className="h-4 w-4 mr-2" />View Orders</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Order</DropdownMenuItem>
                          <DropdownMenuItem>Mark Shipped</DropdownMenuItem>
                          <DropdownMenuItem>Mark Delivered</DropdownMenuItem>
                          <DropdownMenuItem>Contact Buyer</DropdownMenuItem>
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
    </div>
  );
}
