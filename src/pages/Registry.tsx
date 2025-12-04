import { Search, MoreHorizontal, Eye, Check, X, MessageSquare, FileText, Clock } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const verifications = [
  { id: "VER001", user: "Kofi Mensah", docType: "ID Document", submittedAt: "2024-01-16", status: "Pending" },
  { id: "VER002", user: "Ama Darko", docType: "Proof of Address", submittedAt: "2024-01-15", status: "Pending" },
  { id: "VER003", user: "Kweku Asante", docType: "ID Document", submittedAt: "2024-01-14", status: "Approved" },
  { id: "VER004", user: "Akua Boateng", docType: "ID Document", submittedAt: "2024-01-13", status: "Rejected" },
  { id: "VER005", user: "Yaw Owusu", docType: "Business Registration", submittedAt: "2024-01-12", status: "Pending" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function Registry() {
  const pendingCount = verifications.filter(v => v.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Registry & Verification</h1>
          <p className="text-muted-foreground mt-1">Review and approve membership verification requests.</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
            <Clock className="h-3 w-3" />
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search verifications..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead className="w-32">Submitted</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.map((verification) => (
              <TableRow key={verification.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{verification.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(verification.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{verification.user}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{verification.docType}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{verification.submittedAt}</TableCell>
                <TableCell>
                  <Badge className={statusColors[verification.status]}>{verification.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Documents</DropdownMenuItem>
                      {verification.status === "Pending" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-success"><Check className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><X className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                          <DropdownMenuItem><MessageSquare className="h-4 w-4 mr-2" />Request Clarification</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
