import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import type { MemberDetails, PendingMembershipRequest } from "@/pages/members/types";
import { roleToApi } from "@/pages/members/types";

interface UseMemberActionsParams {
  scopeId: string;
  entityType: string;
  page: number;
  onMembersChanged: (page: number) => void;
  onPendingChanged: (id: string) => void;
}

export interface MemberActionsState {
  actionLoading: string | null;

  removeDialogOpen: boolean;
  removeTarget: MemberDetails | null;
  removeReason: string;
  removing: boolean;

  banDialogOpen: boolean;
  banTarget: MemberDetails | null;
  banReason: string;
  banning: boolean;

  suspendDialogOpen: boolean;
  suspendTarget: MemberDetails | null;
  suspendReason: string;
  suspending: boolean;

  roleDialogOpen: boolean;
  roleTarget: MemberDetails | null;
  newRole: string;
  assigningRole: boolean;
}

export interface MemberActionsHandlers {
  // Pending requests
  handleApprove: (req: PendingMembershipRequest) => Promise<void>;
  handleReject: (req: PendingMembershipRequest) => Promise<void>;

  // Remove dialog
  openRemoveDialog: (member: MemberDetails) => void;
  setRemoveReason: (reason: string) => void;
  setRemoveDialogOpen: (open: boolean) => void;
  handleRemove: () => Promise<void>;

  // Ban dialog
  openBanDialog: (member: MemberDetails) => void;
  setBanReason: (reason: string) => void;
  setBanDialogOpen: (open: boolean) => void;
  handleBan: () => Promise<void>;
  handleUnban: (member: MemberDetails) => Promise<void>;

  // Suspend dialog
  openSuspendDialog: (member: MemberDetails) => void;
  setSuspendReason: (reason: string) => void;
  setSuspendDialogOpen: (open: boolean) => void;
  handleSuspend: () => Promise<void>;
  handleUnsuspend: (member: MemberDetails) => Promise<void>;

  // Role dialog
  openRoleDialog: (member: MemberDetails, currentRole: string) => void;
  setNewRole: (role: string) => void;
  setRoleDialogOpen: (open: boolean) => void;
  handleAssignRole: () => Promise<void>;
}

export interface UseMemberActionsReturn extends MemberActionsState, MemberActionsHandlers {}

export function useMemberActions({
  scopeId,
  entityType,
  page,
  onMembersChanged,
  onPendingChanged,
}: UseMemberActionsParams): UseMemberActionsReturn {
  const { toast } = useToast();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // ── Approve pending ────────────────────────────────────────────────────────
  const handleApprove = async (req: PendingMembershipRequest): Promise<void> => {
    setActionLoading(req.id);
    try {
      await approveMembership({ startUserId: req.userId, entityId: scopeId, entityType });
      toast({ title: "Membership approved" });
      onPendingChanged(req.id);
      onMembersChanged(page);
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

  // ── Reject pending ─────────────────────────────────────────────────────────
  const handleReject = async (req: PendingMembershipRequest): Promise<void> => {
    setActionLoading(req.id);
    try {
      await rejectMembership({
        targetUserId: req.userId,
        entityId: scopeId,
        entityType,
        reason: "Rejected by admin",
      });
      toast({ title: "Request rejected" });
      onPendingChanged(req.id);
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

  // ── Remove dialog helpers ──────────────────────────────────────────────────
  const openRemoveDialog = (member: MemberDetails): void => {
    setRemoveTarget(member);
    setRemoveDialogOpen(true);
  };

  const handleRemove = async (): Promise<void> => {
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
      onMembersChanged(page);
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

  // ── Ban dialog helpers ─────────────────────────────────────────────────────
  const openBanDialog = (member: MemberDetails): void => {
    setBanTarget(member);
    setBanDialogOpen(true);
  };

  const handleBan = async (): Promise<void> => {
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
      onMembersChanged(page);
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

  const handleUnban = async (member: MemberDetails): Promise<void> => {
    setActionLoading(member.userId + "_unban");
    try {
      await unbanUser({ userId: member.userId, entityId: scopeId, entityType });
      toast({ title: "User unbanned" });
      onMembersChanged(page);
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

  // ── Suspend dialog helpers ─────────────────────────────────────────────────
  const openSuspendDialog = (member: MemberDetails): void => {
    setSuspendTarget(member);
    setSuspendDialogOpen(true);
  };

  const handleSuspend = async (): Promise<void> => {
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
      onMembersChanged(page);
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

  const handleUnsuspend = async (member: MemberDetails): Promise<void> => {
    setActionLoading(member.userId + "_unsuspend");
    try {
      await unsuspendMember({ userId: member.userId, entityId: scopeId, entityType });
      toast({ title: "Member unsuspended" });
      onMembersChanged(page);
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

  // ── Role dialog helpers ────────────────────────────────────────────────────
  const openRoleDialog = (member: MemberDetails, currentRole: string): void => {
    setRoleTarget(member);
    setNewRole(currentRole);
    setRoleDialogOpen(true);
  };

  const handleAssignRole = async (): Promise<void> => {
    if (!roleTarget) return;
    setAssigningRole(true);
    try {
      await assignMemberRole({
        userId: roleTarget.userId,
        entityId: scopeId,
        entityType,
        role: roleToApi(newRole, entityType),
      });
      toast({ title: "Role updated" });
      setRoleDialogOpen(false);
      setRoleTarget(null);
      onMembersChanged(page);
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

  return {
    actionLoading,

    removeDialogOpen,
    removeTarget,
    removeReason,
    removing,

    banDialogOpen,
    banTarget,
    banReason,
    banning,

    suspendDialogOpen,
    suspendTarget,
    suspendReason,
    suspending,

    roleDialogOpen,
    roleTarget,
    newRole,
    assigningRole,

    handleApprove,
    handleReject,

    openRemoveDialog,
    setRemoveReason,
    setRemoveDialogOpen,
    handleRemove,

    openBanDialog,
    setBanReason,
    setBanDialogOpen,
    handleBan,
    handleUnban,

    openSuspendDialog,
    setSuspendReason,
    setSuspendDialogOpen,
    handleSuspend,
    handleUnsuspend,

    openRoleDialog,
    setNewRole,
    setRoleDialogOpen,
    handleAssignRole,
  };
}
