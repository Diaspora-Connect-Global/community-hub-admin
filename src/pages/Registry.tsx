import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, MoreHorizontal, Eye, Check, X, MessageSquare, FileText, Clock, Trash2, Loader2 } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useGetCommunityVerifications } from "@/hooks/useCommunityVerifications";
import { approveVerification, rejectVerification } from "@/services/graphql/kyc/mutations";
import { useToast } from "@/hooks/use-toast";
import type { CommunityVerification } from "@/services/graphql/kyc/types";

const STATUS_ALL = "ALL";

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
};

const VERIFICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Registry() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);
  const communityId = admin?.scopeType === "COMMUNITY" ? (admin.scopeId ?? null) : null;

  const [filterStatus, setFilterStatus] = useState<string>(STATUS_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifications, setVerifications] = useState<CommunityVerification[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clarifyModalOpen, setClarifyModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<CommunityVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [clarifyText, setClarifyText] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [clarifyLoading, setClarifyLoading] = useState(false);

  const statusArg = filterStatus === STATUS_ALL ? undefined : filterStatus;
  const { verifications: fetchedVerifications, total, loading, refetch } = useGetCommunityVerifications(
    communityId,
    statusArg,
    50,
  );

  useEffect(() => {
    setVerifications(fetchedVerifications);
  }, [fetchedVerifications]);

  const filteredVerifications = searchQuery.trim()
    ? verifications.filter(
        (v) =>
          v.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.docType?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : verifications;

  const pendingCount = verifications.filter((v) => v.status === "PENDING").length;

  const handleView = (verification: CommunityVerification) => {
    setSelectedVerification(verification);
    setViewModalOpen(true);
  };

  const handleApprove = (verification: CommunityVerification) => {
    setSelectedVerification(verification);
    setApproveModalOpen(true);
  };

  const handleReject = (verification: CommunityVerification) => {
    setSelectedVerification(verification);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleDelete = (verification: CommunityVerification) => {
    setSelectedVerification(verification);
    setDeleteModalOpen(true);
  };

  const handleClarify = (verification: CommunityVerification) => {
    setSelectedVerification(verification);
    setClarifyText("");
    setClarifyModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedVerification?.id) return;
    setApproveLoading(true);
    try {
      await approveVerification(selectedVerification.id);
      toast({ title: "Verification approved", description: `${selectedVerification.userName ?? "User"}'s verification has been approved.` });
      setApproveModalOpen(false);
      setSelectedVerification(null);
      refetch();
    } catch (err) {
      toast({
        title: "Failed to approve verification",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setApproveLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedVerification?.id) return;
    setRejectLoading(true);
    try {
      await rejectVerification(selectedVerification.id, rejectReason || undefined);
      toast({ title: "Verification rejected", description: "Rejection has been recorded." });
      setRejectModalOpen(false);
      setSelectedVerification(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      toast({
        title: "Failed to reject verification",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setRejectLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedVerification?.id) return;
    // No dedicated delete endpoint — use reject with a system reason to archive.
    setDeleteLoading(true);
    try {
      await rejectVerification(selectedVerification.id, "Record removed by moderator");
      toast({ title: "Verification record archived", description: "The record has been rejected and archived." });
      setDeleteModalOpen(false);
      setSelectedVerification(null);
      refetch();
    } catch (err) {
      toast({
        title: "Failed to archive record",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmClarify = async () => {
    if (!selectedVerification?.id || !clarifyText.trim()) return;
    setClarifyLoading(true);
    try {
      await rejectVerification(selectedVerification.id, `Clarification requested: ${clarifyText.trim()}`);
      toast({ title: "Clarification request sent", description: "The applicant has been asked to clarify their submission." });
      setClarifyModalOpen(false);
      setSelectedVerification(null);
      setClarifyText("");
      refetch();
    } catch (err) {
      toast({
        title: "Failed to send clarification request",
        description: err instanceof Error ? err.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setClarifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("registry.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("registry.subtitle")}</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
            <Clock className="h-3 w-3" />
            {pendingCount} {t("registry.pendingCount")}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("registry.searchVerifications")}
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
            {VERIFICATION_STATUSES.map((s) => (
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
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead className="w-32">Submitted</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredVerifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No verifications found.
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredVerifications.map((verification) => (
              <TableRow key={verification.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{verification.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {verification.userName ? getInitials(verification.userName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-foreground">{verification.userName || verification.userId || "—"}</span>
                      {verification.userEmail && (
                        <p className="text-xs text-muted-foreground">{verification.userEmail}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{verification.docType}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[verification.status ?? ""] ?? ""}>{verification.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(verification)} className="text-foreground">
                        <Eye className="h-4 w-4 mr-2" />View Documents
                      </DropdownMenuItem>
                      {verification.status === "PENDING" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleApprove(verification)} className="text-success">
                            <Check className="h-4 w-4 mr-2" />Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(verification)} className="text-destructive">
                            <X className="h-4 w-4 mr-2" />Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClarify(verification)} className="text-foreground">
                            <MessageSquare className="h-4 w-4 mr-2" />Request Clarification
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(verification)} className="text-destructive">
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
            {total} verification{total !== 1 ? "s" : ""} total
          </div>
        )}
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Verification Details</DialogTitle>
            <DialogDescription>Review submitted documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {selectedVerification?.userName ? getInitials(selectedVerification.userName) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedVerification?.userName || selectedVerification?.userId}</h3>
                {selectedVerification?.userEmail && (
                  <p className="text-sm text-muted-foreground">{selectedVerification.userEmail}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Document Type</span>
                <p className="font-medium">{selectedVerification?.docType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <Badge className={statusColors[selectedVerification?.status ?? ""] ?? ""}>{selectedVerification?.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <p className="font-medium">
                  {selectedVerification?.submittedAt
                    ? new Date(selectedVerification.submittedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              {selectedVerification?.reviewedAt && (
                <div>
                  <span className="text-muted-foreground">Reviewed</span>
                  <p className="font-medium">
                    {new Date(selectedVerification.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedVerification?.reviewedBy && (
                <div>
                  <span className="text-muted-foreground">Reviewed By</span>
                  <p className="font-medium">{selectedVerification.reviewedBy}</p>
                </div>
              )}
              {selectedVerification?.rejectionReason && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Rejection Reason</span>
                  <p className="font-medium text-destructive">{selectedVerification.rejectionReason}</p>
                </div>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Document Details</span>
              <p className="text-foreground mt-1">{selectedVerification?.documentDetails}</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Document preview would appear here</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-success">Approve Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve the verification for {selectedVerification?.userName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={approveLoading}>Cancel</Button>
            <Button
              className="bg-success text-white hover:bg-success/90"
              onClick={() => void confirmApprove()}
              disabled={approveLoading}
            >
              {approveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Reject Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for rejection</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void confirmReject()}
              disabled={rejectLoading}
            >
              {rejectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Archive Verification</DialogTitle>
            <DialogDescription>
              There is no dedicated delete endpoint — this will reject the record with a system reason to archive it. To permanently remove records, contact a system admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Clarification Modal */}
      <Dialog open={clarifyModalOpen} onOpenChange={setClarifyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display">Request Clarification</DialogTitle>
            <DialogDescription>
              Describe what additional information or corrections are needed from {selectedVerification?.userName ?? "the applicant"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clarify-text">Clarification request</Label>
              <Textarea
                id="clarify-text"
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                placeholder="Please resubmit with a clearer photo of your document..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClarifyModalOpen(false)} disabled={clarifyLoading}>Cancel</Button>
            <Button
              onClick={() => void confirmClarify()}
              disabled={clarifyLoading || !clarifyText.trim()}
            >
              {clarifyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
