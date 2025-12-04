import { useState } from "react";
import { Search, MoreHorizontal, Eye, AlertTriangle, ArrowUpRight, EyeOff, Trash2, MessageSquare, Check } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Report {
  id: string;
  item: string;
  description?: string;
  type: string;
  reportedBy: string;
  status: string;
  createdAt: string;
}

const reportsData: Report[] = [
  { id: "RPT001", item: "Inappropriate post content", description: "User reported a post containing offensive language and potentially harmful content. The post was flagged by multiple community members.", type: "Post", reportedBy: "Ama Mensah", status: "Open", createdAt: "2024-01-16" },
  { id: "RPT002", item: "Spam listing", description: "Listing appears to be spam with unrealistic pricing and suspicious links. May be attempting to redirect users to external scam sites.", type: "Listing", reportedBy: "Kofi Owusu", status: "Open", createdAt: "2024-01-15" },
  { id: "RPT003", item: "Misleading opportunity", description: "Job opportunity posting contains false claims about compensation and work requirements. Multiple applicants have reported being misled.", type: "Opportunity", reportedBy: "Akua Boateng", status: "Investigating", createdAt: "2024-01-14" },
  { id: "RPT004", item: "Harassment in group", description: "User reported harassment and bullying behavior in a private group. Investigation completed and warning issued.", type: "Group", reportedBy: "Yaw Mensah", status: "Resolved", createdAt: "2024-01-13" },
  { id: "RPT005", item: "Event scam", description: "Event organizer collected payments but event details appear fraudulent. Escalated for further investigation.", type: "Event", reportedBy: "Efua Darko", status: "Escalated", createdAt: "2024-01-12" },
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
  const [reports, setReports] = useState<Report[]>(reportsData);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState("");

  const openCount = reports.filter(r => r.status === "Open").length;

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const handleResolve = (report: Report) => {
    setSelectedReport(report);
    setResolution("");
    setResolveModalOpen(true);
  };

  const handleDelete = (report: Report) => {
    setSelectedReport(report);
    setDeleteModalOpen(true);
  };

  const confirmResolve = () => {
    if (selectedReport) {
      setReports(
        reports.map((r) =>
          r.id === selectedReport.id ? { ...r, status: "Resolved" } : r
        )
      );
      setResolveModalOpen(false);
      setSelectedReport(null);
      setResolution("");
    }
  };

  const confirmDelete = () => {
    if (selectedReport) {
      setReports(reports.filter((r) => r.id !== selectedReport.id));
      setDeleteModalOpen(false);
      setSelectedReport(null);
    }
  };

  const updateStatus = (report: Report, status: string) => {
    setReports(
      reports.map((r) =>
        r.id === report.id ? { ...r, status } : r
      )
    );
  };

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
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(report)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Details
                      </DropdownMenuItem>
                      {report.status !== "Resolved" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(report, "Investigating")} className="text-foreground">
                            <Search className="h-4 w-4 mr-2" />Mark Investigating
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResolve(report)} className="text-success">
                            <Check className="h-4 w-4 mr-2" />Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">
                            <EyeOff className="h-4 w-4 mr-2" />Hide Content
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">
                            <MessageSquare className="h-4 w-4 mr-2" />Warn User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(report, "Escalated")} className="text-warning">
                            <ArrowUpRight className="h-4 w-4 mr-2" />Escalate to System Admin
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(report)} className="text-destructive">
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Report Details</DialogTitle>
            <DialogDescription>Review report information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Badge className={typeColors[selectedReport?.type || ""]}>{selectedReport?.type}</Badge>
              <Badge className={statusColors[selectedReport?.status || ""]}>{selectedReport?.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Reported Item</span>
                <p className="font-medium">{selectedReport?.item}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reported By</span>
                <p className="font-medium">{selectedReport?.reportedBy}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{selectedReport?.createdAt}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="text-foreground mt-1">{selectedReport?.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-success">Resolve Report</DialogTitle>
            <DialogDescription>
              Add resolution notes for this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this report was resolved..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>Cancel</Button>
            <Button className="bg-success text-white hover:bg-success/90" onClick={confirmResolve}>Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
