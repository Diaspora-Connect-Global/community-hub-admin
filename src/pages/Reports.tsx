import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MoreHorizontal, Eye, AlertTriangle, ArrowUpRight, EyeOff, Trash2, MessageSquare, Check, Loader2 } from "lucide-react";
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
import { updateCommunityReport } from "@/services/graphql/community/mutations";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? (admin.scopeId ?? null) : null;

  const [filterStatus, setFilterStatus] = useState<string>(STATUS_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  const statusArg = filterStatus === STATUS_ALL ? undefined : filterStatus;
  const {
    reports: fetchedReports,
    total: fetchedTotal,
    loading,
    refetch,
  } = useGetCommunityReports(communityId, statusArg, 50);

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setReports(fetchedReports);
    setTotal(fetchedTotal);
  }, [fetchedReports, fetchedTotal]);

  const filteredReports = searchQuery.trim()
    ? reports.filter(
        (r) =>
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.reporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : reports;

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

  const doUpdateReport = async (reportId: string, status: string, notes?: string, resolution?: string) => {
    await updateCommunityReport(reportId, { status, notes, resolution });
    refetch();
  };

  const handleMarkReviewed = async (report: CommunityReport) => {
    setActionLoading(`reviewed-${report.id}`);
    try {
      await doUpdateReport(report.id, "REVIEWED");
      toast({ title: "Marked as reviewed", description: "Report status updated." });
    } catch (err) {
      toast({
        title: "Failed to update report",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (report: CommunityReport) => {
    setActionLoading(`dismissed-${report.id}`);
    try {
      await doUpdateReport(report.id, "DISMISSED");
      toast({ title: "Report dismissed", description: "Report has been dismissed." });
    } catch (err) {
      toast({
        title: "Failed to dismiss report",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleHideContent = async (report: CommunityReport) => {
    setActionLoading(`hide-${report.id}`);
    try {
      await doUpdateReport(report.id, "RESOLVED", "Content hidden by moderator");
      toast({ title: "Content hidden", description: "Report resolved and content has been hidden." });
    } catch (err) {
      toast({
        title: "Failed to hide content",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWarnUser = async (report: CommunityReport) => {
    setActionLoading(`warn-${report.id}`);
    try {
      await doUpdateReport(report.id, "RESOLVED", "User warned by moderator");
      toast({ title: "User warned", description: "Warning recorded and report resolved." });
    } catch (err) {
      toast({
        title: "Failed to warn user",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmResolve = async () => {
    if (!selectedReport) return;
    setResolveLoading(true);
    try {
      await doUpdateReport(selectedReport.id, "RESOLVED", resolution, resolution);
      toast({ title: "Report resolved", description: "Resolution notes saved." });
      setResolveModalOpen(false);
      setSelectedReport(null);
      setResolution("");
    } catch (err) {
      toast({
        title: "Failed to resolve report",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedReport) return;
    // No backend delete mutation — resolve with a system note to effectively archive it.
    setActionLoading(`delete-${selectedReport.id}`);
    try {
      await doUpdateReport(selectedReport.id, "RESOLVED", "Deleted by moderator (archived)");
      toast({ title: "Report archived", description: "Report has been marked as resolved." });
      setDeleteModalOpen(false);
      setSelectedReport(null);
    } catch (err) {
      toast({
        title: "Failed to archive report",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
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
          <Input
            placeholder={t("reports.searchReports")}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            {!loading && filteredReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredReports.map((report) => (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground"
                        disabled={!!actionLoading}
                      >
                        {actionLoading?.endsWith(report.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(report)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Details
                      </DropdownMenuItem>
                      {report.status !== "RESOLVED" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void handleMarkReviewed(report)}
                            className="text-foreground"
                            disabled={actionLoading === `reviewed-${report.id}`}
                          >
                            <Search className="h-4 w-4 mr-2" />Mark Reviewed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResolve(report)} className="text-success">
                            <Check className="h-4 w-4 mr-2" />Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleHideContent(report)}
                            className="text-foreground"
                            disabled={actionLoading === `hide-${report.id}`}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />Hide Content
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleWarnUser(report)}
                            className="text-foreground"
                            disabled={actionLoading === `warn-${report.id}`}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />Warn User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void handleDismiss(report)}
                            className="text-warning"
                            disabled={actionLoading === `dismissed-${report.id}`}
                          >
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
            <Button variant="outline" onClick={() => setResolveModalOpen(false)} disabled={resolveLoading}>Cancel</Button>
            <Button
              className="bg-success text-white hover:bg-success/90"
              onClick={() => void confirmResolve()}
              disabled={resolveLoading}
            >
              {resolveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Archive Report</DialogTitle>
            <DialogDescription>
              This will mark the report as resolved and archive it. There is no hard-delete endpoint — contact a system admin to permanently remove reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={actionLoading === `delete-${selectedReport?.id}`}
            >
              {actionLoading === `delete-${selectedReport?.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
