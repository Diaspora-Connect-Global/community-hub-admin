import { Search, MoreHorizontal, Eye, AlertTriangle, ArrowUpRight, EyeOff, Trash2, MessageSquare } from "lucide-react";
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

const reports = [
  { id: "RPT001", item: "Inappropriate post content", type: "Post", reportedBy: "Ama Mensah", status: "Open", createdAt: "2024-01-16" },
  { id: "RPT002", item: "Spam listing", type: "Listing", reportedBy: "Kofi Owusu", status: "Open", createdAt: "2024-01-15" },
  { id: "RPT003", item: "Misleading opportunity", type: "Opportunity", reportedBy: "Akua Boateng", status: "Investigating", createdAt: "2024-01-14" },
  { id: "RPT004", item: "Harassment in group", type: "Group", reportedBy: "Yaw Mensah", status: "Resolved", createdAt: "2024-01-13" },
  { id: "RPT005", item: "Event scam", type: "Event", reportedBy: "Efua Darko", status: "Escalated", createdAt: "2024-01-12" },
];

const statusColors: Record<string, string> = {
  Open: "bg-warning/10 text-warning",
  Investigating: "bg-blue-500/10 text-blue-400",
  Resolved: "bg-success/10 text-success",
  Escalated: "bg-destructive/10 text-destructive",
};

const typeColors: Record<string, string> = {
  Post: "bg-primary/10 text-primary",
  Listing: "bg-green-500/10 text-green-400",
  Opportunity: "bg-purple-500/10 text-purple-400",
  Group: "bg-blue-500/10 text-blue-400",
  Event: "bg-pink-500/10 text-pink-400",
};

export default function Reports() {
  const openCount = reports.filter(r => r.status === "Open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports & Complaints</h1>
          <p className="text-muted-foreground mt-1">View and respond to reports filed against your content.</p>
        </div>
        {openCount > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
            <AlertTriangle className="h-3 w-3" />
            {openCount} open
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Reported Item</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{report.id}</TableCell>
                <TableCell className="font-medium text-foreground">{report.item}</TableCell>
                <TableCell>
                  <Badge className={typeColors[report.type]}>{report.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{report.reportedBy}</TableCell>
                <TableCell>
                  <Badge className={statusColors[report.status]}>{report.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{report.createdAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><EyeOff className="h-4 w-4 mr-2" />Hide Content</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Remove Content</DropdownMenuItem>
                      <DropdownMenuItem><MessageSquare className="h-4 w-4 mr-2" />Warn User</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><ArrowUpRight className="h-4 w-4 mr-2" />Escalate to System Admin</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
