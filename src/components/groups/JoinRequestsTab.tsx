import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, UserCheck, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { JoinRequest } from "@/services/graphql/groups/types";
import { getPendingJoinRequestsForGroup } from "@/services/graphql/groups/queries";
import {
  approveJoinRequest,
  rejectJoinRequest,
} from "@/services/graphql/groups/mutations";

interface Props {
  groupId: string;
  onChanged: () => void | Promise<void>;
}

function requesterName(r: JoinRequest): string {
  return (
    `${r.requesterProfile?.firstName ?? ""} ${r.requesterProfile?.lastName ?? ""}`.trim() ||
    r.userId
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

const JOIN_REQUESTS_PAGE_SIZE = 50;

export default function JoinRequestsTab({ groupId, onChanged }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingJoinRequestsForGroup(groupId, JOIN_REQUESTS_PAGE_SIZE, 0);
      setRequests(res.requests);
      setHasMore(res.hasMore ?? res.requests.length === JOIN_REQUESTS_PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getPendingJoinRequestsForGroup(
        groupId,
        JOIN_REQUESTS_PAGE_SIZE,
        requests.length,
      );
      setRequests((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...res.requests.filter((r) => !seen.has(r.id))];
      });
      setHasMore(res.hasMore ?? res.requests.length === JOIN_REQUESTS_PAGE_SIZE);
    } catch {
      // non-fatal
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, requests.length, loadingMore]);

  useEffect(() => {
    void load();
  }, [load]);

  const doApprove = async (req: JoinRequest) => {
    setBusyId(req.id);
    try {
      await approveJoinRequest({ groupId, userId: req.userId });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({ title: "Request approved", description: requesterName(req) });
      await onChanged();
    } catch (err) {
      toast({
        title: "Approve failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (req: JoinRequest) => {
    setBusyId(req.id);
    try {
      const res = await rejectJoinRequest({ groupId, userId: req.userId });
      if (!res.success) throw new Error(res.message ?? "Failed");
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({ title: "Request rejected", description: requesterName(req) });
      await onChanged();
    } catch (err) {
      toast({
        title: "Reject failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Requester</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-32">Requested</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-sm text-destructive mb-2">{error}</div>
                  <Button variant="outline" size="sm" onClick={() => void load()}>
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No pending join requests.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => {
                const name = requesterName(r);
                const isBusyRow = busyId === r.id;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {r.requesterProfile?.avatarUrl ? (
                            <AvatarImage src={r.requesterProfile.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {r.userId.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md">
                      {r.message ? (
                        <span className="line-clamp-2">{r.message}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => void doApprove(r)}
                          disabled={isBusyRow}
                        >
                          {isBusyRow ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void doReject(r)}
                          disabled={isBusyRow}
                        >
                          {isBusyRow ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && !error && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("common.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
