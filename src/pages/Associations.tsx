import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Building2,
  Eye,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Unlink2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveAssociationMembership,
  createAssociation,
  getAssociation,
  getAssociationAvatarUploadUrl,
  getAssociationMembers,
  getAssociationStats,
  getPendingMembershipRequests,
  inviteAssociationMember,
  linkAssociation,
  listAssociationTypes,
  rejectAssociationMembership,
  removeAssociationMember,
  searchAssociations,
  unlinkAssociation,
  updateAssociation,
} from "@/services/graphql/associations";
import type {
  AssociationDetail,
  AssociationJoinPolicy,
  AssociationMember,
  AssociationPendingRequest,
  AssociationStats,
  AssociationTypeDefinition,
  AssociationVisibility,
} from "@/services/graphql/associations";
import { getCommunity, getCommunityAssociations } from "@/services/graphql/community";
import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";

const JOIN_POLICIES: AssociationJoinPolicy[] = ["OPEN", "REQUEST", "INVITE_ONLY"];
const VISIBILITY_OPTIONS: AssociationVisibility[] = ["PUBLIC", "PRIVATE"];

interface AssociationFormState {
  name: string;
  description: string;
  associationTypeId: string;
  joinPolicy: AssociationJoinPolicy;
  visibility: AssociationVisibility;
  adminEmail: string;
  adminPassword: string;
}

const initialCreateForm: AssociationFormState = {
  name: "",
  description: "",
  associationTypeId: "",
  joinPolicy: "OPEN",
  visibility: "PUBLIC",
  adminEmail: "",
  adminPassword: "",
};

const initialEditForm = {
  name: "",
  description: "",
  joinPolicy: "OPEN" as AssociationJoinPolicy,
  visibility: "PUBLIC" as AssociationVisibility,
};

function normalizeJoinPolicy(value?: string): AssociationJoinPolicy {
  const normalized = (value ?? "OPEN").toUpperCase().replace(/\s+/g, "_");
  if (normalized === "REQUEST" || normalized === "INVITE_ONLY" || normalized === "OPEN") {
    return normalized;
  }
  if (normalized === "APPROVAL_REQUIRED") return "REQUEST";
  return "OPEN";
}

function normalizeVisibility(value?: string): AssociationVisibility {
  return (value ?? "PUBLIC").toUpperCase() === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Associations() {
  const { toast } = useToast();
  const admin = useAuthStore((state) => state.admin);
  const scopeId = admin?.scopeId ?? "";
  const scopeType = admin?.scopeType ?? null;

  const [associations, setAssociations] = useState<AssociationDetail[]>([]);
  const [associationTypes, setAssociationTypes] = useState<AssociationTypeDefinition[]>([]);
  const [currentCommunityName, setCurrentCommunityName] = useState<string>("your community");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  const [createForm, setCreateForm] = useState<AssociationFormState>(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);

  const [selectedAssociationId, setSelectedAssociationId] = useState<string | null>(null);
  const [selectedAssociation, setSelectedAssociation] = useState<AssociationDetail | null>(null);
  const [detailStats, setDetailStats] = useState<AssociationStats | null>(null);
  const [detailMembers, setDetailMembers] = useState<AssociationMember[]>([]);
  const [detailPending, setDetailPending] = useState<AssociationPendingRequest[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");

  const [linkSearch, setLinkSearch] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResults, setLinkResults] = useState<AssociationDetail[]>([]);

  const canCreate = scopeType === "COMMUNITY" || scopeType === "PLATFORM";
  const canLinkCommunity = scopeType === "COMMUNITY" && Boolean(scopeId);

  const fetchAssociations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (scopeType === "ASSOCIATION" && scopeId) {
        const detail = await getAssociation(scopeId);
        setAssociations([detail]);
      } else if (scopeType === "COMMUNITY" && scopeId) {
        const [community, linkedAssociations] = await Promise.all([
          getCommunity(scopeId).catch(() => null),
          getCommunityAssociations(scopeId),
        ]);

        if (community?.name) {
          setCurrentCommunityName(community.name);
        }

        const detailedAssociations = await Promise.all(
          linkedAssociations.map(async (association) => {
            try {
              return await getAssociation(association.id);
            } catch {
              return {
                id: association.id,
                name: association.name,
                description: association.description ?? null,
                joinPolicy: normalizeJoinPolicy(association.joinPolicy),
                visibility: normalizeVisibility(association.visibility),
                defaultGroupId: "",
                memberCount: 0,
                avatarUrl: association.avatarUrl ?? null,
                createdAt: association.createdAt,
                updatedAt: null,
              } satisfies AssociationDetail;
            }
          }),
        );

        setAssociations(detailedAssociations);
      } else if (scopeType === "PLATFORM") {
        const results = await searchAssociations({ page: 1, limit: 50 });
        const detailedAssociations = await Promise.all(
          results.associations.map((association) => getAssociation(association.id)),
        );
        setAssociations(detailedAssociations);
      } else {
        setAssociations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load associations");
    } finally {
      setLoading(false);
    }
  }, [scopeId, scopeType]);

  const fetchAssociationTypes = useCallback(async () => {
    try {
      const types = await listAssociationTypes();
      setAssociationTypes(types);
      setCreateForm((prev) => ({
        ...prev,
        associationTypeId: prev.associationTypeId || types[0]?.id || "",
      }));
    } catch {
      setAssociationTypes([]);
    }
  }, []);

  useEffect(() => {
    void Promise.all([fetchAssociations(), fetchAssociationTypes()]);
  }, [fetchAssociations, fetchAssociationTypes]);

  const loadAssociationDetail = useCallback(async (associationId: string) => {
    setDetailLoading(true);
    try {
      const [detail, stats, members, pending] = await Promise.all([
        getAssociation(associationId),
        getAssociationStats(associationId).catch(() => null),
        getAssociationMembers(associationId, 1, 20, "ACTIVE").catch(() => ({ members: [], total: 0, page: 1 })),
        getPendingMembershipRequests(associationId).catch(() => ({ requests: [], total: 0 })),
      ]);

      setSelectedAssociationId(associationId);
      setSelectedAssociation(detail);
      setDetailStats(stats);
      setDetailMembers(members.members);
      setDetailPending(pending.requests);
      setEditForm({
        name: detail.name,
        description: detail.description ?? "",
        joinPolicy: detail.joinPolicy,
        visibility: detail.visibility,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load association details",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  const filteredAssociations = useMemo(() => {
    if (!searchQuery.trim()) return associations;
    const query = searchQuery.toLowerCase();
    return associations.filter((association) =>
      association.name.toLowerCase().includes(query) ||
      (association.description ?? "").toLowerCase().includes(query) ||
      association.joinPolicy.toLowerCase().includes(query),
    );
  }, [associations, searchQuery]);

  const resetCreateForm = () => {
    setCreateForm({
      ...initialCreateForm,
      associationTypeId: associationTypes[0]?.id ?? "",
    });
    setCreateAvatarFile(null);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.associationTypeId) {
      toast({
        title: "Validation",
        description: "Name and association type are required.",
        variant: "destructive",
      });
      return;
    }

    if ((createForm.adminEmail && !createForm.adminPassword) || (!createForm.adminEmail && createForm.adminPassword)) {
      toast({
        title: "Validation",
        description: "Association admin email and password must both be provided.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAssociation({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        associationTypeId: createForm.associationTypeId,
        joinPolicy: createForm.joinPolicy,
        visibility: createForm.visibility,
        communityIds: canLinkCommunity ? [scopeId] : undefined,
        associationAdmins: createForm.adminEmail
          ? [{ email: createForm.adminEmail.trim(), password: createForm.adminPassword }]
          : undefined,
      });

      if (createAvatarFile) {
        const upload = await getAssociationAvatarUploadUrl(created.id);
        await uploadFileToSignedUrl(upload.uploadUrl, createAvatarFile, createAvatarFile.type);
        await updateAssociation({ id: created.id, avatarKey: upload.fileKey });
      }

      toast({
        title: "Association created",
        description: `Default group provisioned: ${created.defaultGroupId}`,
      });
      setCreateOpen(false);
      resetCreateForm();
      await fetchAssociations();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create association",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAssociationId) return;

    setSubmitting(true);
    try {
      await updateAssociation({
        id: selectedAssociationId,
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        joinPolicy: editForm.joinPolicy,
        visibility: editForm.visibility,
      });

      if (editAvatarFile) {
        const upload = await getAssociationAvatarUploadUrl(selectedAssociationId);
        await uploadFileToSignedUrl(upload.uploadUrl, editAvatarFile, editAvatarFile.type);
        await updateAssociation({ id: selectedAssociationId, avatarKey: upload.fileKey });
      }

      toast({ title: "Association updated", description: "Changes saved successfully." });
      setEditOpen(false);
      setEditAvatarFile(null);
      await fetchAssociations();
      await loadAssociationDetail(selectedAssociationId);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update association",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchLinkableAssociations = async () => {
    setLinkLoading(true);
    try {
      const results = await searchAssociations({
        query: linkSearch.trim() || undefined,
        page: 1,
        limit: 20,
      });

      const existingIds = new Set(associations.map((association) => association.id));
      const details = await Promise.all(
        results.associations
          .filter((association) => !existingIds.has(association.id))
          .map((association) => getAssociation(association.id)),
      );
      setLinkResults(details);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to search associations",
        variant: "destructive",
      });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleLinkAssociation = async (associationId: string) => {
    if (!scopeId) return;
    setSubmitting(true);
    try {
      await linkAssociation({ associationId, communityId: scopeId });
      toast({ title: "Linked", description: `Association linked to ${currentCommunityName}.` });
      await fetchAssociations();
      await handleSearchLinkableAssociations();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to link association",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkAssociation = async () => {
    if (!scopeId || !selectedAssociationId) return;
    setSubmitting(true);
    try {
      await unlinkAssociation({ associationId: selectedAssociationId, communityId: scopeId });
      toast({ title: "Unlinked", description: "Association unlinked from your community." });
      setUnlinkOpen(false);
      setDetailOpen(false);
      setSelectedAssociation(null);
      await fetchAssociations();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to unlink association",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    if (!selectedAssociationId) return;
    try {
      await approveAssociationMembership({
        entityId: selectedAssociationId,
        entityType: "ASSOCIATION",
        userId,
      });
      toast({ title: "Approved", description: "Membership request approved." });
      await loadAssociationDetail(selectedAssociationId);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to approve membership",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!selectedAssociationId) return;
    try {
      await rejectAssociationMembership({
        entityId: selectedAssociationId,
        entityType: "ASSOCIATION",
        userId,
      });
      toast({ title: "Rejected", description: "Membership request rejected." });
      await loadAssociationDetail(selectedAssociationId);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject membership",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedAssociationId) return;
    try {
      await removeAssociationMember({
        entityId: selectedAssociationId,
        entityType: "ASSOCIATION",
        userId,
        reason: "Removed by admin from association panel",
      });
      toast({ title: "Removed", description: "Member removed from the association." });
      await loadAssociationDetail(selectedAssociationId);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedAssociationId || !inviteUserId.trim()) return;
    try {
      await inviteAssociationMember({
        entityId: selectedAssociationId,
        entityType: "ASSOCIATION",
        userId: inviteUserId.trim(),
      });
      toast({ title: "Invited", description: "Member invitation sent." });
      setInviteUserId("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to invite member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Associations</h1>
          <p className="text-muted-foreground">
            {scopeType === "ASSOCIATION"
              ? "Manage the association scoped to your admin account."
              : `Manage associations linked to ${currentCommunityName}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canLinkCommunity && (
            <Button variant="outline" onClick={() => setLinkOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Existing
            </Button>
          )}
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Association
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search associations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Loading associations…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void fetchAssociations()}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Join Policy</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssociations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No associations found.
                  </TableCell>
                </TableRow>
              )}
              {filteredAssociations.map((association) => (
                <TableRow key={association.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={association.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(association.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{association.name}</p>
                        <p className="line-clamp-1 max-w-[320px] text-xs text-muted-foreground">
                          {association.description ?? "No description"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{association.visibility}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{association.joinPolicy}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{association.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(association.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            void loadAssociationDetail(association.id);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            void loadAssociationDetail(association.id);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        {canLinkCommunity && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedAssociationId(association.id);
                              setSelectedAssociation(association);
                              setUnlinkOpen(true);
                            }}
                          >
                            <Unlink2 className="mr-2 h-4 w-4" />Unlink from Community
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Create Association</DialogTitle>
            <DialogDescription>
              Community admins can create associations in their scope and optionally seed an association admin account.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ghana Engineers Network"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the association..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Association Type *</Label>
                <Select
                  value={createForm.associationTypeId}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, associationTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {associationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={createForm.visibility}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, visibility: value as AssociationVisibility }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((visibility) => (
                      <SelectItem key={visibility} value={visibility}>
                        {visibility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Join Policy</Label>
              <Select
                value={createForm.joinPolicy}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, joinPolicy: value as AssociationJoinPolicy }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOIN_POLICIES.map((policy) => (
                    <SelectItem key={policy} value={policy}>
                      {policy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCreateAvatarFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserPlus className="h-4 w-4" />
                  Optional Association Admin Account
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admin Email</Label>
                    <Input
                      type="email"
                      value={createForm.adminEmail}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="assoc.admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Password</Label>
                    <Input
                      type="password"
                      value={createForm.adminPassword}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="SecurePass123!"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Association
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Edit Association</DialogTitle>
            <DialogDescription>Update the association details in your current scope.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Join Policy</Label>
                <Select
                  value={editForm.joinPolicy}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, joinPolicy: value as AssociationJoinPolicy }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOIN_POLICIES.map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {policy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={editForm.visibility}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, visibility: value as AssociationVisibility }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((visibility) => (
                      <SelectItem key={visibility} value={visibility}>
                        {visibility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Replace Avatar</Label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditAvatarFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[820px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedAssociation?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedAssociation ? getInitials(selectedAssociation.name) : "AS"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedAssociation?.name ?? "Association"}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {selectedAssociation?.defaultGroupId
                    ? `Default group: ${selectedAssociation.defaultGroupId}`
                    : "Association details"}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading association details…
            </div>
          ) : (
            <Tabs defaultValue="overview" className="flex flex-col gap-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="requests">Pending Requests</TabsTrigger>
                <TabsTrigger value="community">Community Link</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{detailStats?.totalMembers ?? selectedAssociation?.memberCount ?? 0}</p><p className="text-sm text-muted-foreground">Total Members</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{detailStats?.activeMembers ?? detailMembers.length}</p><p className="text-sm text-muted-foreground">Active Members</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{detailStats?.pendingRequests ?? detailPending.length}</p><p className="text-sm text-muted-foreground">Pending Requests</p></CardContent></Card>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Join Policy</Label>
                    <p className="font-medium">{selectedAssociation?.joinPolicy ?? "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Visibility</Label>
                    <p className="font-medium">{selectedAssociation?.visibility ?? "—"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                    {selectedAssociation?.description || "No description"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {selectedAssociation?.createdAt ? new Date(selectedAssociation.createdAt).toLocaleString() : "—"}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Invite user by UUID"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                  />
                  <Button onClick={() => void handleInviteMember()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailMembers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            No active members found.
                          </TableCell>
                        </TableRow>
                      )}
                      {detailMembers.map((member) => (
                        <TableRow key={member.userId}>
                          <TableCell className="font-mono text-xs">{member.userId}</TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell><Badge variant="outline">{member.status}</Badge></TableCell>
                          <TableCell>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => void handleRemoveMember(member.userId)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                {detailPending.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    No pending membership requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detailPending.map((request) => (
                      <div key={request.userId} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{request.userId}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested {new Date(request.requestedAt).toLocaleString()}
                          </p>
                          {request.message && (
                            <p className="mt-1 text-sm text-muted-foreground">{request.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => void handleRejectRequest(request.userId)}>
                            Reject
                          </Button>
                          <Button onClick={() => void handleApproveRequest(request.userId)}>
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="community" className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{currentCommunityName}</p>
                      <p className="text-sm text-muted-foreground">
                        {canLinkCommunity
                          ? "This association is currently linked to your community scope."
                          : "Community linking is only available for community-scoped admins."}
                      </p>
                    </div>
                  </div>
                </div>
                {canLinkCommunity && (
                  <Button
                    variant="destructive"
                    onClick={() => setUnlinkOpen(true)}
                    disabled={!selectedAssociationId}
                  >
                    <Unlink2 className="mr-2 h-4 w-4" />
                    Unlink from Community
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            <Button onClick={() => setEditOpen(true)} disabled={!selectedAssociationId}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Link Existing Association</DialogTitle>
            <DialogDescription>
              Search platform associations and link one to {currentCommunityName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search associations..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
              />
              <Button variant="outline" onClick={() => void handleSearchLinkableAssociations()} disabled={linkLoading}>
                {linkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search
              </Button>
            </div>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
              {linkResults.length === 0 && !linkLoading && (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No linkable associations found.
                </div>
              )}
              {linkResults.map((association) => (
                <div key={association.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={association.avatarUrl ?? undefined} />
                      <AvatarFallback>{getInitials(association.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{association.name}</p>
                      <p className="text-sm text-muted-foreground">{association.description ?? "No description"}</p>
                    </div>
                  </div>
                  <Button onClick={() => void handleLinkAssociation(association.id)} disabled={submitting}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Link
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Association</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink {selectedAssociation?.name ?? "this association"} from {currentCommunityName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleUnlinkAssociation()} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
