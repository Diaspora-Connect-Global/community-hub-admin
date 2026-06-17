import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  Database,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRegistries } from "@/hooks/useRegistries";
import { useRegistryActions } from "@/hooks/useRegistryActions";
import { registry as fetchRegistry } from "@/services/graphql/registry";
import type { RegistryOwnerType, RegistrySummary } from "@/services/graphql/registry";
import { RegistryFormModal } from "@/pages/registries/RegistryFormModal";
import {
  initialRegistryForm,
  registryToForm,
  titleCase,
  REGISTRY_STATUS_BADGE,
  formatDateTime,
  type RegistryFormState,
} from "@/pages/registries/types";

export default function Registries() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);
  const ownerEntityId = admin?.scopeId ?? "";
  const ownerType: RegistryOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";

  const { registries, loading, error, refetch } = useRegistries({
    ownerType,
    ownerEntityId,
  });
  const actions = useRegistryActions({ ownerType, ownerEntityId });

  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RegistryFormState>(initialRegistryForm);
  const [editForm, setEditForm] = useState<RegistryFormState>(initialRegistryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<RegistrySummary | null>(null);

  const withSubmitting = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await fn();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = () =>
    void withSubmitting(async () => {
      const created = await actions.createRegistryHandler(createForm);
      if (created) {
        setCreateForm(initialRegistryForm);
        setCreateOpen(false);
        await refetch();
      }
    });

  const handleOpenEdit = async (row: RegistrySummary) => {
    try {
      const full = await fetchRegistry(row.id);
      if (!full) return;
      setEditingId(full.id);
      setEditForm(registryToForm(full));
      setEditOpen(true);
    } catch {
      // toast handled by callers elsewhere; keep silent here.
    }
  };

  const handleSaveEdit = () =>
    void withSubmitting(async () => {
      if (!editingId) return;
      const updated = await actions.updateRegistryHandler(editingId, editForm);
      if (updated) {
        setEditOpen(false);
        setEditingId(null);
        await refetch();
      }
    });

  const handleArchive = () =>
    void withSubmitting(async () => {
      if (!archiveTarget) return;
      const result = await actions.archiveRegistryHandler(archiveTarget.id);
      if (result) {
        setArchiveTarget(null);
        await refetch();
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("registries.title", "Membership Registry")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("registries.subtitle", "Manage structured membership registries for your organization.")}
          </p>
        </div>
        <Button variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("registries.createRegistry", "Create Registry")}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t("registries.loading", "Loading registries…")}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            {t("common.retry", "Retry")}
          </Button>
        </div>
      )}

      {!loading && !error && registries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Database className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">{t("registries.empty", "No registries yet")}</p>
          <p className="text-sm">
            {t("registries.emptyHint", "Create your first registry to start managing members.")}
          </p>
        </div>
      )}

      {!loading && !error && registries.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("registries.name", "Name")}</TableHead>
                <TableHead>{t("registries.code", "Code")}</TableHead>
                <TableHead>{t("registries.type", "Type")}</TableHead>
                <TableHead>{t("registries.status", "Status")}</TableHead>
                <TableHead>{t("registries.selfReg", "Self-Reg")}</TableHead>
                <TableHead>{t("registries.updated", "Updated")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registries.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/registries/${row.id}`)}
                >
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.registryType ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={REGISTRY_STATUS_BADGE[row.status] ?? ""}
                    >
                      {titleCase(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.selfRegistrationEnabled
                      ? t("common.yes", "Yes")
                      : t("common.no", "No")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(row.updatedAt)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/registries/${row.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t("registries.view", "View")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleOpenEdit(row)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("common.edit", "Edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={row.status === "ARCHIVED"}
                          onClick={() => setArchiveTarget(row)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {t("registries.archive", "Archive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RegistryFormModal
        mode="create"
        open={createOpen}
        form={createForm}
        submitting={submitting}
        onChange={setCreateForm}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      <RegistryFormModal
        mode="edit"
        open={editOpen}
        form={editForm}
        submitting={submitting}
        onChange={setEditForm}
        onSubmit={handleSaveEdit}
        onClose={() => {
          setEditOpen(false);
          setEditingId(null);
        }}
      />

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("registries.archiveConfirmTitle", "Archive registry?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "registries.archiveConfirmBody",
                "Archiving stops new entries. This cannot be undone.",
              )}{" "}
              <strong>{archiveTarget?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("registries.archive", "Archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
