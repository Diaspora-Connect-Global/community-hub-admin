import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Archive,
  Library,
  Search,
  X,
  Loader2,
  Eye,
  Download,
  Send,
  Undo2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ResourceSummary,
  ResourceOwnerType,
  CreateResourceInput,
  UpdateResourceInput,
} from "@/services/graphql/resources";
import {
  useAdminResources,
  useResourceCategories,
  useCreateResource,
  useUpdateResource,
  useResourceLifecycle,
} from "@/hooks/useResources";
import {
  getStatusBadgeClass,
  fileTypeLabel,
  visibilityLabel,
  statusLabel,
  formatDate,
} from "./resources/types";
import { ResourceDialog } from "./resources/ResourceDialog";

export default function Resources() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.admin);

  // Owner scoping — mirrors ServiceRequestTypes.tsx (no hardcoded ids).
  const ownerType: ResourceOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";
  const ownerEntityId = admin?.scopeId ?? "";

  const { resources, loading, error, refetch } = useAdminResources(
    ownerType,
    ownerEntityId,
  );
  const { categories } = useResourceCategories(ownerType, ownerEntityId);
  const { create, saving: creating } = useCreateResource();
  const { update, saving: updating } = useUpdateResource();
  const { publish, unpublish, archive, pendingId } = useResourceLifecycle();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceSummary | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = useState<ResourceSummary | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const sortedResources = useMemo(
    () =>
      [...resources].sort((a, b) => {
        const da = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const db = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return db - da || a.title.localeCompare(b.title);
      }),
    [resources],
  );

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedResources;
    return sortedResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.resourceNumber ?? "").toLowerCase().includes(q) ||
        r.tags.some((tg) => tg.toLowerCase().includes(q)),
    );
  }, [sortedResources, searchQuery]);

  const openCreate = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };

  const openEdit = (resource: ResourceSummary) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleCreate = async (input: CreateResourceInput, file: File | null) => {
    // Inject the resolved owner scope here so the dialog never hardcodes it.
    await create({ ...input, ownerType, ownerEntityId }, file);
    setDialogOpen(false);
    await refetch();
  };

  const handleUpdate = async (input: UpdateResourceInput, file: File | null) => {
    await update(input, file);
    setDialogOpen(false);
    await refetch();
  };

  const handlePublish = async (resource: ResourceSummary) => {
    try {
      await publish(resource.id);
      await refetch();
    } catch {
      // Toast already shown by the hook.
    }
  };

  const handleUnpublish = async (resource: ResourceSummary) => {
    try {
      await unpublish(resource.id);
      await refetch();
    } catch {
      // Toast already shown by the hook.
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archive(archiveTarget.id);
      setArchiveTarget(null);
      await refetch();
    } catch {
      // Toast already shown by the hook.
    }
  };

  if (!ownerEntityId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("resources.noScope", "No community scope available.")}
      </div>
    );
  }

  const colSpan = 7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("nav.resources", "Resources")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your community's resource library — documents and knowledge base.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading resources…
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40">Visibility</TableHead>
                <TableHead className="w-28">Engagement</TableHead>
                <TableHead className="w-32">Updated</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResources.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="text-center text-muted-foreground py-12"
                  >
                    <Library className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No resources yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={openCreate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first resource
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {sortedResources.length > 0 && filteredResources.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="text-center text-muted-foreground py-12"
                  >
                    No resources match "{searchQuery}".
                  </TableCell>
                </TableRow>
              )}

              {filteredResources.map((resource) => (
                <TableRow key={resource.id} className="group">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{resource.title}</span>
                      {resource.resourceNumber && (
                        <span className="text-xs text-muted-foreground/70 font-mono">
                          {resource.resourceNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fileTypeLabel(resource.fileType)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(resource.status)}>
                      {statusLabel(resource.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visibilityLabel(resource.visibility)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {resource.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {resource.downloadCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(resource.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-foreground"
                          disabled={pendingId === resource.id}
                        >
                          {pendingId === resource.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEdit(resource)}
                          className="text-foreground"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {resource.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => void handlePublish(resource)}
                            className="text-foreground"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {resource.status === "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() => void handleUnpublish(resource)}
                            className="text-foreground"
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {resource.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => setArchiveTarget(resource)}
                            className="text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <ResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingResource={editingResource}
        categories={categories}
        saving={creating || updating}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      {/* Archive confirmation */}
      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.title}" will be hidden from members. Archiving is a
              terminal state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleArchive();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
