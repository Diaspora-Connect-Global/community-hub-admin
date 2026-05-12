import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, ShieldOff, RefreshCw } from "lucide-react";
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
import type {
  BlockedMember,
  GroupBlockReason,
} from "@/services/graphql/groups/types";
import { getBlockedMembers } from "@/services/graphql/groups/queries";
import { unblockMember } from "@/services/graphql/groups/mutations";

interface Props {
  groupId: string;
}

const REASON_LABEL: Record<GroupBlockReason, string> = {
  SPAM: "Spam",
  ABUSE: "Abuse",
  POLICY_VIOLATION: "Policy violation",
  SELF_BLOCK: "Self-block",
  OTHER: "Other",
};

function blockedName(b: BlockedMember): string {
  const first = b.blockedUserProfile?.firstName ?? "";
  const last = b.blockedUserProfile?.lastName ?? "";
  return `${first} ${last}`.trim() || b.userId;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function BlockedTab({ groupId }: Props) {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBlockedMembers(groupId);
      setBlocks(res.blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const doUnblock = async (block: BlockedMember) => {
    setBusy(block.id);
    try {
      const res = await unblockMember({ groupId, userId: block.userId });
      if (!res.success) throw new Error(res.message ?? "Failed");
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      toast({ title: "Member unblocked", description: blockedName(block) });
    } catch (err) {
      toast({
        title: "Unblock failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead className="w-40">Reason</TableHead>
              <TableHead className="w-32">Blocked on</TableHead>
              <TableHead className="w-32">Expires</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No blocked members.
                </TableCell>
              </TableRow>
            ) : (
              blocks.map((b) => {
                const name = blockedName(b);
                const isBusyRow = busy === b.id;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {b.blockedUserProfile?.avatarUrl ? (
                            <AvatarImage src={b.blockedUserProfile.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {b.userId.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {b.reason ? REASON_LABEL[b.reason] : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(b.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {b.expiresAt ? formatDate(b.expiresAt) : "Permanent"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusyRow}
                        onClick={() => void doUnblock(b)}
                      >
                        {isBusyRow ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldOff className="h-4 w-4 mr-2" />
                        )}
                        Unblock
                      </Button>
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
