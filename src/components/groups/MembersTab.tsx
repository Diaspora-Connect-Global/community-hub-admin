import { useMemo, useState } from "react";
import { MoreHorizontal, UserMinus, UserPlus, ShieldOff, Shield, Loader2, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type {
  GroupMember,
  MemberRole,
  GroupBlockReason,
} from "@/services/graphql/groups/types";
import {
  inviteToGroup,
  removeGroupMember,
  updateMemberRole,
  blockMember,
} from "@/services/graphql/groups/mutations";

const ROLE_ORDER: Record<MemberRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MODERATOR: 2,
  MEMBER: 3,
};

const ROLE_OPTIONS: MemberRole[] = ["MODERATOR", "ADMIN", "MEMBER"];

function memberName(m: GroupMember): string {
  return `${m.profile?.firstName ?? ""} ${m.profile?.lastName ?? ""}`.trim() || m.userId;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  groupId: string;
  members: GroupMember[];
  onChanged: () => Promise<void> | void;
}

export default function MembersTab({ groupId, members, onChanged }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<GroupMember | null>(null);
  const [blockReason, setBlockReason] = useState<GroupBlockReason>("POLICY_VIOLATION");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
    if (!q) return list;
    return list.filter(
      (m) =>
        memberName(m).toLowerCase().includes(q) ||
        m.userId.toLowerCase().includes(q),
    );
  }, [members, search]);

  const doInvite = async () => {
    const userId = inviteUserId.trim();
    if (!userId) {
      toast({ title: "User ID required", variant: "destructive" });
      return;
    }
    setInviteSubmitting(true);
    try {
      await inviteToGroup({ groupId, userId });
      toast({ title: "Invitation sent" });
      setInviteUserId("");
      setInviteOpen(false);
      await onChanged();
    } catch (err) {
      toast({
        title: "Invite failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setInviteSubmitting(false);
    }
  };

  const doRoleChange = async (member: GroupMember, role: MemberRole) => {
    setBusy(member.userId);
    try {
      await updateMemberRole({ groupId, userId: member.userId, role });
      toast({ title: "Role updated", description: `${memberName(member)} → ${role}` });
      await onChanged();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const doRemove = async (member: GroupMember) => {
    setBusy(member.userId);
    try {
      const res = await removeGroupMember({ groupId, userId: member.userId });
      if (!res.success) throw new Error(res.message ?? "Failed");
      toast({ title: "Member removed", description: memberName(member) });
      await onChanged();
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const openBlock = (member: GroupMember) => {
    setBlockTarget(member);
    setBlockReason("POLICY_VIOLATION");
    setBlockOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockTarget) return;
    setBusy(blockTarget.userId);
    try {
      await blockMember({
        groupId,
        userId: blockTarget.userId,
        reason: blockReason,
      });
      toast({ title: "Member blocked", description: memberName(blockTarget) });
      setBlockOpen(false);
      setBlockTarget(null);
      await onChanged();
    } catch (err) {
      toast({
        title: "Block failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Input
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite member
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Member</TableHead>
              <TableHead className="w-32">Role</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-32">Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No members.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const name = memberName(m);
                const isOwner = m.role === "OWNER";
                const isBusyRow = busy === m.userId;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {m.profile?.avatarUrl ? (
                            <AvatarImage src={m.profile.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {m.userId.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOwner ? "default" : "secondary"} className="gap-1">
                        {m.role === "OWNER" || m.role === "ADMIN" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : null}
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.status === "ACTIVE" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {isOwner ? (
                        <span className="text-xs text-muted-foreground">Owner</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isBusyRow}>
                              {isBusyRow ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change role</DropdownMenuLabel>
                            {ROLE_OPTIONS.filter((r) => r !== m.role).map((r) => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => void doRoleChange(m, r)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Set as {r}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => void doRemove(m)}>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openBlock(m)}
                              className="text-destructive"
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Block
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send a group invitation by user ID. They'll appear under the Invitations tab until accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="invite-user-id">User ID</Label>
            <Input
              id="invite-user-id"
              placeholder="UUID of the user to invite"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void doInvite()} disabled={inviteSubmitting}>
              {inviteSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block dialog */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block member</DialogTitle>
            <DialogDescription>
              {blockTarget ? memberName(blockTarget) : ""} will no longer be able to participate
              in this group. You can unblock from the Blocked tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason</Label>
            <Select
              value={blockReason}
              onValueChange={(v) => setBlockReason(v as GroupBlockReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPAM">Spam</SelectItem>
                <SelectItem value="ABUSE">Abuse</SelectItem>
                <SelectItem value="POLICY_VIOLATION">Policy violation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={!!busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmBlock()} disabled={!!busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Block member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
