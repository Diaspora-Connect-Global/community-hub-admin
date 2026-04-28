import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Users, Lock, Globe, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { discoverGroups } from "@/services/graphql/groups/queries";
import { createGroup, updateGroup, deleteGroup } from "@/services/graphql/groups/mutations";
import type { Group as ApiGroup, GroupPrivacy } from "@/services/graphql/groups/types";

interface UiGroup {
  id: string;
  name: string;
  description?: string;
  privacy: GroupPrivacy;
  members: number;
  createdAt: string;
  avatarUrl?: string;
  category?: string;
}

function mapApiGroup(g: ApiGroup): UiGroup {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    privacy: g.privacy,
    members: g.memberCount,
    createdAt: new Date(g.createdAt).toLocaleDateString(),
    avatarUrl: g.avatarUrl,
    category: g.category,
  };
}

function formatPrivacy(privacy: GroupPrivacy): string {
  if (privacy === "PUBLIC") return "Public";
  if (privacy === "SECRET") return "Secret";
  return "Private";
}

function PrivacyIcon({ privacy }: { privacy: GroupPrivacy }) {
  if (privacy === "PUBLIC") return <Globe className="h-3 w-3" />;
  if (privacy === "SECRET") return <ShieldAlert className="h-3 w-3" />;
  return <Lock className="h-3 w-3" />;
}

export default function Groups() {
  const { t } = useTranslation();
  const location = useLocation();
  const { toast } = useToast();

  const [groups, setGroups] = useState<UiGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UiGroup | null>(null);

  const [editForm, setEditForm] = useState({ name: "", description: "", privacy: "PUBLIC" as GroupPrivacy, avatarUrl: "" });
  const [createForm, setCreateForm] = useState({ name: "", description: "", privacy: "PUBLIC" as GroupPrivacy });

  const fetchGroups = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await discoverGroups({
        search: search?.trim() || undefined,
        limit: 100,
        offset: 0,
      });
      setGroups(result.groups.map(mapApiGroup));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchGroups(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchGroups]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredGroups = useMemo(() => groups, [groups]);

  const handleView = (group: UiGroup) => {
    setSelectedGroup(group);
    setViewModalOpen(true);
  };

  const handleEdit = (group: UiGroup) => {
    setSelectedGroup(group);
    setEditForm({
      name: group.name,
      description: group.description ?? "",
      privacy: group.privacy,
      avatarUrl: group.avatarUrl ?? "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (group: UiGroup) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;
    setSubmitting(true);
    try {
      const result = await deleteGroup(selectedGroup.id);
      if (!result.success) throw new Error(result.message ?? "Delete failed");
      setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id));
      setDeleteModalOpen(false);
      setSelectedGroup(null);
      toast({ title: "Group deleted", description: `"${selectedGroup.name}" was removed.` });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed to delete group", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedGroup) return;
    if (!editForm.name.trim()) {
      toast({ title: "Name required", description: "Group name cannot be empty.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateGroup({
        groupId: selectedGroup.id,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        privacy: editForm.privacy,
        avatarUrl: editForm.avatarUrl.trim() || undefined,
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id
            ? {
                ...g,
                name: result.group.name,
                description: result.group.description,
                privacy: result.group.privacy,
                avatarUrl: result.group.avatarUrl,
                category: result.group.category ?? g.category,
              }
            : g
        )
      );
      setEditModalOpen(false);
      setSelectedGroup(null);
      toast({ title: "Group updated", description: "Changes saved successfully." });
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Failed to update group", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast({ title: "Name required", description: "Enter a group name before creating.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        privacy: createForm.privacy,
      });
      const g = result.group;
      setGroups((prev) => [
        {
          id: g.id,
          name: g.name,
          privacy: g.privacy,
          members: g.memberCount ?? 1,
          createdAt: new Date(g.createdAt).toLocaleDateString(),
          description: g.description,
          avatarUrl: g.avatarUrl,
          category: g.category,
        },
        ...prev,
      ]);
      setCreateForm({ name: "", description: "", privacy: "PUBLIC" });
      setCreateModalOpen(false);
      toast({ title: "Group created", description: `"${g.name}" is now live.` });
    } catch (err) {
      toast({ title: "Create failed", description: err instanceof Error ? err.message : "Failed to create group", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("groups.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("groups.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("groups.createGroup")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void fetchGroups(searchTerm)}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Privacy</TableHead>
              <TableHead className="w-28 text-center">Members</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading groups...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No groups found.
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{group.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium text-foreground">{group.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <PrivacyIcon privacy={group.privacy} />
                      {formatPrivacy(group.privacy)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.members}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{group.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(group)} className="text-foreground">
                          <Eye className="h-4 w-4 mr-2" />View Metadata
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(group)} className="text-foreground">
                          <Edit className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(group)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Delete
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

      {/* E2EE Notice */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
        <Lock className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          All group messages are <span className="text-foreground font-medium">end-to-end encrypted</span>. You can only manage group metadata and members, not message content.
        </p>
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Group</DialogTitle>
            <DialogDescription>Create a new group for your community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Group Name</Label>
              <Input
                id="create-name"
                placeholder="Enter group name..."
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-privacy">Privacy</Label>
              <Select
                value={createForm.privacy}
                onValueChange={(value) => setCreateForm({ ...createForm, privacy: value as GroupPrivacy })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="SECRET">Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Describe your group..."
                rows={4}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="outline" onClick={() => void handleCreate()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedGroup?.name}</DialogTitle>
            <DialogDescription>Created on {selectedGroup?.createdAt}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              {selectedGroup && (
                <Badge variant="secondary" className="gap-1">
                  <PrivacyIcon privacy={selectedGroup.privacy} />
                  {formatPrivacy(selectedGroup.privacy)}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedGroup?.members} members</span>
              </div>
              {selectedGroup?.category && (
                <span className="text-sm text-muted-foreground">Category: {selectedGroup.category}</span>
              )}
            </div>
            <p className="text-sm text-foreground">{selectedGroup?.description ?? "No description provided."}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Group</DialogTitle>
            <DialogDescription>Make changes to the group settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-privacy">Privacy</Label>
              <Select
                value={editForm.privacy}
                onValueChange={(value) => setEditForm({ ...editForm, privacy: value as GroupPrivacy })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="SECRET">Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">Avatar URL</Label>
              <Input
                id="edit-avatar"
                placeholder="https://..."
                value={editForm.avatarUrl}
                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="outline" onClick={() => void saveEdit()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedGroup?.name}&quot;? This action cannot be undone and all group data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
