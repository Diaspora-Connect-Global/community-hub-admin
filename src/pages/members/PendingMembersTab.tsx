import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PendingMembershipRequest } from "@/pages/members/types";

interface PendingMembersTabProps {
  pendingRequests: PendingMembershipRequest[];
  loadingPending: boolean;
  actionLoading: string | null;
  onApprove: (req: PendingMembershipRequest) => void;
  onReject: (req: PendingMembershipRequest) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function PendingMembersTab({
  pendingRequests,
  loadingPending,
  actionLoading,
  onApprove,
  onReject,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: PendingMembersTabProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Member</TableHead>
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
            pendingRequests.map((req) => {
              const resolvedName = req.displayName?.trim() || req.fullName?.trim();
              const primary = resolvedName || req.userId;
              const initials = resolvedName
                ? resolvedName
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : req.userId.slice(0, 2).toUpperCase();
              return (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium text-foreground truncate ${resolvedName ? "" : "font-mono text-xs text-muted-foreground"}`}>
                        {primary}
                      </p>
                      {req.email && (
                        <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {req.entityName ?? req.entityId}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(req.requestedAt ?? req.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success/30 hover:bg-success/10 h-7"
                      disabled={actionLoading === req.id}
                      onClick={() => onApprove(req)}
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
                      onClick={() => onReject(req)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
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
      {hasMore && onLoadMore && (
        <div className="flex justify-center border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("common.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
