import { useMemo, useState } from "react";
import { Loader2, Save, AlertTriangle, Crown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import type {
  Group,
  GroupMember,
  GroupPrivacy,
} from "@/services/graphql/groups/types";
import {
  updateGroup,
  transferGroupOwnership,
  deleteGroup,
} from "@/services/graphql/groups/mutations";

interface Props {
  group: Group;
  members: GroupMember[];
  onUpdated: (g: Group) => void;
  onDeleted: () => void;
}

function memberName(m: GroupMember): string {
  return `${m.profile?.firstName ?? ""} ${m.profile?.lastName ?? ""}`.trim() || m.userId;
}

export default function SettingsTab({ group, members, onUpdated, onDeleted }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [privacy, setPrivacy] = useState<GroupPrivacy>(group.privacy);
  const [avatarUrl, setAvatarUrl] = useState(group.avatarUrl ?? "");
  const [savingDetails, setSavingDetails] = useState(false);

  const [newOwnerId, setNewOwnerId] = useState<string>("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedAvatarUrl = avatarUrl.trim();

  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= 100;
  const isDescriptionValid = trimmedDescription.length <= 500;

  const hasChanges =
    trimmedName !== group.name ||
    trimmedDescription !== (group.description ?? "") ||
    privacy !== group.privacy ||
    trimmedAvatarUrl !== (group.avatarUrl ?? "");

  const canSaveDetails = hasChanges && isNameValid && isDescriptionValid && !savingDetails;

  const transferCandidates = useMemo(
    () => members.filter((m) => m.role !== "OWNER" && m.status === "ACTIVE"),
    [members],
  );

  const saveDetails = async () => {
    if (!canSaveDetails) return;
    setSavingDetails(true);
    try {
      const res = await updateGroup({
        groupId: group.id,
        name: trimmedName,
        description: trimmedDescription || undefined,
        privacy,
        avatarUrl: trimmedAvatarUrl || undefined,
      });
      toast({ title: "Group updated" });
      onUpdated(res.group);
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const confirmTransfer = async () => {
    if (!newOwnerId) return;
    setTransferring(true);
    try {
      const res = await transferGroupOwnership({ groupId: group.id, newOwnerId });
      if (!res.success) throw new Error(res.message ?? "Transfer failed");
      toast({
        title: "Ownership transferred",
        description: res.message ?? undefined,
      });
      onUpdated({ ...group, ownerId: res.newOwnerId ?? newOwnerId });
      setTransferDialogOpen(false);
      setNewOwnerId("");
    } catch (err) {
      toast({
        title: "Transfer failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== group.name) return;
    setDeleting(true);
    try {
      const res = await deleteGroup(group.id);
      if (!res.success) throw new Error(res.message ?? "Delete failed");
      toast({ title: "Group deleted" });
      setDeleteDialogOpen(false);
      onDeleted();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Group details</h3>
          <p className="text-sm text-muted-foreground">
            Update the public-facing information for this group.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-name">Name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Group name"
          />
          <div className="text-xs text-muted-foreground">
            {trimmedName.length}/100
            {!isNameValid && trimmedName.length === 0 ? " — name is required" : ""}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-description">Description</Label>
          <Textarea
            id="settings-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="What is this group about?"
          />
          <div className="text-xs text-muted-foreground">{trimmedDescription.length}/500</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-privacy">Privacy</Label>
          <Select value={privacy} onValueChange={(v) => setPrivacy(v as GroupPrivacy)}>
            <SelectTrigger id="settings-privacy">
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
          <Label htmlFor="settings-avatar">Avatar URL</Label>
          <Input
            id="settings-avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => void saveDetails()} disabled={!canSaveDetails}>
            {savingDetails ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save changes
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Transfer ownership
          </h3>
          <p className="text-sm text-muted-foreground">
            Hand over this group to an active member. You will become an admin.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-new-owner">New owner</Label>
          <Select
            value={newOwnerId}
            onValueChange={setNewOwnerId}
            disabled={transferCandidates.length === 0}
          >
            <SelectTrigger id="settings-new-owner">
              <SelectValue
                placeholder={
                  transferCandidates.length === 0
                    ? "No eligible members"
                    : "Select a member"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {transferCandidates.map((m) => (
                <SelectItem key={m.id} value={m.userId}>
                  {memberName(m)} · {m.userId.slice(-6)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setTransferDialogOpen(true)}
            disabled={!newOwnerId || transferring}
          >
            {transferring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transfer ownership
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </h3>
          <p className="text-sm text-muted-foreground">
            Deleting this group is permanent. All members, posts, and history will be removed.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete group
          </Button>
        </div>
      </section>

      <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              The new owner will gain full control of <strong>{group.name}</strong>. Your role
              will be downgraded. This can be reversed only by the new owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmTransfer();
              }}
              disabled={transferring}
            >
              {transferring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Type{" "}
              <span className="font-mono font-semibold text-foreground">{group.name}</span> to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="settings-delete-confirm" className="sr-only">
              Type group name to confirm
            </Label>
            <Input
              id="settings-delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={group.name}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting || deleteConfirmText !== group.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
