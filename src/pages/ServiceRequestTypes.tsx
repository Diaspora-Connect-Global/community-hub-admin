import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Ban,
  FileStack,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import type {
  ServiceRequestType,
  ServiceRequestOwnerType,
  CreateServiceRequestTypeInput,
  UpdateServiceRequestTypeInput,
} from "@/services/graphql/serviceRequests";
import { formatMoney } from "@/pages/serviceRequests/types";
import {
  useAdminServiceRequestTypes,
  useCreateServiceRequestType,
  useUpdateServiceRequestType,
  useDeactivateServiceRequestType,
} from "@/hooks/useServiceRequestTypes";
import { ServiceRequestTypeDialog, fieldCountLabel } from "./serviceRequestTypes/ServiceRequestTypeDialog";

export default function ServiceRequestTypes() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);

  // Owner scoping — mirrors ServiceRequests.tsx (no hardcoded ids).
  const ownerType: ServiceRequestOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";
  const ownerEntityId = admin?.scopeId ?? "";

  const { types, loading, error, refetch } = useAdminServiceRequestTypes(
    ownerType,
    ownerEntityId,
  );
  const { create, saving: creating } = useCreateServiceRequestType();
  const { update, saving: updating } = useUpdateServiceRequestType();
  const { deactivate, pendingId } = useDeactivateServiceRequestType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceRequestType | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<ServiceRequestType | null>(null);

  const sortedTypes = useMemo(
    () =>
      [...types].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.displayName.localeCompare(b.displayName),
      ),
    [types],
  );

  const existingCodes = useMemo(
    () => types.map((tp) => tp.code.toLowerCase()),
    [types],
  );

  const openCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const openEdit = (type: ServiceRequestType) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleCreate = async (input: CreateServiceRequestTypeInput) => {
    // Inject the resolved owner scope here so the dialog never hardcodes it.
    await create({ ...input, ownerType, ownerEntityId });
    setDialogOpen(false);
    await refetch();
  };

  const handleUpdate = async (input: UpdateServiceRequestTypeInput) => {
    await update(input);
    setDialogOpen(false);
    await refetch();
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivate(deactivateTarget.id);
      setDeactivateTarget(null);
      await refetch();
    } catch {
      // Toast already shown by the hook.
    }
  };

  if (!ownerEntityId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("serviceRequests.noScope", "No community scope available.")}
      </div>
    );
  }

  const colSpan = 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("nav.serviceRequestTypes", "Service Request Types")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Define the services and dynamic forms end users fill in.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New type
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="w-40">Code</TableHead>
              <TableHead className="w-28">Fee</TableHead>
              <TableHead className="w-28">Form fields</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}

            {!loading && !error && sortedTypes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground py-12"
                >
                  <FileStack className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No service request types yet.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first type
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedTypes.map((type) => {
                const fee = formatMoney(type.feeAmountMinor, type.feeCurrency);
                return (
                  <TableRow key={type.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{type.displayName}</span>
                        {type.description && (
                          <span className="text-xs text-muted-foreground/70 line-clamp-1">
                            {type.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {type.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fee ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fieldCountLabel(type.formFields?.length ?? 0)}
                    </TableCell>
                    <TableCell>
                      {type.isActive ? (
                        <Badge className="bg-success/10 text-success">Active</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
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
                            onClick={() => openEdit(type)}
                            className="text-foreground"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {type.isActive && (
                            <DropdownMenuItem
                              onClick={() => setDeactivateTarget(type)}
                              className="text-destructive"
                              disabled={pendingId === type.id}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <ServiceRequestTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingType={editingType}
        existingCodes={existingCodes}
        saving={creating || updating}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      {/* Deactivate confirmation */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this type?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deactivateTarget?.displayName}" will be hidden from end users.
              You can re-activate it later from the edit dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeactivate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
