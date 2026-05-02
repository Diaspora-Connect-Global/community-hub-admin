import { useTranslation } from "react-i18next";
import {
  Ban,
  CheckCircle,
  Eye,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  UserMinus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle } from "lucide-react";
import {
  type MemberDetails,
  PAGE_SIZE,
  getInitials,
  apiRoleToSelectValue,
  formatRoleLabel,
  formatStatusLabel,
  getRoleBadgeClass,
  getStatusBadgeVariant,
} from "@/pages/members/types";

interface MembersTableProps {
  members: MemberDetails[];
  loading: boolean;
  searching: boolean;
  error: string | null;
  searchTerm: string;
  page: number;
  totalMembers: number;
  actionLoading: string | null;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onView: (member: MemberDetails) => void;
  onOpenRoleDialog: (member: MemberDetails, currentRole: string) => void;
  onOpenSuspendDialog: (member: MemberDetails) => void;
  onUnsuspend: (member: MemberDetails) => void;
  onOpenBanDialog: (member: MemberDetails) => void;
  onUnban: (member: MemberDetails) => void;
  onOpenRemoveDialog: (member: MemberDetails) => void;
}

export function MembersTable({
  members,
  loading,
  searching,
  error,
  searchTerm,
  page,
  totalMembers,
  actionLoading,
  onSearchChange,
  onPageChange,
  onView,
  onOpenRoleDialog,
  onOpenSuspendDialog,
  onUnsuspend,
  onOpenBanDialog,
  onUnban,
  onOpenRemoveDialog,
}: MembersTableProps) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalMembers / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          {searching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder={t("members.searchMembers")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Member</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">Joined</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.userId} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(member.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-mono text-xs text-muted-foreground">
                        {member.userId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getRoleBadgeClass(member.role)}
                    >
                      {formatRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {formatStatusLabel(member.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onView(member)}
                          className="text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onOpenRoleDialog(member, apiRoleToSelectValue(member.role))
                          }
                          className="text-foreground"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Assign Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.status?.toLowerCase() === "suspended" ? (
                          <DropdownMenuItem
                            onClick={() => onUnsuspend(member)}
                            disabled={actionLoading === member.userId + "_unsuspend"}
                            className="text-foreground"
                          >
                            {actionLoading === member.userId + "_unsuspend" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldOff className="h-4 w-4 mr-2" />
                            )}
                            Unsuspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onOpenSuspendDialog(member)}
                            className="text-foreground"
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {member.status?.toLowerCase() === "banned" ? (
                          <DropdownMenuItem
                            onClick={() => onUnban(member)}
                            disabled={actionLoading === member.userId + "_unban"}
                            className="text-foreground"
                          >
                            {actionLoading === member.userId + "_unban" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Unban
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onOpenBanDialog(member)}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onOpenRemoveDialog(member)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove
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
      {!searchTerm && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, totalMembers)} of {totalMembers}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
