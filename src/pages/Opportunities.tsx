import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, X,
  Download, Users, Loader2, AlertCircle, Send,
} from "lucide-react";
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
  DialogTrigger,
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
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  publishOpportunity,
  closeOpportunity,
} from "@/services/graphql/opportunities";
import type {
  OpportunityType,
  OpportunityTypeEnum,
  OpportunityStatusEnum,
  OpportunityCategoryEnum,
  VisibilityEnum,
  ApplicationMethodEnum,
} from "@/services/graphql/opportunities";

// Map API type enum → UI label
const TYPE_LABELS: Record<OpportunityTypeEnum, string> = {
  EMPLOYMENT:  "Employment",
  SCHOLARSHIP: "Scholarship",
  INVESTMENT:  "Investment",
  FELLOWSHIP:  "Fellowship",
  INITIATIVE:  "Initiative",
  GRANT:       "Grant",
  PROGRAM:     "Program",
  VOLUNTEER:   "Volunteer",
  CONTRACT:    "Contract",
};

const typeColors: Record<string, string> = {
  EMPLOYMENT:  "bg-blue-500/10 text-blue-400",
  CONTRACT:    "bg-blue-500/10 text-blue-400",
  VOLUNTEER:   "bg-green-500/10 text-green-400",
  SCHOLARSHIP: "bg-purple-500/10 text-purple-400",
  FELLOWSHIP:  "bg-purple-500/10 text-purple-400",
  GRANT:       "bg-primary/10 text-primary",
  INVESTMENT:  "bg-primary/10 text-primary",
  INITIATIVE:  "bg-secondary text-secondary-foreground",
  PROGRAM:     "bg-secondary text-secondary-foreground",
};

const statusColors: Record<OpportunityStatusEnum, string> = {
  PUBLISHED: "bg-success/10 text-success",
  DRAFT:     "bg-muted text-muted-foreground",
  CLOSED:    "bg-secondary text-secondary-foreground",
  ARCHIVED:  "bg-secondary text-secondary-foreground",
};

interface CreateForm {
  title: string;
  description: string;
  type: OpportunityTypeEnum;
  category: OpportunityCategoryEnum;
  visibility: VisibilityEnum;
  applicationMethod: ApplicationMethodEnum;
  externalLink: string;
  applicationEmail: string;
  deadline: string;
  skills: string;
  requirements: string;
  responsibilities: string;
}

const initialCreateForm: CreateForm = {
  title: "",
  description: "",
  type: "EMPLOYMENT",
  category: "EMPLOYMENT_CAREER",
  visibility: "PUBLIC",
  applicationMethod: "IN_PLATFORM_FORM",
  externalLink: "",
  applicationEmail: "",
  deadline: "",
  skills: "",
  requirements: "",
  responsibilities: "",
};

function buildOpportunityUpdateInput(form: Partial<CreateForm>) {
  const input: Record<string, unknown> = {};

  if (form.title?.trim()) input.title = form.title.trim();
  if (form.description?.trim()) input.description = form.description.trim();
  if (form.responsibilities?.trim()) input.responsibilities = form.responsibilities.trim();
  if (form.requirements?.trim()) input.requirements = form.requirements.trim();
  if (form.deadline) input.deadline = form.deadline;
  if (form.skills?.trim()) {
    input.skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (form.applicationMethod) {
    input.applicationMethod = form.applicationMethod;

    if (form.applicationMethod === "EXTERNAL_LINK") {
      if (!form.externalLink?.trim()) {
        throw new Error("External link is required");
      }
      input.externalLink = form.externalLink.trim();
    }

    if (form.applicationMethod === "EMAIL_REQUEST") {
      if (!form.applicationEmail?.trim()) {
        throw new Error("Application email is required");
      }
      input.applicationEmail = form.applicationEmail.trim();
    }
  }

  return input;
}

export default function Opportunities() {
  const { t } = useTranslation();
  const location = useLocation();
  const admin = useAuthStore((s) => s.admin);
  const scopeId = admin?.scopeId ?? "";

  const [opportunities, setOpportunities] = useState<OpportunityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<OpportunityType | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [editForm, setEditForm] = useState<Partial<CreateForm>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    if (!scopeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listOpportunities({
        ownerType: "COMMUNITY",
        ownerId: scopeId,
        limit: 100,
        offset: 0,
      });
      setOpportunities(result.opportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, [scopeId]);

  useEffect(() => {
    void fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredOpportunities = opportunities.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleView = (opp: OpportunityType) => {
    setSelectedOpp(opp);
    setViewModalOpen(true);
  };

  const handleEdit = (opp: OpportunityType) => {
    if (opp.status === "PUBLISHED") {
      toast({
        title: "Close before editing",
        description: "Published opportunities must be closed before they can be edited.",
        variant: "destructive",
      });
      return;
    }

    setSelectedOpp(opp);
    setEditForm({
      title: opp.title,
      description: opp.description,
      applicationMethod: opp.applicationMethod,
      externalLink: opp.externalLink ?? "",
      applicationEmail: opp.applicationEmail ?? "",
      deadline: opp.deadline ?? "",
      skills: opp.skills.join(", "),
      requirements: opp.requirements ?? "",
      responsibilities: opp.responsibilities ?? "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (opp: OpportunityType) => {
    setSelectedOpp(opp);
    setDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    if (!scopeId) return;
    if (!createForm.title.trim() || !createForm.description.trim()) {
      toast({ title: "Validation", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    if (createForm.applicationMethod === "EXTERNAL_LINK" && !createForm.externalLink.trim()) {
      toast({ title: "Validation", description: "External link is required.", variant: "destructive" });
      return;
    }
    if (createForm.applicationMethod === "EMAIL_REQUEST" && !createForm.applicationEmail.trim()) {
      toast({ title: "Validation", description: "Application email is required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await createOpportunity({
        ownerType: "COMMUNITY",
        ownerId: scopeId,
        type: createForm.type,
        category: createForm.category,
        title: createForm.title,
        description: createForm.description,
        visibility: createForm.visibility,
        applicationMethod: createForm.applicationMethod,
        externalLink:
          createForm.applicationMethod === "EXTERNAL_LINK"
            ? createForm.externalLink.trim()
            : undefined,
        applicationEmail:
          createForm.applicationMethod === "EMAIL_REQUEST"
            ? createForm.applicationEmail.trim()
            : undefined,
        deadline: createForm.deadline || undefined,
        skills: createForm.skills
          ? createForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        requirements: createForm.requirements || undefined,
        responsibilities: createForm.responsibilities || undefined,
      });
      toast({ title: "Created", description: "Opportunity created as draft. Publishing…" });
      await publishOpportunity(created.id);
      toast({ title: "Published", description: "Opportunity is now live." });
      setCreateForm(initialCreateForm);
      setCreateModalOpen(false);
      void fetchOpportunities();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create opportunity",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedOpp) return;
    setSubmitting(true);
    try {
      await updateOpportunity(selectedOpp.id, buildOpportunityUpdateInput(editForm));
      toast({ title: "Saved", description: "Opportunity updated." });
      setEditModalOpen(false);
      setSelectedOpp(null);
      void fetchOpportunities();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseOpportunity = async (opp: OpportunityType) => {
    try {
      await closeOpportunity(opp.id, "Closed by community admin from admin dashboard");
      toast({ title: "Closed", description: `"${opp.title}" has been closed.` });
      void fetchOpportunities();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to close",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedOpp) return;
    setSubmitting(true);
    try {
      await deleteOpportunity(selectedOpp.id);
      toast({ title: "Deleted", description: "Opportunity deleted." });
      setDeleteModalOpen(false);
      setSelectedOpp(null);
      setOpportunities((prev) => prev.filter((o) => o.id !== selectedOpp.id));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (opp: OpportunityType) => {
    try {
      await publishOpportunity(opp.id);
      toast({ title: "Published", description: `"${opp.title}" is now live.` });
      void fetchOpportunities();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to publish",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("opportunities.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("opportunities.subtitle")}</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Opportunity</DialogTitle>
              <DialogDescription>Create a draft opportunity, then publish it.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Enter opportunity title..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm({ ...createForm, type: v as OpportunityTypeEnum })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABELS) as OpportunityTypeEnum[]).map((k) => (
                        <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application Method</Label>
                  <Select
                    value={createForm.applicationMethod}
                    onValueChange={(v) => setCreateForm({
                      ...createForm,
                      applicationMethod: v as ApplicationMethodEnum,
                      externalLink: v === "EXTERNAL_LINK" ? createForm.externalLink : "",
                      applicationEmail: v === "EMAIL_REQUEST" ? createForm.applicationEmail : "",
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PLATFORM_FORM">In-Platform Form</SelectItem>
                      <SelectItem value="EXTERNAL_LINK">External Link</SelectItem>
                      <SelectItem value="EMAIL_REQUEST">Email Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {createForm.applicationMethod === "EXTERNAL_LINK" && (
                <div className="space-y-2">
                  <Label>External Application Link *</Label>
                  <Input
                    placeholder="https://apply.example.com"
                    value={createForm.externalLink}
                    onChange={(e) => setCreateForm({ ...createForm, externalLink: e.target.value })}
                  />
                </div>
              )}
              {createForm.applicationMethod === "EMAIL_REQUEST" && (
                <div className="space-y-2">
                  <Label>Application Email *</Label>
                  <Input
                    type="email"
                    placeholder="jobs@example.com"
                    value={createForm.applicationEmail}
                    onChange={(e) => setCreateForm({ ...createForm, applicationEmail: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={createForm.visibility}
                    onValueChange={(v) => setCreateForm({ ...createForm, visibility: v as VisibilityEnum })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="COMMUNITY_ONLY">Community Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skills (comma-separated)</Label>
                <Input
                  placeholder="e.g. TypeScript, React, GraphQL"
                  value={createForm.skills}
                  onChange={(e) => setCreateForm({ ...createForm, skills: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the opportunity..."
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Requirements</Label>
                <Textarea
                  placeholder="List requirements..."
                  rows={3}
                  value={createForm.requirements}
                  onChange={(e) => setCreateForm({ ...createForm, requirements: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsibilities</Label>
                <Textarea
                  placeholder="List responsibilities..."
                  rows={3}
                  value={createForm.responsibilities}
                  onChange={(e) => setCreateForm({ ...createForm, responsibilities: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Create & Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
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

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading opportunities…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void fetchOpportunities()}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-32 text-center">Applications</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-28">Deadline</TableHead>
                <TableHead className="w-28">Created</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No opportunities found.
                  </TableCell>
                </TableRow>
              )}
              {filteredOpportunities.map((opp) => (
                <TableRow key={opp.id} className="group">
                  <TableCell className="font-medium text-foreground">{opp.title}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[opp.type] ?? "bg-secondary text-secondary-foreground"}>
                      {TYPE_LABELS[opp.type] ?? opp.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{opp.applicationCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[opp.status]}>
                      {opp.status.charAt(0) + opp.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {opp.deadline ? new Date(opp.deadline).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(opp.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(opp)} className="text-foreground">
                          <Eye className="h-4 w-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(opp)} className="text-foreground">
                          <Edit className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        {opp.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => void handlePublish(opp)} className="text-foreground">
                            <Send className="h-4 w-4 mr-2" />Publish
                          </DropdownMenuItem>
                        )}
                        {opp.status === "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => void handleCloseOpportunity(opp)} className="text-foreground">
                            <X className="h-4 w-4 mr-2" />Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-foreground">
                          <Users className="h-4 w-4 mr-2" />View Applicants
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground">
                          <Download className="h-4 w-4 mr-2" />Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(opp)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Delete
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

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedOpp?.title}</DialogTitle>
            <DialogDescription>
              Created {selectedOpp ? new Date(selectedOpp.createdAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={typeColors[selectedOpp?.type ?? "EMPLOYMENT"] ?? ""}>
                {selectedOpp ? TYPE_LABELS[selectedOpp.type] : ""}
              </Badge>
              <Badge className={statusColors[selectedOpp?.status ?? "DRAFT"]}>
                {selectedOpp ? selectedOpp.status.charAt(0) + selectedOpp.status.slice(1).toLowerCase() : ""}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedOpp?.applicationCount} applications</span>
              </div>
            </div>
            <p className="text-foreground whitespace-pre-line">{selectedOpp?.description}</p>
            {selectedOpp?.requirements && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Requirements</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedOpp.requirements}</p>
              </div>
            )}
            {selectedOpp?.responsibilities && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Responsibilities</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedOpp.responsibilities}</p>
              </div>
            )}
            {selectedOpp?.skills && selectedOpp.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedOpp.skills.map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            )}
            {selectedOpp?.deadline && (
              <p className="text-sm text-muted-foreground">
                Deadline: {new Date(selectedOpp.deadline).toLocaleDateString()}
              </p>
            )}
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
            <DialogTitle className="font-display">Edit Opportunity</DialogTitle>
            <DialogDescription>Make changes to this opportunity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title ?? ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Application Method</Label>
              <Select
                value={editForm.applicationMethod ?? "IN_PLATFORM_FORM"}
                onValueChange={(v) => setEditForm({
                  ...editForm,
                  applicationMethod: v as ApplicationMethodEnum,
                  externalLink: v === "EXTERNAL_LINK" ? editForm.externalLink ?? "" : "",
                  applicationEmail: v === "EMAIL_REQUEST" ? editForm.applicationEmail ?? "" : "",
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PLATFORM_FORM">In-Platform Form</SelectItem>
                  <SelectItem value="EXTERNAL_LINK">External Link</SelectItem>
                  <SelectItem value="EMAIL_REQUEST">Email Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.applicationMethod === "EXTERNAL_LINK" && (
              <div className="space-y-2">
                <Label>External Application Link *</Label>
                <Input
                  placeholder="https://apply.example.com"
                  value={editForm.externalLink ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, externalLink: e.target.value })}
                />
              </div>
            )}
            {editForm.applicationMethod === "EMAIL_REQUEST" && (
              <div className="space-y-2">
                <Label>Application Email *</Label>
                <Input
                  type="email"
                  placeholder="jobs@example.com"
                  value={editForm.applicationEmail ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, applicationEmail: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={editForm.deadline ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Skills (comma-separated)</Label>
                <Input
                  placeholder="e.g. TypeScript, React"
                  value={editForm.skills ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea
                value={editForm.requirements ?? ""}
                onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea
                value={editForm.responsibilities ?? ""}
                onChange={(e) => setEditForm({ ...editForm, responsibilities: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="outline" onClick={saveEdit} disabled={submitting}>
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
            <DialogTitle className="font-display text-destructive">Delete Opportunity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedOpp?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
