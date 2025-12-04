import { Search, Download, Eye, FileText } from "lucide-react";
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

const auditLogs = [
  { id: "AUD001", timestamp: "2024-01-16 14:32:15", action: "Created Post", target: "Post", entityId: "P006", notes: "Published 'Community Update'" },
  { id: "AUD002", timestamp: "2024-01-16 12:15:00", action: "Approved Verification", target: "Verification", entityId: "VER003", notes: "Approved ID document" },
  { id: "AUD003", timestamp: "2024-01-16 10:45:30", action: "Created Listing", target: "Listing", entityId: "LST006", notes: "New product listing" },
  { id: "AUD004", timestamp: "2024-01-15 16:20:00", action: "Edited Event", target: "Event", entityId: "EVT001", notes: "Updated venue information" },
  { id: "AUD005", timestamp: "2024-01-15 14:00:00", action: "Resolved Report", target: "Report", entityId: "RPT004", notes: "Warned user for harassment" },
  { id: "AUD006", timestamp: "2024-01-15 11:30:45", action: "Created Group", target: "Group", entityId: "GRP006", notes: "Created 'Entrepreneurs Network'" },
  { id: "AUD007", timestamp: "2024-01-14 15:45:00", action: "Deleted Post", target: "Post", entityId: "P003", notes: "Removed spam content" },
  { id: "AUD008", timestamp: "2024-01-14 09:00:00", action: "Closed Opportunity", target: "Opportunity", entityId: "OPP004", notes: "Deadline reached" },
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Audit Log</h1>
          <p className="text-muted-foreground mt-1">View an immutable log of your admin actions.</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search audit logs..." className="pl-10" />
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
            {auditLogs.map((log) => (
              <TableRow key={log.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.target}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                <TableCell className="text-foreground">{log.notes}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4" />
                  </Button>
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
    </div>
  );
}
