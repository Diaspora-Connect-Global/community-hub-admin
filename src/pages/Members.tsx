import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Eye,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  UserMinus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  listCommunityMembers,
  searchMembers,
  listPendingMemberships,
  getMemberDetails,
} from "@/services/graphql/community/queries";
import {
  approveMembership,
  rejectMembership,
  removeMember,
  banUser,
  unbanUser,
  suspendMember,
  unsuspendMember,
  assignMemberRole,
} from "@/services/graphql/community/mutations";
import type {
  MemberDetails,
  PendingMembershipRequest,
} from "@/services/graphql/community/types";

const PAGE_SIZE = 20;

function getInitials(id: string) {
  return id.slice(0, 2).toUpperCase();
}

function getRoleBadgeClass(role: string) {
  switch (role?.toLowerCase()) {
    case "owner":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "admin":
    case "moderator":
      return "bg-primary/10 text-primary";
    default:
      return "";
  }
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "active":
      return "default";
    case "suspended":
    case "banned":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "secondary";
  }
}

export default function Members() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);
  const scopeId = admin?.scopeId ?? "";
  const scopeType = (admin?.scopeType ?? "COMMUNITY") as string;
  const entityType = scopeType === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";

  // ── Data state ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<MemberDetails[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<PendingMembershipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("members");

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberDetails | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removing, setRemoving] = useState(false);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<MemberDetails | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<MemberDetails | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<MemberDetails | null>(null);
  const [newRole, setNewRole] = useState("member");
  const [assigningRole, setAssigningRole] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch members ────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(
    async (pageNum: number) => {
      if (!scopeId) return;
      setLoading(true);
      setError(null);
      try {
        const offset = pageNum * PAGE_SIZE;
        const res = await listCommunityMembers(scopeId, PAGE_SIZE, offset);
        setMembers(res.members);
        setTotalMembers(res.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        setLoading(false);
      }
    },
    [scopeId]
  );

  // ── Fetch pending requests ───────────────────────────────────────────────────
  const fetchPendingRequests = useCallback(async () => {
    if (!scopeId) return;
    setLoadingPending(true);
    try {
      const res = await listPendingMemberships({
        entityId: scopeId,
        entityType,
        limit: 50,
        offset: 0,
      });
      setPendingRequests(res.requests);
    } catch {
      // non-fatal
    } finally {
      setLoadingPending(false);
    }
  }, [scopeId, entityType]);

  useEffect(() => {
    fetchMembers(0);
    fetchPendingRequests();
  }, [fetchMembers, fetchPendingRequests]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scopeId) return;
    if (!searchTerm.trim()) {
      fetchMembers(page);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMembers(scopeId, entityType, searchTerm.trim());
        setMembers(results);
        setTotalMembers(results.length);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, scopeId, entityType, fetchMembers, page]);

  // ── View detail ──────────────────────────────────────────────────────────────
  const handleView = async (member: MemberDetails) => {
    setSelectedMember(member);
    setViewModalOpen(true);
    setLoadingDetail(true);
    try {
      const detail = await getMemberDetails(member.userId, scopeId, entityType);
      setSelectedMember(detail);
    } catch {
      // use existing data
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Approve pending ──────────────────────────────────────────────────────────
  const handleApprove = async (req: PendingMembershipRequest) => {
    setActionLoading(req.id);
    try {
      await approveMembership({ startUserId: req.userId, entityId: scopeId, entityType });
      toast({ title: "Membership approved" });
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to approve",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject pending ───────────────────────────────────────────────────────────
  const handleReject = async (req: PendingMembershipRequest) => {
    setActionLoading(req.id);
    try {
      await rejectMembership({
        targetUserId: req.userId,
        entityId: scopeId,
        entityType,
        reason: "Rejected by admin",
      });
      toast({ title: "Request rejected" });
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err) {
      toast({
        title: "Failed to reject",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Remove member ────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeMember({
        userId: removeTarget.userId,
        entityId: scopeId,
        entityType,
        reason: removeReason || undefined,
      });
      toast({ title: "Member removed" });
      setRemoveDialogOpen(false);
      setRemoveReason("");
      setRemoveTarget(null);
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to remove member",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  // ── Ban user ─────────────────────────────────────────────────────────────────
  const handleBan = async () => {
    if (!banTarget) return;
    setBanning(true);
    try {
      await banUser({
        userId: banTarget.userId,
        entityId: scopeId,
        entityType,
        reason: banReason || undefined,
      });
      toast({ title: "User banned" });
      setBanDialogOpen(false);
      setBanReason("");
      setBanTarget(null);
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to ban user",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBanning(false);
    }
  };

  // ── Unban user ───────────────────────────────────────────────────────────────
  const handleUnban = async (member: MemberDetails) => {
    setActionLoading(member.userId + "_unban");
    try {
      await unbanUser({ userId: member.userId, entityId: scopeId, entityType });
      toast({ title: "User unbanned" });
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to unban",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Suspend member ───────────────────────────────────────────────────────────
  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      await suspendMember({
        userId: suspendTarget.userId,
        entityId: scopeId,
        entityType,
        reason: suspendReason || undefined,
      });
      toast({ title: "Member suspended" });
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setSuspendTarget(null);
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to suspend",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSuspending(false);
    }
  };

  // ── Unsuspend member ─────────────────────────────────────────────────────────
  const handleUnsuspend = async (member: MemberDetails) => {
    setActionLoading(member.userId + "_unsuspend");
    try {
      await unsuspendMember({ userId: member.userId, entityId: scopeId, entityType });
      toast({ title: "Member unsuspended" });
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to unsuspend",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Assign role ───────────────────────────────────────────────────────────────
  const handleAssignRole = async () => {
    if (!roleTarget) return;
    setAssigningRole(true);
    try {
      await assignMemberRole({
        userId: roleTarget.userId,
        entityId: scopeId,
        entityType,
        role: newRole,
      });
      toast({ title: "Role updated" });
      setRoleDialogOpen(false);
      setRoleTarget(null);
      fetchMembers(page);
    } catch (err) {
      toast({
        title: "Failed to assign role",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAssigningRole(false);
    }
  };

  const totalPages = Math.ceil(totalMembers / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("members.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("members.subtitle")}</p>
        </div>
        {totalMembers > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalMembers.toLocaleString()} total
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs w-5 h-5">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Members Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="members" className="space-y-4 mt-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              {searching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder={t("members.searchMembers")}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Member</TableHead>
                  <TableHead className="w-28">Role</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-36">Joined</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.userId} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                              {getInitials(member.userId)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-mono text-xs text-muted-foreground">
                            {member.userId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getRoleBadgeClass(member.role)}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleView(member)}
                              className="text-foreground"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRoleTarget(member);
                                setNewRole(member.role?.toLowerCase() || "member");
                                setRoleDialogOpen(true);
                              }}
                              className="text-foreground"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Assign Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status?.toLowerCase() === "suspended" ? (
                              <DropdownMenuItem
                                onClick={() => handleUnsuspend(member)}
                                disabled={actionLoading === member.userId + "_unsuspend"}
                                className="text-foreground"
                              >
                                {actionLoading === member.userId + "_unsuspend" ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                )}
                                Unsuspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSuspendTarget(member);
                                  setSuspendDialogOpen(true);
                                }}
                                className="text-foreground"
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {member.status?.toLowerCase() === "banned" ? (
                              <DropdownMenuItem
                                onClick={() => handleUnban(member)}
                                disabled={actionLoading === member.userId + "_unban"}
                                className="text-foreground"
                              >
                                {actionLoading === member.userId + "_unban" ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Unban
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setBanTarget(member);
                                  setBanDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setRemoveTarget(member);
                                setRemoveDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!searchTerm && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalMembers)} of {totalMembers}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchMembers(p);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchMembers(p);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Pending Requests Tab ──────────────────────────────────────────────── */}
        <TabsContent value="pending" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User ID</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPending ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : pendingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No pending requests
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {req.userId.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-mono text-xs text-muted-foreground">
                            {req.userId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.entityName || req.entityId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success/30 hover:bg-success/10 h-7"
                            disabled={actionLoading === req.id}
                            onClick={() => handleApprove(req)}
                          >
                            {actionLoading === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 h-7"
                            disabled={actionLoading === req.id}
                            onClick={() => handleReject(req)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── View Member Detail Modal ──────────────────────────────────────────── */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display">Member Details</DialogTitle>
            <DialogDescription>Membership information for this member</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedMember ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                    {getInitials(selectedMember.userId)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {selectedMember.userId}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="secondary"
                      className={getRoleBadgeClass(selectedMember.role)}
                    >
                      {selectedMember.role}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(selectedMember.status)}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium mt-0.5">
                    {new Date(selectedMember.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scope</p>
                  <p className="font-medium mt-0.5">{entityType}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Member Dialog ──────────────────────────────────────────────── */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="font-mono text-xs">{removeTarget?.userId}</span> from this{" "}
              {entityType.toLowerCase()}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Label className="text-sm">Reason (optional)</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              placeholder="Reason for removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Ban User Dialog ───────────────────────────────────────────────────── */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Banning{" "}
              <span className="font-mono text-xs">{banTarget?.userId}</span> will prevent
              them from rejoining this {entityType.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Label className="text-sm">Reason (optional)</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              placeholder="Reason for ban..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={banning}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {banning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Suspend Member Dialog ─────────────────────────────────────────────── */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Member</AlertDialogTitle>
            <AlertDialogDescription>
              Suspending{" "}
              <span className="font-mono text-xs">{suspendTarget?.userId}</span> will
              temporarily restrict their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Label className="text-sm">Reason (optional)</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              placeholder="Reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={suspending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {suspending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Assign Role Dialog ────────────────────────────────────────────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Change role for{" "}
              <span className="font-mono text-xs">{roleTarget?.userId}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={assigningRole}>
              {assigningRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
