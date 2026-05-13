import { useCallback, useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getGroupInvitations,
  type GroupInvitationRow,
} from "@/services/graphql/groups/queries";
import { cancelGroupInvitation } from "@/services/graphql/groups/mutations";
import type { InvitationStatus } from "@/services/graphql/groups/types";

interface Props {
  groupId: string;
}

// "ALL" is a UI-only sentinel; the server treats undefined as "no filter".
type StatusFilter = InvitationStatus | "ALL";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function inviteeName(row: GroupInvitationRow): string {
  const p = row.inviteeProfile;
  const full = `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
  if (full) return full;
  return `User ${row.invitation.invitedUserId.slice(0, 8)}`;
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
  const [rows, setRows] = useState<GroupInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGroupInvitations({
        groupId,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
        offset: 0,
      });
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
  }, [groupId, statusFilter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const doCancel = async (row: GroupInvitationRow) => {
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
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Status</span>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No invitations.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const name = inviteeName(row);
                const isBusyRow = busy === row.invitation.id;
                const canCancel = row.invitation.status === "PENDING";
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
                      {canCancel ? (
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
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
