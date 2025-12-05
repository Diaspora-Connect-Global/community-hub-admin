import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MoreHorizontal, Eye, Check, X, MessageSquare, FileText, Clock, Trash2 } from "lucide-react";
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

interface Verification {
  id: string;
  user: string;
  email?: string;
  docType: string;
  documentDetails?: string;
  submittedAt: string;
  status: string;
}

const verificationsData: Verification[] = [
  { id: "VER001", user: "Kofi Mensah", email: "kofi.m@example.com", docType: "ID Document", documentDetails: "National ID Card submitted for identity verification. Document appears valid and matches user profile.", submittedAt: "2024-01-16", status: "Pending" },
  { id: "VER002", user: "Ama Darko", email: "ama.d@example.com", docType: "Proof of Address", documentDetails: "Utility bill showing current address. Dated within the last 3 months.", submittedAt: "2024-01-15", status: "Pending" },
  { id: "VER003", user: "Kweku Asante", email: "kweku.a@example.com", docType: "ID Document", documentDetails: "Passport submitted and verified. All details match registration information.", submittedAt: "2024-01-14", status: "Approved" },
  { id: "VER004", user: "Akua Boateng", email: "akua.b@example.com", docType: "ID Document", documentDetails: "Document submitted was blurry and unreadable. Requested resubmission.", submittedAt: "2024-01-13", status: "Rejected" },
  { id: "VER005", user: "Yaw Owusu", email: "yaw.o@example.com", docType: "Business Registration", documentDetails: "Business registration certificate for 'Owusu Enterprises'. Awaiting review.", submittedAt: "2024-01-12", status: "Pending" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function Registry() {
  const { t } = useTranslation();
  const [verifications, setVerifications] = useState<Verification[]>(verificationsData);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingCount = verifications.filter(v => v.status === "Pending").length;

  const handleView = (verification: Verification) => {
    setSelectedVerification(verification);
    setViewModalOpen(true);
  };

  const handleApprove = (verification: Verification) => {
    setSelectedVerification(verification);
    setApproveModalOpen(true);
  };

  const handleReject = (verification: Verification) => {
    setSelectedVerification(verification);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleDelete = (verification: Verification) => {
    setSelectedVerification(verification);
    setDeleteModalOpen(true);
  };

  const confirmApprove = () => {
    if (selectedVerification) {
      setVerifications(
        verifications.map((v) =>
          v.id === selectedVerification.id ? { ...v, status: "Approved" } : v
        )
      );
      setApproveModalOpen(false);
      setSelectedVerification(null);
    }
  };

  const confirmReject = () => {
    if (selectedVerification) {
      setVerifications(
        verifications.map((v) =>
          v.id === selectedVerification.id ? { ...v, status: "Rejected" } : v
        )
      );
      setRejectModalOpen(false);
      setSelectedVerification(null);
      setRejectReason("");
    }
  };

  const confirmDelete = () => {
    if (selectedVerification) {
      setVerifications(verifications.filter((v) => v.id !== selectedVerification.id));
      setDeleteModalOpen(false);
      setSelectedVerification(null);
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
          <Input placeholder={t("registry.searchVerifications")} className="pl-10" />
        </div>
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
            {verifications.map((verification) => (
              <TableRow key={verification.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{verification.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(verification.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{verification.user}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{verification.docType}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{verification.submittedAt}</TableCell>
                <TableCell>
                  <Badge className={statusColors[verification.status]}>{verification.status}</Badge>
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
                      {verification.status === "Pending" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleApprove(verification)} className="text-success">
                            <Check className="h-4 w-4 mr-2" />Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(verification)} className="text-destructive">
                            <X className="h-4 w-4 mr-2" />Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground">
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
                  {selectedVerification ? getInitials(selectedVerification.user) : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedVerification?.user}</h3>
                <p className="text-sm text-muted-foreground">{selectedVerification?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Document Type</span>
                <p className="font-medium">{selectedVerification?.docType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <Badge className={statusColors[selectedVerification?.status || ""]}>{selectedVerification?.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <p className="font-medium">{selectedVerification?.submittedAt}</p>
              </div>
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
              Are you sure you want to approve the verification for {selectedVerification?.user}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button className="bg-success text-white hover:bg-success/90" onClick={confirmApprove}>Approve</Button>
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
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this verification record? This action cannot be undone.
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
