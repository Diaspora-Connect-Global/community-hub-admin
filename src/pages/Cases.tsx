import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, MoreHorizontal, Eye, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useCasesData } from "@/hooks/useCasesData";
import type { SupportCaseSummary, SupportOwnerType } from "@/services/graphql/support";
import {
  CASE_STATUSES,
  CASE_PRIORITIES,
  STATUS_ALL,
  PRIORITY_ALL,
  PAGE_SIZE,
  statusColors,
  priorityColors,
} from "@/pages/cases/types";

export default function Cases() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);

  const ownerType: SupportOwnerType =
    admin?.scopeType === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";
  const scopeId =
    admin?.scopeType === "COMMUNITY" || admin?.scopeType === "ASSOCIATION"
      ? (admin.scopeId ?? null)
      : null;

  const {
    filteredCases,
    total,
    openCount,
    loading,
    error,
    page,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    handlePageChange,
    caseTypeMap,
  } = useCasesData({ scopeId, ownerType });

  const handleView = (c: SupportCaseSummary) => {
    navigate(`/cases/${c.id}`);
  };

  const hasNextPage = filteredCases.length === PAGE_SIZE && !searchQuery.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("cases.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("cases.subtitle")}</p>
        </div>
        {openCount > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning gap-1">
            <AlertTriangle className="h-3 w-3" />
            {openCount} {t("cases.openCount")}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("cases.searchCases")}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("cases.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>{t("cases.allStatuses")}</SelectItem>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("cases.filterPriority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PRIORITY_ALL}>{t("cases.allPriorities")}</SelectItem>
            {CASE_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32">{t("cases.colCaseNumber")}</TableHead>
              <TableHead>{t("cases.colTitle")}</TableHead>
              <TableHead className="w-32">{t("cases.colType")}</TableHead>
              <TableHead className="w-28">{t("cases.colPriority")}</TableHead>
              <TableHead className="w-32">{t("cases.colStatus")}</TableHead>
              <TableHead className="w-40">{t("cases.colAssignee")}</TableHead>
              <TableHead className="w-28">{t("cases.colCreated")}</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && filteredCases.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {t("cases.empty")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              filteredCases.map((c) => (
                <TableRow
                  key={c.id}
                  className="group cursor-pointer"
                  onClick={() => handleView(c)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.caseNumber}
                  </TableCell>
                  <TableCell className="font-medium text-foreground max-w-xs truncate">
                    {c.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.category ? caseTypeMap[c.category] ?? c.category : "—"}
                  </TableCell>
                  <TableCell>
                    {c.priority ? (
                      <Badge className={priorityColors[c.priority] ?? ""}>{c.priority}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status] ?? ""}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[10rem]">
                    {c.assigneeUserId ?? t("cases.unassigned")}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleView(c)}
                          className="text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("cases.viewDetails")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && filteredCases.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {t("cases.totalCount", { count: total })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cases.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage || loading}
                onClick={() => handlePageChange(page + 1)}
              >
                {t("cases.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
