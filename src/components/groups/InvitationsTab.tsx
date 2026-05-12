import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getSentGroupInvitations } from "@/services/graphql/groups/queries";
import { cancelGroupInvitation } from "@/services/graphql/groups/mutations";
import type { GroupInvitation, Group } from "@/services/graphql/groups/types";

interface InvitationRow {
  invitation: GroupInvitation;
  group?: Pick<Group, "id" | "name">;
  inviteeProfile?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  inviterProfile?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

interface Props {
  groupId: string;
}

function inviteeName(row: InvitationRow): string {
  const p = row.inviteeProfile;
  return `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim() || row.invitation.invitedUserId;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function InvitationsTab({ groupId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSentGroupInvitations(100, 0);
      setRows(res.invitations ?? []);
    } catch (err) {
      toast({
        title: "Failed to load invitations",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const forGroup = useMemo(
    () => rows.filter((r) => r.invitation.groupId === groupId),
    [rows, groupId],
  );

  const pending = useMemo(
    () => forGroup.filter((r) => r.invitation.status === "PENDING"),
    [forGroup],
  );

  const otherCount = forGroup.length - pending.length;

  const doCancel = async (row: InvitationRow) => {
    setBusy(row.invitation.id);
    try {
      await cancelGroupInvitation({ invitationId: row.invitation.id });
      toast({ title: "Invitation cancelled", description: inviteeName(row) });
      await load();
    } catch (err) {
      toast({
        title: "Cancel failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Invitee</TableHead>
              <TableHead className="w-32">Sent</TableHead>
              <TableHead className="w-32">Expires</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No pending invitations.
                </TableCell>
              </TableRow>
            ) : (
              pending.map((row) => {
                const name = inviteeName(row);
                const isBusyRow = busy === row.invitation.id;
                return (
                  <TableRow key={row.invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {row.inviteeProfile?.avatarUrl ? (
                            <AvatarImage src={row.inviteeProfile.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {row.invitation.invitedUserId.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.invitation.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.invitation.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {row.invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void doCancel(row)}
                        disabled={isBusyRow}
                      >
                        {isBusyRow ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel invite
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {otherCount > 0 ? (
        <div className="text-xs text-muted-foreground">
          {otherCount} non-pending invitation{otherCount === 1 ? "" : "s"} hidden (accepted, declined, expired, or cancelled).
        </div>
      ) : null}
    </div>
  );
}
