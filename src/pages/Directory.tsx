import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  EyeOff,
  Archive,
  Plus,
  Loader2,
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
import { useDirectoryData, STATUS_FILTER_ALL } from "@/hooks/useDirectoryData";
import { useDirectoryActions } from "@/hooks/useDirectoryActions";
import { directoryCategories } from "@/services/graphql/directory";
import type {
  DirectoryCategory,
  DirectoryListing,
  DirectoryListingSummary,
  DirectoryOwnerType,
} from "@/services/graphql/directory";
import { DirectoryFormModal } from "@/pages/directory/DirectoryFormModal";
import { DirectoryDetailModal } from "@/pages/directory/DirectoryDetailModal";
import {
  LISTING_STATUSES,
  STATUS_COLORS,
  VERIFICATION_COLORS,
  initialDirectoryForm,
  listingToForm,
  type DirectoryFormState,
} from "@/pages/directory/types";

export default function Directory() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);

  // Directory listings are owned by COMMUNITY / ASSOCIATION entities only.
  const ownerType: DirectoryOwnerType | null =
    admin?.scopeType === "COMMUNITY"
      ? "COMMUNITY"
      : admin?.scopeType === "ASSOCIATION"
        ? "ASSOCIATION"
        : null;
  const scopeId = ownerType ? (admin?.scopeId ?? null) : null;

  const {
    listings,
    loading,
    error,
    page,
    hasNextPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    handlePageChange,
    refetch,
  } = useDirectoryData({
    scopeId,
    ownerType: ownerType ?? "COMMUNITY",
  });

  const {
    createListingHandler,
    updateListingHandler,
    publishListingHandler,
    unpublishListingHandler,
    archiveListingHandler,
    loadListingDetail,
  } = useDirectoryActions({
    ownerType: ownerType ?? "COMMUNITY",
    scopeId,
    onRefetch: refetch,
  });

  // Category options for the form (loaded once per owner scope).
  const [categories, setCategories] = useState<DirectoryCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!ownerType || !scopeId) return;
    let active = true;
    setCategoriesLoading(true);
    directoryCategories(ownerType, scopeId)
      .then((cats) => {
        if (active) setCategories(cats);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ownerType, scopeId]);

  // Modal state
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DirectoryFormState>(initialDirectoryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailListing, setDetailListing] = useState<DirectoryListing | null>(
    null,
  );

  const openCreate = () => {
    setFormMode("create");
    setForm(initialDirectoryForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = useCallback(
    async (row: DirectoryListingSummary) => {
      setFormMode("edit");
      setEditingId(row.id);
      setForm(initialDirectoryForm);
      setFormOpen(true);
      const full = await loadListingDetail(row.id);
      if (full) setForm(listingToForm(full));
    },
    [loadListingDetail],
  );

  const openView = useCallback(
    async (row: DirectoryListingSummary) => {
      setDetailListing(null);
      setDetailLoading(true);
      setDetailOpen(true);
      const full = await loadListingDetail(row.id);
      setDetailListing(full);
      setDetailLoading(false);
    },
    [loadListingDetail],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (formMode === "create") {
        await createListingHandler(form, () => setFormOpen(false));
      } else if (editingId) {
        await updateListingHandler(editingId, form, () => setFormOpen(false));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Out-of-scope guard (platform/global admins have no single owner entity).
  if (!ownerType || !scopeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("directory.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("directory.subtitle")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t("directory.outOfScope")}
        </div>
      </div>
    );
  }

  const COL_SPAN = 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("directory.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("directory.subtitle")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("directory.createBtn")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("directory.searchPlaceholder")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("common.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_FILTER_ALL}>
              {t("directory.filter.allStatuses")}
            </SelectItem>
            {LISTING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`directory.status.${s}`, s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("directory.table.displayName")}</TableHead>
              <TableHead className="w-32">{t("directory.table.kind")}</TableHead>
              <TableHead className="w-36">
                {t("directory.table.category")}
              </TableHead>
              <TableHead className="w-24">
                {t("directory.table.country")}
              </TableHead>
              <TableHead className="w-28">
                {t("directory.table.status")}
              </TableHead>
              <TableHead className="w-36">
                {t("directory.table.verification")}
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={COL_SPAN + 1} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell
                  colSpan={COL_SPAN + 1}
                  className="text-center text-destructive py-12"
                >
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && listings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COL_SPAN + 1}
                  className="text-center text-muted-foreground py-12"
                >
                  {t("directory.empty")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              listings.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {row.displayName}
                    </span>
                    {row.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {row.summary}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t(`directory.kind.${row.listingKind}`, row.listingKind)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.categoryCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.country ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[row.status] ?? ""}>
                      {t(`directory.status.${row.status}`, row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        VERIFICATION_COLORS[row.verificationStatus] ?? ""
                      }
                    >
                      {t(
                        `directory.verification.${row.verificationStatus}`,
                        row.verificationStatus,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => void openView(row)}
                          className="text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("common.view")}
                        </DropdownMenuItem>
                        {row.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => void openEdit(row)}
                            className="text-foreground"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {(row.status === "DRAFT" ||
                          row.status === "UNPUBLISHED") && (
                          <DropdownMenuItem
                            onClick={() => void publishListingHandler(row.id)}
                            className="text-success"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {t("common.publish")}
                          </DropdownMenuItem>
                        )}
                        {row.status === "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() => void unpublishListingHandler(row.id)}
                            className="text-warning"
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            {t("directory.action.unpublish")}
                          </DropdownMenuItem>
                        )}
                        {row.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => void archiveListingHandler(row.id)}
                            className="text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {t("directory.action.archive")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {(page > 0 || hasNextPage) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {t("directory.pageLabel", { page: page + 1 })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                {t("directory.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage || loading}
                onClick={() => handlePageChange(page + 1)}
              >
                {t("directory.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <DirectoryFormModal
        mode={formMode}
        open={formOpen}
        form={form}
        submitting={submitting}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onChange={setForm}
        onSubmit={() => void handleSubmit()}
        onClose={() => setFormOpen(false)}
      />

      {/* Detail modal */}
      <DirectoryDetailModal
        open={detailOpen}
        loading={detailLoading}
        listing={detailListing}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
