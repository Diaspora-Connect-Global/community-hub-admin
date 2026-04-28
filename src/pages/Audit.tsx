import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Search, Download, Eye, FileText, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useAuthStore } from "@/stores/authStore";
import { getModerationLogs } from "@/services/graphql/community/queries";

interface ModerationLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  performedBy: string;
  targetUser?: string | null;
  details?: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-blue-500/10 text-blue-400",
  DELETE: "bg-destructive/10 text-destructive",
  APPROVE: "bg-success/10 text-success",
  REJECT: "bg-destructive/10 text-destructive",
  RESOLVE: "bg-primary/10 text-primary",
  BAN: "bg-destructive/10 text-destructive",
  UNBAN: "bg-success/10 text-success",
  SUSPEND: "bg-warning/10 text-warning",
};

function getActionColor(action: string): string {
  const upper = action.toUpperCase();
  const key = Object.keys(actionColors).find(k => upper.includes(k));
  return key ? actionColors[key] : "bg-secondary text-secondary-foreground";
}

const PAGE_SIZE = 50;

export default function Audit() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);
  const scopeId = admin?.scopeId ?? "";

  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);

  const fetchLogs = useCallback(async (newOffset = 0) => {
    if (!scopeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getModerationLogs(scopeId, "COMMUNITY", PAGE_SIZE, newOffset);
      setLogs(result);
      setTotal(result.length < PAGE_SIZE ? newOffset + result.length : newOffset + result.length + 1);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [scopeId]);

  useEffect(() => {
    void fetchLogs(0);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.details ?? "").toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const handleView = (log: ModerationLog) => {
    setSelectedLog(log);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("audit.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("audit.subtitle")}</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          {t("audit.exportLog")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("audit.searchLogs")}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void fetchLogs(offset)}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead className="w-40">Action</TableHead>
              <TableHead className="w-28">Entity Type</TableHead>
              <TableHead className="w-32">Entity ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading audit logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {log.entityId}
                  </TableCell>
                  <TableCell className="text-foreground text-sm truncate max-w-[200px]">
                    {log.details ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(log)} className="text-foreground">
                          <Eye className="h-4 w-4 mr-2" />View Details
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
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0 || loading}
            onClick={() => void fetchLogs(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={logs.length < PAGE_SIZE || loading}
            onClick={() => void fetchLogs(offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Retention Notice */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
        <FileText className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Audit entries are retained for <span className="text-foreground font-medium">5 years</span> per platform policy. This log shows community moderation actions.
        </p>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Audit Log Details</DialogTitle>
            <DialogDescription>View complete audit entry information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Badge className={getActionColor(selectedLog?.action ?? "")}>{selectedLog?.action}</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedLog && format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Entity Type</span>
                <p className="font-medium">{selectedLog?.entityType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Entity ID</span>
                <p className="font-mono font-medium break-all">{selectedLog?.entityId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Performed By</span>
                <p className="font-mono text-xs break-all">{selectedLog?.performedBy}</p>
              </div>
              {selectedLog?.targetUser && (
                <div>
                  <span className="text-muted-foreground">Target User</span>
                  <p className="font-mono text-xs break-all">{selectedLog.targetUser}</p>
                </div>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Full Details</span>
              <p className="text-foreground mt-1">{selectedLog?.details ?? "—"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
