import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  AlertCircle,
  Eye,
  MoreHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useServiceRequestsData } from "@/hooks/useServiceRequestsData";
import type { ServiceRequestOwnerType } from "@/services/graphql/serviceRequests";
import {
  REQUEST_STATUSES,
  FILTER_ALL,
  formatStatusLabel,
  getStatusBadgeClass,
  formatMoney,
  formatDate,
} from "@/pages/serviceRequests/types";

export default function ServiceRequests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);

  const ownerType: ServiceRequestOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";
  const ownerEntityId = admin?.scopeId ?? "";

  const {
    requestTypes,
    loading,
    error,
    page,
    hasMore,
    statusFilter,
    typeFilter,
    searchTerm,
    setStatusFilter,
    setTypeFilter,
    setSearchTerm,
    handlePageChange,
    refetch,
    visibleRequests,
    typeNameById,
  } = useServiceRequestsData({ ownerEntityId, ownerType });

  const colSpan = 7;

  const sortedTypes = useMemo(
    () => [...requestTypes].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [requestTypes],
  );

  if (!ownerEntityId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("serviceRequests.noScope")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("serviceRequests.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("serviceRequests.subtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("serviceRequests.search")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("serviceRequests.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>
              {t("serviceRequests.allStatuses")}
            </SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("serviceRequests.filterType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>
              {t("serviceRequests.allTypes")}
            </SelectItem>
            {sortedTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            {t("serviceRequests.retry")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("serviceRequests.col.requestNumber")}</TableHead>
              <TableHead>{t("serviceRequests.col.type")}</TableHead>
              <TableHead className="w-36">{t("serviceRequests.col.status")}</TableHead>
              <TableHead className="w-28">{t("serviceRequests.col.fee")}</TableHead>
              <TableHead>{t("serviceRequests.col.assignee")}</TableHead>
              <TableHead className="w-28">{t("serviceRequests.col.submitted")}</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}

            {!loading && !error && visibleRequests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground py-12"
                >
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("serviceRequests.empty")}</p>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              visibleRequests.map((req) => {
                const fee = formatMoney(req.feeAmountMinor, req.feeCurrency);
                const typeName =
                  typeNameById[req.requestTypeId] ?? req.category ?? req.requestTypeId;
                return (
                  <TableRow
                    key={req.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/service-requests/${req.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {req.requestNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{typeName}</span>
                        {req.category && (
                          <span className="text-xs text-muted-foreground/70">
                            {req.category}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(req.status)}>
                        {formatStatusLabel(req.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fee ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {req.assigneeUserId
                        ? req.assigneeUserId
                        : t("serviceRequests.unassigned")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(req.submittedAt)}
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
                            onClick={() => navigate(`/service-requests/${req.id}`)}
                            className="text-foreground"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("serviceRequests.view")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (page > 0 || hasMore) && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("serviceRequests.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("serviceRequests.page")} {page + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => handlePageChange(page + 1)}
          >
            {t("serviceRequests.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
