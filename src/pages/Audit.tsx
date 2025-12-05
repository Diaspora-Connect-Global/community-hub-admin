import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Eye, FileText, MoreHorizontal } from "lucide-react";
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

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  entityId: string;
  notes: string;
  details?: string;
}

const auditLogsData: AuditLog[] = [
  { id: "AUD001", timestamp: "2024-01-16 14:32:15", action: "Created Post", target: "Post", entityId: "P006", notes: "Published 'Community Update'", details: "Created a new community post titled 'Community Update' with 2 media attachments. Post was immediately published to all community members." },
  { id: "AUD002", timestamp: "2024-01-16 12:15:00", action: "Approved Verification", target: "Verification", entityId: "VER003", notes: "Approved ID document", details: "Reviewed and approved ID document verification for user Kweku Asante. Document type: National ID Card. All details verified and matched registration information." },
  { id: "AUD003", timestamp: "2024-01-16 10:45:30", action: "Created Listing", target: "Listing", entityId: "LST006", notes: "New product listing", details: "Created new marketplace listing for 'Handmade Jewelry Set'. Price: $45 USD. Category: Accessories. Listed with 3 product images." },
  { id: "AUD004", timestamp: "2024-01-15 16:20:00", action: "Edited Event", target: "Event", entityId: "EVT001", notes: "Updated venue information", details: "Modified event 'Cultural Festival 2024'. Changed venue from 'TBD' to 'Community Center'. Updated capacity and added parking information." },
  { id: "AUD005", timestamp: "2024-01-15 14:00:00", action: "Resolved Report", target: "Report", entityId: "RPT004", notes: "Warned user for harassment", details: "Resolved harassment report in group 'Business Network'. Issued formal warning to offending user. No content removal required." },
  { id: "AUD006", timestamp: "2024-01-15 11:30:45", action: "Created Group", target: "Group", entityId: "GRP006", notes: "Created 'Entrepreneurs Network'", details: "Created new private group 'Entrepreneurs Network' for business professionals. Initial settings: Private, Invite-only membership." },
  { id: "AUD007", timestamp: "2024-01-14 15:45:00", action: "Deleted Post", target: "Post", entityId: "P003", notes: "Removed spam content", details: "Deleted post identified as spam. Content contained promotional links and violated community guidelines. User notified of removal." },
  { id: "AUD008", timestamp: "2024-01-14 09:00:00", action: "Closed Opportunity", target: "Opportunity", entityId: "OPP004", notes: "Deadline reached", details: "Closed opportunity 'Small Business Grant' as application deadline was reached. Total applications received: 156. Processing for review." },
];

const actionColors: Record<string, string> = {
  Created: "bg-success/10 text-success",
  Edited: "bg-blue-500/10 text-blue-400",
  Deleted: "bg-destructive/10 text-destructive",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Resolved: "bg-primary/10 text-primary",
  Closed: "bg-secondary text-secondary-foreground",
};

function getActionColor(action: string): string {
  const key = Object.keys(actionColors).find(k => action.includes(k));
  return key ? actionColors[key] : "bg-secondary text-secondary-foreground";
}

export default function Audit() {
  const { t } = useTranslation();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const handleView = (log: AuditLog) => {
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
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t("audit.exportLog")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("audit.searchLogs")} className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead className="w-40">Action</TableHead>
              <TableHead className="w-28">Target</TableHead>
              <TableHead className="w-24">Entity ID</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogsData.map((log) => (
              <TableRow key={log.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.target}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                <TableCell className="text-foreground">{log.notes}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Retention Notice */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
        <FileText className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Audit entries are retained for <span className="text-foreground font-medium">5 years</span> per platform policy. This log shows only your own admin actions.
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
              <Badge className={getActionColor(selectedLog?.action || "")}>{selectedLog?.action}</Badge>
              <span className="font-mono text-xs text-muted-foreground">{selectedLog?.timestamp}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Target</span>
                <p className="font-medium">{selectedLog?.target}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Entity ID</span>
                <p className="font-mono font-medium">{selectedLog?.entityId}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="font-medium">{selectedLog?.notes}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Full Details</span>
              <p className="text-foreground mt-1">{selectedLog?.details}</p>
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
