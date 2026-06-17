import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  EyeOff,
  Pencil,
  Megaphone,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  registry as fetchRegistry,
  registryEntry as fetchEntry,
  pendingRegistryVerification,
  registryBroadcasts,
  registryImportJob,
  uploadAndImportRegistryCsv,
} from "@/services/graphql/registry";
import type {
  Registry,
  RegistryEntrySummary,
  RegistryBroadcast,
  RegistryImportJob,
  RegistryOwnerType,
  RegistryVerificationStatus,
  RegistryMembershipStatus,
  RegistryBroadcastChannel,
} from "@/services/graphql/registry";
import { useRegistryEntries } from "@/hooks/useRegistryEntries";
import { useRegistryActions } from "@/hooks/useRegistryActions";
import { RegistryFormModal } from "@/pages/registries/RegistryFormModal";
import { RegistryEntryFormModal } from "@/pages/registries/RegistryEntryFormModal";
import {
  initialRegistryEntryForm,
  registryToForm,
  entryToForm,
  titleCase,
  formatDateTime,
  VERIFICATION_STATUS_BADGE,
  MEMBERSHIP_STATUS_BADGE,
  type RegistryFormState,
  type RegistryEntryFormState,
} from "@/pages/registries/types";

const VERIFICATION_OPTIONS: RegistryVerificationStatus[] = [
  "UNVERIFIED",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];
const MEMBERSHIP_OPTIONS: RegistryMembershipStatus[] = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
];
const BROADCAST_CHANNELS: RegistryBroadcastChannel[] = ["IN_APP", "EMAIL", "SMS"];

function entryDisplayName(e: RegistryEntrySummary): string {
  return e.fullName?.trim() || e.email?.trim() || e.entryNumber || e.id.slice(0, 8);
}

export default function RegistryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const admin = useAuthStore((s) => s.admin);
  const ownerEntityId = admin?.scopeId ?? "";
  const ownerType: RegistryOwnerType =
    admin?.scopeType?.toUpperCase() === "ASSOCIATION" ? "ASSOCIATION" : "COMMUNITY";

  const [registry, setRegistry] = useState<Registry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("entries");

  const actions = useRegistryActions({ ownerType, ownerEntityId });

  const loadRegistry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await fetchRegistry(id);
      setRegistry(reg);
      if (!reg) setError(t("registries.notFound", "Registry not found"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registry");
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry]);

  if (!id) {
    return <div className="text-sm text-muted-foreground">Invalid registry id.</div>;
  }

  if (loading && !registry) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("registries.loading", "Loading registry…")}
      </div>
    );
  }

  if (error || !registry) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/registries")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("registries.backToList", "Back to registries")}
        </Button>
        <div className="text-destructive text-sm">
          {error ?? t("registries.notFound", "Registry not found")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/registries")}
          className="-ml-2 mb-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("registries.backToList", "Back to registries")}
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {registry.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary">{registry.code}</Badge>
              <Badge variant="secondary">{titleCase(registry.status)}</Badge>
              {registry.registryType && (
                <span className="text-sm text-muted-foreground">
                  {registry.registryType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="entries">{t("registries.tabEntries", "Entries")}</TabsTrigger>
          <TabsTrigger value="pending">
            {t("registries.tabPending", "Pending Verification")}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">
            {t("registries.tabBroadcasts", "Broadcasts")}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {t("registries.tabSettings", "Settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <EntriesTab
            registry={registry}
            ownerType={ownerType}
            ownerEntityId={ownerEntityId}
            actions={actions}
          />
        </TabsContent>

        <TabsContent value="pending">
          <PendingTab
            registry={registry}
            ownerType={ownerType}
            ownerEntityId={ownerEntityId}
            actions={actions}
          />
        </TabsContent>

        <TabsContent value="broadcasts">
          <BroadcastsTab registry={registry} actions={actions} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab registry={registry} actions={actions} onUpdated={loadRegistry} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Actions = ReturnType<typeof useRegistryActions>;

// ── Entries tab ────────────────────────────────────────────────────────────

function EntriesTab({
  registry,
  ownerType,
  ownerEntityId,
  actions,
}: {
  registry: Registry;
  ownerType: RegistryOwnerType;
  ownerEntityId: string;
  actions: Actions;
}) {
  const { t } = useTranslation();
  const {
    entries,
    loading,
    error,
    page,
    hasNextPage,
    searchTerm,
    verificationFilter,
    membershipFilter,
    setSearchTerm,
    setVerificationFilter,
    setMembershipFilter,
    setPage,
    refetch,
  } = useRegistryEntries({ registryId: registry.id, ownerType, ownerEntityId });

  const [submitting, setSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addForm, setAddForm] = useState<RegistryEntryFormState>(initialRegistryEntryForm);
  const [editForm, setEditForm] = useState<RegistryEntryFormState>(initialRegistryEntryForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const withSubmitting = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await fn();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = () =>
    void withSubmitting(async () => {
      const created = await actions.addEntryHandler(registry.id, addForm);
      if (created) {
        setAddForm(initialRegistryEntryForm);
        setAddOpen(false);
        await refetch();
      }
    });

  const handleOpenEdit = async (entryId: string) => {
    const full = await fetchEntry(entryId);
    if (!full) return;
    setEditingId(full.id);
    setEditForm(entryToForm(full));
    setEditOpen(true);
  };

  const handleSaveEdit = () =>
    void withSubmitting(async () => {
      if (!editingId) return;
      const updated = await actions.updateEntryHandler(editingId, editForm);
      if (updated) {
        setEditOpen(false);
        setEditingId(null);
        await refetch();
      }
    });

  const runAndRefetch = (fn: () => Promise<unknown>) =>
    void fn().then(() => refetch());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("registries.searchEntries", "Search entries…")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select
            value={verificationFilter}
            onValueChange={(v) =>
              setVerificationFilter(v as RegistryVerificationStatus | "ALL")
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("registries.allVerification", "All verification")}</SelectItem>
              {VERIFICATION_OPTIONS.map((v) => (
                <SelectItem key={v} value={v}>
                  {titleCase(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={membershipFilter}
            onValueChange={(v) =>
              setMembershipFilter(v as RegistryMembershipStatus | "ALL")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("registries.allMembership", "All membership")}</SelectItem>
              {MEMBERSHIP_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {titleCase(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("registries.addEntry", "Add Entry")}
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("registries.entryName", "Name")}</TableHead>
              <TableHead>{t("registries.email", "Email")}</TableHead>
              <TableHead>{t("registries.country", "Country")}</TableHead>
              <TableHead>{t("registries.verification", "Verification")}</TableHead>
              <TableHead>{t("registries.membership", "Membership")}</TableHead>
              <TableHead>{t("registries.directory", "Directory")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  {t("registries.loading", "Loading…")}
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {t("registries.noEntries", "No entries found.")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{entryDisplayName(e)}</TableCell>
                  <TableCell className="text-muted-foreground">{e.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.country ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={VERIFICATION_STATUS_BADGE[e.verificationStatus] ?? ""}
                    >
                      {titleCase(e.verificationStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={MEMBERSHIP_STATUS_BADGE[e.membershipStatus] ?? ""}
                    >
                      {titleCase(e.membershipStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.directoryVisible ? t("common.yes", "Yes") : t("common.no", "No")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void handleOpenEdit(e.id)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("common.edit", "Edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => runAndRefetch(() => actions.verifyEntryHandler(e.id))}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("registries.verify", "Verify")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => runAndRefetch(() => actions.rejectEntryHandler(e.id))}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("registries.reject", "Reject")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => runAndRefetch(() => actions.suspendEntryHandler(e.id))}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {t("registries.suspend", "Suspend")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            runAndRefetch(() =>
                              actions.changeMembershipStatusHandler(e.id, "ACTIVE"),
                            )
                          }
                        >
                          {t("registries.setActive", "Set Active")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            runAndRefetch(() =>
                              actions.changeMembershipStatusHandler(e.id, "INACTIVE"),
                            )
                          }
                        >
                          {t("registries.setInactive", "Set Inactive")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            runAndRefetch(() =>
                              actions.setDirectoryVisibilityHandler(
                                e.id,
                                !e.directoryVisible,
                              ),
                            )
                          }
                        >
                          {e.directoryVisible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              {t("registries.hideDirectory", "Hide from directory")}
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("registries.showDirectory", "Show in directory")}
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("registries.page", "Page")} {page + 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage(Math.max(0, page - 1))}
          >
            {t("common.previous", "Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage || loading}
            onClick={() => setPage(page + 1)}
          >
            {t("common.next", "Next")}
          </Button>
        </div>
      </div>

      <RegistryEntryFormModal
        mode="create"
        open={addOpen}
        registry={registry}
        form={addForm}
        submitting={submitting}
        onChange={setAddForm}
        onSubmit={handleAdd}
        onClose={() => setAddOpen(false)}
      />
      <RegistryEntryFormModal
        mode="edit"
        open={editOpen}
        registry={registry}
        form={editForm}
        submitting={submitting}
        onChange={setEditForm}
        onSubmit={handleSaveEdit}
        onClose={() => {
          setEditOpen(false);
          setEditingId(null);
        }}
      />
    </div>
  );
}

// ── Pending verification tab ─────────────────────────────────────────────────

function PendingTab({
  registry,
  ownerType,
  ownerEntityId,
  actions,
}: {
  registry: Registry;
  ownerType: RegistryOwnerType;
  ownerEntityId: string;
  actions: Actions;
}) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<RegistryEntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await pendingRegistryVerification(ownerType, ownerEntityId, {
        registryId: registry.id,
        limit: 100,
      });
      setEntries(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending entries");
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerEntityId, registry.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const act = (fn: () => Promise<unknown>) => void fn().then(() => reload());

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("registries.loading", "Loading…")}
      </div>
    );
  }

  if (error) return <div className="text-destructive text-sm">{error}</div>;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("registries.noPending", "Nothing awaiting verification.")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("registries.entryName", "Name")}</TableHead>
            <TableHead>{t("registries.email", "Email")}</TableHead>
            <TableHead>{t("registries.country", "Country")}</TableHead>
            <TableHead>{t("registries.submitted", "Submitted")}</TableHead>
            <TableHead className="text-right">{t("registries.actionsLabel", "Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{entryDisplayName(e)}</TableCell>
              <TableCell className="text-muted-foreground">{e.email ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{e.country ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(e.createdAt)}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => act(() => actions.verifyEntryHandler(e.id))}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t("registries.verify", "Verify")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => act(() => actions.rejectEntryHandler(e.id))}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("registries.reject", "Reject")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Broadcasts tab ───────────────────────────────────────────────────────────

function BroadcastsTab({
  registry,
  actions,
}: {
  registry: Registry;
  actions: Actions;
}) {
  const { t } = useTranslation();
  const [broadcasts, setBroadcasts] = useState<RegistryBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<RegistryBroadcastChannel[]>(["IN_APP"]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBroadcasts(await registryBroadcasts(registry.id, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }, [registry.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleChannel = (ch: RegistryBroadcastChannel, checked: boolean) =>
    setChannels((prev) =>
      checked ? [...prev, ch] : prev.filter((c) => c !== ch),
    );

  const handleSend = () => {
    setSubmitting(true);
    void actions
      .sendBroadcastHandler({
        registryId: registry.id,
        title,
        body,
        channels: channels.length > 0 ? channels : undefined,
      })
      .then((result) => {
        if (result) {
          setOpen(false);
          setTitle("");
          setBody("");
          setChannels(["IN_APP"]);
          void reload();
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {t("registries.broadcastsTitle", "Targeted Broadcasts")}
        </h3>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Megaphone className="h-4 w-4 mr-2" />
          {t("registries.sendBroadcast", "Send Broadcast")}
        </Button>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("registries.loading", "Loading…")}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("registries.noBroadcasts", "No broadcasts sent yet.")}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("registries.broadcastTitle", "Title")}</TableHead>
                <TableHead>{t("registries.channels", "Channels")}</TableHead>
                <TableHead>{t("registries.recipients", "Recipients")}</TableHead>
                <TableHead>{t("registries.sentAt", "Sent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.channels.map(titleCase).join(", ")}
                  </TableCell>
                  <TableCell>{b.recipientCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(b.sentAt ?? b.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t("registries.sendBroadcast", "Send Broadcast")}
            </DialogTitle>
            <DialogDescription>
              {t("registries.broadcastHint", "Notify entries across the selected channels.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bc-title">{t("registries.broadcastTitle", "Title")} *</Label>
              <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bc-body">{t("registries.broadcastBody", "Message")} *</Label>
              <Textarea
                id="bc-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registries.channels", "Channels")}</Label>
              <div className="flex gap-4">
                {BROADCAST_CHANNELS.map((ch) => (
                  <div key={ch} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bc-ch-${ch}`}
                      checked={channels.includes(ch)}
                      onCheckedChange={(c) => toggleChannel(ch, c === true)}
                    />
                    <Label htmlFor={`bc-ch-${ch}`} className="cursor-pointer font-normal">
                      {titleCase(ch)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="outline" onClick={handleSend} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("registries.sendBroadcast", "Send Broadcast")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  registry,
  actions,
  onUpdated,
}: {
  registry: Registry;
  actions: Actions;
  onUpdated: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<RegistryFormState>(() =>
    registryToForm(registry),
  );
  const [submitting, setSubmitting] = useState(false);

  // CSV import state
  const [importing, setImporting] = useState(false);
  const [job, setJob] = useState<RegistryImportJob | null>(null);
  const [jobRefreshing, setJobRefreshing] = useState(false);

  const handleSaveEdit = () => {
    setSubmitting(true);
    void actions
      .updateRegistryHandler(registry.id, editForm)
      .then((updated) => {
        if (updated) {
          setEditOpen(false);
          void onUpdated();
        }
      })
      .finally(() => setSubmitting(false));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    void uploadAndImportRegistryCsv(registry.id, file)
      .then((created) => {
        setJob(created);
        toast({
          title: t("registries.importStarted", "Import started"),
          description: `${t("registries.jobStatus", "Status")}: ${created.status}`,
        });
      })
      .catch((err: unknown) => {
        toast({
          title: t("registries.importFailed", "Import failed"),
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      })
      .finally(() => setImporting(false));
  };

  const refreshJob = () => {
    if (!job) return;
    setJobRefreshing(true);
    void registryImportJob(job.id, registry.id)
      .then((latest) => {
        if (latest) setJob(latest);
      })
      .finally(() => setJobRefreshing(false));
  };

  return (
    <div className="space-y-6">
      {/* Edit registry */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {t("registries.registrySettings", "Registry Settings")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("registries.editHint", "Update name, description, fields and flags.")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditForm(registryToForm(registry));
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit", "Edit")}
          </Button>
        </div>
      </div>

      {/* CSV bulk import */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">
            {t("registries.bulkImport", "Bulk Import (CSV)")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "registries.bulkImportHint",
              "Upload a CSV to create entries in bulk. A background job processes the file.",
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t("registries.chooseCsv", "Choose CSV…")}
          </Label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
          />
        </div>

        {job && (
          <div className="rounded-md bg-muted/40 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("registries.jobStatus", "Status")}:{" "}
                <Badge variant="secondary">{titleCase(job.status)}</Badge>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshJob}
                disabled={jobRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${jobRefreshing ? "animate-spin" : ""}`}
                />
                {t("common.refresh", "Refresh")}
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-muted-foreground">
              <span>{t("registries.jobTotal", "Total")}: {job.total}</span>
              <span>{t("registries.jobProcessed", "Processed")}: {job.processed}</span>
              <span className="text-success">
                {t("registries.jobSucceeded", "Succeeded")}: {job.succeeded}
              </span>
              <span className="text-destructive">
                {t("registries.jobFailed", "Failed")}: {job.failed}
              </span>
            </div>
            {job.errorsJson && (
              <pre className="max-h-32 overflow-auto rounded bg-background p-2 text-xs text-destructive">
                {job.errorsJson}
              </pre>
            )}
          </div>
        )}
      </div>

      <RegistryFormModal
        mode="edit"
        open={editOpen}
        form={editForm}
        submitting={submitting}
        onChange={setEditForm}
        onSubmit={handleSaveEdit}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
