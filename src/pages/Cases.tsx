import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  AlertCircle,
  Loader2,
  X,
  UserPlus,
  ArrowRightLeft,
  Inbox,
} from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useCasesData } from "@/hooks/useCasesData";
import { useCaseActions } from "@/hooks/useCaseActions";
import type {
  SupportCaseSummary,
  SupportOwnerType,
} from "@/services/graphql/support";
import {
  CASE_STATUSES,
  CASE_PRIORITIES,
  STATUS_ALL,
  PRIORITY_ALL,
  PAGE_SIZE,
  statusColors,
  priorityColors,
  allowedActionsFor,
  ACTION_LABEL_KEY,
  humanize,
  type CaseActionConfig,
} from "@/pages/cases/types";
import { AssignCaseModal } from "@/pages/cases/AssignCaseModal";
import { CaseStatusModal } from "@/pages/cases/CaseStatusModal";

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
    filterAssignee,
    setFilterAssignee,
    handlePageChange,
    refetch,
    caseTypeMap,
  } = useCasesData({ scopeId, ownerType });

  const { busy, assign, changeStatus } = useCaseActions();

  // Quick-action modal state (assign / status) wired from the row menu.
  const [assignFor, setAssignFor] = useState<SupportCaseSummary | null>(null);
  const [statusFor, setStatusFor] = useState<SupportCaseSummary | null>(null);
  const [statusConfig, setStatusConfig] = useState<CaseActionConfig | null>(null);

  const handleView = (c: SupportCaseSummary) => {
    navigate(`/cases/${c.id}`);
  };

  const openAssign = (c: SupportCaseSummary) => {
    setAssignFor(c);
  };

  const openStatus = (c: SupportCaseSummary, config: CaseActionConfig) => {
    setStatusFor(c);
    setStatusConfig(config);
  };

  const handleAssignSubmit = async (assigneeUserId: string) => {
    if (!assignFor) return;
    const updated = await assign(assignFor.id, assigneeUserId);
    if (updated) {
      setAssignFor(null);
      refetch();
    }
  };

  const handleStatusSubmit = async (args: { reason?: string; resolutionSummary?: string }) => {
    if (!statusFor || !statusConfig) return;
    const updated = await changeStatus({
      caseId: statusFor.id,
      targetStatus: statusConfig.targetStatus,
      reason: args.reason,
      resolutionSummary: args.resolutionSummary,
    });
    if (updated) {
      setStatusFor(null);
      setStatusConfig(null);
      refetch();
    }
  };

  const hasFilters =
    !!searchQuery.trim() ||
    filterStatus !== STATUS_ALL ||
    filterPriority !== PRIORITY_ALL ||
    !!filterAssignee.trim();

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus(STATUS_ALL);
    setFilterPriority(PRIORITY_ALL);
    setFilterAssignee("");
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
            className="pl-10 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t("common.clear")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("cases.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>{t("cases.allStatuses")}</SelectItem>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanize(s)}
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
                {humanize(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-48">
          <Input
            placeholder={t("cases.filterAssignee")}
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="pr-9"
          />
          {filterAssignee && (
            <button
              type="button"
              onClick={() => setFilterAssignee("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t("common.clear")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            {t("common.clear")}
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t("common.loading")}
        </div>
      )}

      {/* Error with retry */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={refetch}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
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
              {filteredCases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <p className="text-sm">{t("cases.empty")}</p>
                      {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          {t("common.clear")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filteredCases.map((c) => {
                const rowActions = allowedActionsFor(c.status);
                const assignAction = rowActions.find((a) => a.viaAssign);
                const statusActions = rowActions.filter((a) => !a.viaAssign);
                return (
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
                        <Badge className={priorityColors[c.priority] ?? ""}>
                          {humanize(c.priority)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status] ?? ""}>
                        {humanize(c.status)}
                      </Badge>
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
                          {assignAction && (
                            <DropdownMenuItem
                              onClick={() => openAssign(c)}
                              className="text-foreground"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {t("cases.action.assign")}
                            </DropdownMenuItem>
                          )}
                          {statusActions.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              {statusActions.map((cfg) => (
                                <DropdownMenuItem
                                  key={cfg.action}
                                  onClick={() => openStatus(c, cfg)}
                                  className={
                                    cfg.action === "REJECT"
                                      ? "text-destructive"
                                      : "text-foreground"
                                  }
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  {t(`cases.action.${ACTION_LABEL_KEY[cfg.action]}`)}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredCases.length > 0 && (
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
                  {t("cases.prev")}
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
      )}

      {/* Quick-action modals (reuse the same workflow modals as the detail view) */}
      <AssignCaseModal
        open={assignFor !== null}
        caseNumber={assignFor?.caseNumber ?? ""}
        currentAssignee={assignFor?.assigneeUserId}
        submitting={busy === "assign"}
        onClose={() => setAssignFor(null)}
        onSubmit={(uid) => void handleAssignSubmit(uid)}
      />

      <CaseStatusModal
        open={statusFor !== null && statusConfig !== null}
        caseNumber={statusFor?.caseNumber ?? ""}
        config={statusConfig}
        submitting={busy === "status"}
        onClose={() => {
          setStatusFor(null);
          setStatusConfig(null);
        }}
        onSubmit={(args) => void handleStatusSubmit(args)}
      />
    </div>
  );
}
