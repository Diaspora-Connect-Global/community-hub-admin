import {
  Ban,
  Loader2,
  Shield,
  ShieldOff,
  UserMinus,
} from "lucide-react";
import type { MemberActionsState, MemberActionsHandlers } from "@/hooks/useMemberActions";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  type MemberDetails,
  getInitials,
  formatRoleLabel,
  formatStatusLabel,
  getRoleBadgeClass,
  getStatusBadgeVariant,
} from "@/pages/members/types";

// ── View Detail Modal ──────────────────────────────────────────────────────────

interface ViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberDetails | null;
  loadingDetail: boolean;
  entityType: string;
}

export function ViewMemberModal({
  open,
  onOpenChange,
  member,
  loadingDetail,
  entityType,
}: ViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">Member Details</DialogTitle>
          <DialogDescription>Membership information for this member</DialogDescription>
        </DialogHeader>
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : member ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {getInitials(member.userId)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {member.userId}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant="secondary"
                    className={getRoleBadgeClass(member.role)}
                  >
                    {formatRoleLabel(member.role)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(member.status)}>
                    {formatStatusLabel(member.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground">Joined</p>
                <p className="font-medium mt-0.5">
                  {new Date(member.joinedAt).toLocaleDateString()}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Remove Dialog ──────────────────────────────────────────────────────────────

interface RemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MemberDetails | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  removing: boolean;
  onConfirm: () => void;
  entityType: string;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  target,
  reason,
  onReasonChange,
  removing,
  onConfirm,
  entityType,
}: RemoveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Remove{" "}
            <span className="font-mono text-xs">{target?.userId}</span> from this{" "}
            {entityType.toLowerCase()}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6">
          <Label className="text-sm">Reason (optional)</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="Reason for removal..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
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
  );
}

// ── Ban Dialog ─────────────────────────────────────────────────────────────────

interface BanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MemberDetails | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  banning: boolean;
  onConfirm: () => void;
  entityType: string;
}

export function BanUserDialog({
  open,
  onOpenChange,
  target,
  reason,
  onReasonChange,
  banning,
  onConfirm,
  entityType,
}: BanDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
          <AlertDialogDescription>
            Banning{" "}
            <span className="font-mono text-xs">{target?.userId}</span> will prevent
            them from rejoining this {entityType.toLowerCase()}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6">
          <Label className="text-sm">Reason (optional)</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="Reason for ban..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={banning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
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
  );
}

// ── Suspend Dialog ─────────────────────────────────────────────────────────────

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MemberDetails | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  suspending: boolean;
  onConfirm: () => void;
}

export function SuspendMemberDialog({
  open,
  onOpenChange,
  target,
  reason,
  onReasonChange,
  suspending,
  onConfirm,
}: SuspendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend Member</AlertDialogTitle>
          <AlertDialogDescription>
            Suspending{" "}
            <span className="font-mono text-xs">{target?.userId}</span> will
            temporarily restrict their access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6">
          <Label className="text-sm">Reason (optional)</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="Reason for suspension..."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={suspending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
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
  );
}

// ── Assign Role Dialog ─────────────────────────────────────────────────────────

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MemberDetails | null;
  newRole: string;
  onRoleChange: (role: string) => void;
  assigningRole: boolean;
  onConfirm: () => void;
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  target,
  newRole,
  onRoleChange,
  assigningRole,
  onConfirm,
}: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Change role for{" "}
            <span className="font-mono text-xs">{target?.userId}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>New Role</Label>
          <Select value={newRole} onValueChange={onRoleChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={assigningRole}>
            {assigningRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Shield className="h-4 w-4 mr-2" />
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Composite: all action modals in one mount ──────────────────────────────────

interface MemberModalsProps extends MemberActionsState, MemberActionsHandlers {
  entityType: string;
  viewModalOpen: boolean;
  onViewModalOpenChange: (open: boolean) => void;
  selectedMember: import("@/pages/members/types").MemberDetails | null;
  loadingDetail: boolean;
}

export function MemberModals({
  entityType,
  viewModalOpen,
  onViewModalOpenChange,
  selectedMember,
  loadingDetail,
  removeDialogOpen,
  setRemoveDialogOpen,
  removeTarget,
  removeReason,
  setRemoveReason,
  removing,
  handleRemove,
  banDialogOpen,
  setBanDialogOpen,
  banTarget,
  banReason,
  setBanReason,
  banning,
  handleBan,
  suspendDialogOpen,
  setSuspendDialogOpen,
  suspendTarget,
  suspendReason,
  setSuspendReason,
  suspending,
  handleSuspend,
  roleDialogOpen,
  setRoleDialogOpen,
  roleTarget,
  newRole,
  setNewRole,
  assigningRole,
  handleAssignRole,
}: MemberModalsProps) {
  return (
    <>
      <ViewMemberModal
        open={viewModalOpen}
        onOpenChange={onViewModalOpenChange}
        member={selectedMember}
        loadingDetail={loadingDetail}
        entityType={entityType}
      />
      <RemoveMemberDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        target={removeTarget}
        reason={removeReason}
        onReasonChange={setRemoveReason}
        removing={removing}
        onConfirm={handleRemove}
        entityType={entityType}
      />
      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        target={banTarget}
        reason={banReason}
        onReasonChange={setBanReason}
        banning={banning}
        onConfirm={handleBan}
        entityType={entityType}
      />
      <SuspendMemberDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        target={suspendTarget}
        reason={suspendReason}
        onReasonChange={setSuspendReason}
        suspending={suspending}
        onConfirm={handleSuspend}
      />
      <AssignRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        target={roleTarget}
        newRole={newRole}
        onRoleChange={setNewRole}
        assigningRole={assigningRole}
        onConfirm={handleAssignRole}
      />
    </>
  );
}
