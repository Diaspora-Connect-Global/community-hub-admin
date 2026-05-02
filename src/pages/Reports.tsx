import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MoreHorizontal, Eye, AlertTriangle, ArrowUpRight, EyeOff, Trash2, MessageSquare, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuthStore } from "@/stores/authStore";
import { useGetCommunityReports } from "@/hooks/useGetCommunityReports";
import type { CommunityReport } from "@/services/graphql/community/types";

const STATUS_ALL = "ALL";

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  REVIEWED: "bg-blue-500/10 text-blue-400",
  RESOLVED: "bg-success/10 text-success",
  DISMISSED: "bg-destructive/10 text-destructive",
};

const typeColors: Record<string, string> = {
  CONTENT: "bg-primary/10 text-primary",
  USER: "bg-green-500/10 text-green-400",
  SPAM: "bg-purple-500/10 text-purple-400",
  HARASSMENT: "bg-blue-500/10 text-blue-400",
  OTHER: "bg-pink-500/10 text-pink-400",
};

const REPORT_STATUSES = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"];

export default function Reports() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? (admin.scopeId ?? null) : null;

  const [filterStatus, setFilterStatus] = useState<string>(STATUS_ALL);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [resolution, setResolution] = useState("");

  const statusArg = filterStatus === STATUS_ALL ? undefined : filterStatus;
  const {
    reports: fetchedReports,
    total: fetchedTotal,
    loading,
    refetch: _refetch,
  } = useGetCommunityReports(communityId, statusArg, 50);

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setReports(fetchedReports);
    setTotal(fetchedTotal);
  }, [fetchedReports, fetchedTotal]);

  const openCount = reports.filter((r) => r.status === "PENDING").length;

  const handleView = (report: CommunityReport) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const handleResolve = (report: CommunityReport) => {
    setSelectedReport(report);
    setResolution("");
    setResolveModalOpen(true);
  };

  const handleDelete = (report: CommunityReport) => {
    setSelectedReport(report);
    setDeleteModalOpen(true);
  };

  const confirmResolve = () => {
    if (selectedReport) {
      setReports(
        reports.map((r) =>
          r.id === selectedReport.id ? { ...r, status: "RESOLVED" } : r
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

  const updateStatus = (report: CommunityReport, status: string) => {
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
          <h1 className="text-2xl font-display font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
        {openCount > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
            <AlertTriangle className="h-3 w-3" />
            {openCount} {t("reports.openCount")}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("reports.searchReports")} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
            {REPORT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : null}
            {!loading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
            {!loading && reports.map((report) => (
              <TableRow key={report.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{report.id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium text-foreground">{report.reporterName || report.reporterId || "—"}</TableCell>
                <TableCell>
                  <Badge className={typeColors[report.type ?? ""] ?? ""}>{report.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{report.description}</TableCell>
                <TableCell>
                  <Badge className={statusColors[report.status ?? ""] ?? ""}>{report.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "—"}
                </TableCell>
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
                      {report.status !== "RESOLVED" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(report, "REVIEWED")} className="text-foreground">
                            <Search className="h-4 w-4 mr-2" />Mark Reviewed
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
                          <DropdownMenuItem onClick={() => updateStatus(report, "DISMISSED")} className="text-warning">
                            <ArrowUpRight className="h-4 w-4 mr-2" />Dismiss
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
        {total > 0 && (
          <div className="px-4 py-2 text-sm text-muted-foreground border-t border-border">
            {total} report{total !== 1 ? "s" : ""} total
          </div>
        )}
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
              <Badge className={typeColors[selectedReport?.type ?? ""] ?? ""}>{selectedReport?.type}</Badge>
              <Badge className={statusColors[selectedReport?.status ?? ""] ?? ""}>{selectedReport?.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Reporter</span>
                <p className="font-medium">{selectedReport?.reporterName || selectedReport?.reporterId || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target</span>
                <p className="font-medium">{selectedReport?.targetId || "—"} ({selectedReport?.targetType})</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">
                  {selectedReport?.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : "—"}
                </p>
              </div>
              {selectedReport?.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">Resolved</span>
                  <p className="font-medium">{new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                </div>
              )}
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
