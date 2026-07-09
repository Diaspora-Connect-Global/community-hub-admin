import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Plus,
  Search,
  Shield,
  UserCog,
  X,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  COMMUNITY_ADMIN_TYPES,
  roleTypeLabel,
  type AdminRoleTypeOption,
} from "@/constants/adminPermissions";
import { useAuthStore } from "@/stores/authStore";
import { filterAssignableRoleTypes } from "@/lib/adminAccess";
import {
  listAdmins,
  createAdmin,
  getAdminById,
  getRoleDefinitions,
  assignAdminRole,
  revokeAdminRole,
  updateAdminStatus,
  type AdminAccount,
  type AdminRoleAssignment,
  type RoleDefinition,
} from "@/services/graphql/admin-management";

interface AdminsTabProps {
  communityId: string;
}

/**
 * Human-readable name for a single role assignment. Custom-role assignments
 * carry a `roleDefinitionId`; resolve it against the loaded role definitions and
 * show the custom role's name instead of the raw "CUSTOM" role type.
 */
function assignmentRoleName(
  r: AdminRoleAssignment,
  roleDefs: RoleDefinition[],
): string {
  if (r.roleDefinitionId) {
    const def = roleDefs.find((d) => d.id === r.roleDefinitionId);
    if (def) return def.name;
  }
  return roleTypeLabel(r.roleType);
}

/** True when the admin has at least one role scoped to this community. */
function belongsToCommunity(admin: AdminAccount, communityId: string): boolean {
  return admin.roles.some(
    (r) => r.scopeType === "COMMUNITY" && r.scopeId === communityId,
  );
}

/** Merge an admin into the list, replacing any existing entry with the same id. */
function upsertAdmin(list: AdminAccount[], admin: AdminAccount): AdminAccount[] {
  const idx = list.findIndex((a) => a.id === admin.id);
  if (idx === -1) return [admin, ...list];
  const next = [...list];
  next[idx] = admin;
  return next;
}

export function AdminsTab({ communityId }: AdminsTabProps) {
  const { t } = useTranslation();
  const authAdmin = useAuthStore((s) => s.admin);
  const claims = useAuthStore((s) => s.claims);
  // No privilege escalation: only offer role types at or below the current
  // admin's own highest-held role.
  const assignableRoleTypes = filterAssignableRoleTypes(
    COMMUNITY_ADMIN_TYPES,
    claims,
    authAdmin,
  );

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AdminAccount | null>(null);

  // Role definitions for this community. Used to (a) offer custom roles in the
  // assign dialog and (b) resolve custom-role names when displaying assignments.
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>([]);

  const fetchAdmins = async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listAdmins({ limit: 100 });
      const scoped = (res.admins ?? []).filter((a) =>
        belongsToCommunity(a, communityId),
      );
      setAdmins(scoped);
    } catch (err) {
      // listAdmins may be unavailable to community admins — degrade gracefully
      // to the manual "look up by ID" + session-created flow rather than blocking.
      setError((err as Error).message ?? t("rolesAdmins.errors.loadAdmins"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  useEffect(() => {
    if (!communityId) return;
    let active = true;
    void (async () => {
      try {
        const res = await getRoleDefinitions("COMMUNITY", communityId);
        if (!active) return;
        // Strict scope isolation: only surface roles belonging to THIS community.
        setRoleDefs(
          (res.roles ?? []).filter(
            (r) => r.scopeType === "COMMUNITY" && r.scopeId === communityId,
          ),
        );
      } catch {
        /* best-effort: custom roles simply won't be offered */
      }
    })();
    return () => {
      active = false;
    };
  }, [communityId]);

  const refreshAdmin = async (adminId: string) => {
    try {
      const res = await getAdminById(adminId);
      if (res.success && res.admin) {
        setAdmins((prev) => upsertAdmin(prev, res.admin as AdminAccount));
      }
    } catch {
      /* best-effort refresh */
    }
  };

  const handleLookup = async () => {
    const id = lookupId.trim();
    if (!id) return;
    setLookingUp(true);
    try {
      const res = await getAdminById(id);
      if (res.success && res.admin) {
        setAdmins((prev) => upsertAdmin(prev, res.admin as AdminAccount));
        setLookupId("");
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.lookup"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.lookup"));
    } finally {
      setLookingUp(false);
    }
  };

  const handleRevoke = async (admin: AdminAccount, assignmentId: string) => {
    setRowBusy(admin.id);
    try {
      const res = await revokeAdminRole(assignmentId);
      if (res.success) {
        toast.success(res.message ?? t("rolesAdmins.admins.roleRevoked"));
        await refreshAdmin(admin.id);
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.revoke"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.revoke"));
    } finally {
      setRowBusy(null);
    }
  };

  const handleToggleStatus = async (admin: AdminAccount) => {
    const nextStatus = admin.status?.toLowerCase() === "active" ? "inactive" : "active";
    setRowBusy(admin.id);
    try {
      const res = await updateAdminStatus({ adminId: admin.id, status: nextStatus });
      if (res.success) {
        toast.success(res.message ?? t("rolesAdmins.admins.statusUpdated"));
        await refreshAdmin(admin.id);
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.status"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.status"));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("rolesAdmins.admins.description")}
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("rolesAdmins.admins.create")}
        </Button>
      </div>

      {/* Manual lookup by ID — fallback path when no scoped list is available */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("rolesAdmins.admins.lookupPlaceholder")}
            className="pl-10"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLookup();
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleLookup}
          disabled={lookingUp || !lookupId.trim()}
        >
          {lookingUp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("rolesAdmins.admins.lookup")}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("common.loading")}
        </div>
      ) : admins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCog className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground max-w-md">
              {t("rolesAdmins.admins.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("rolesAdmins.admins.columns.admin")}</TableHead>
                <TableHead className="w-40">
                  {t("rolesAdmins.admins.columns.type")}
                </TableHead>
                <TableHead>{t("rolesAdmins.admins.columns.roles")}</TableHead>
                <TableHead className="w-24">
                  {t("rolesAdmins.admins.columns.status")}
                </TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const communityRoles = admin.roles.filter(
                  (r) => r.scopeType === "COMMUNITY" && r.scopeId === communityId,
                );
                const isActive = admin.status?.toLowerCase() === "active";
                return (
                  <TableRow key={admin.id} className="group">
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {admin.email}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                          {admin.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roleTypeLabel(admin.adminType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {communityRoles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t("rolesAdmins.admins.noRoles")}
                          </span>
                        ) : (
                          communityRoles.map((r) => (
                            <Badge
                              key={r.id}
                              variant="outline"
                              className="font-normal gap-1"
                            >
                              {assignmentRoleName(r, roleDefs)}
                              <button
                                type="button"
                                aria-label={t("rolesAdmins.admins.revoke")}
                                className="ml-0.5 hover:text-destructive disabled:opacity-50"
                                disabled={rowBusy === admin.id}
                                onClick={() => handleRevoke(admin, r.id)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-foreground"
                            disabled={rowBusy === admin.id}
                          >
                            {rowBusy === admin.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setAssignTarget(admin)}
                            className="text-foreground"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {t("rolesAdmins.admins.assignRole")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(admin)}
                            className="text-foreground"
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            {isActive
                              ? t("rolesAdmins.admins.deactivate")
                              : t("rolesAdmins.admins.activate")}
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
      )}

      <CreateAdminDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        communityId={communityId}
        roleTypes={assignableRoleTypes}
        onCreated={(admin) => setAdmins((prev) => upsertAdmin(prev, admin))}
      />

      <AssignRoleDialog
        admin={assignTarget}
        communityId={communityId}
        roleTypes={assignableRoleTypes}
        customRoles={roleDefs.filter((r) => !r.isSystem)}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        onAssigned={(adminId) => refreshAdmin(adminId)}
      />
    </div>
  );
}

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  roleTypes: AdminRoleTypeOption[];
  onCreated: (admin: AdminAccount) => void;
}

function CreateAdminDialog({
  open,
  onOpenChange,
  communityId,
  roleTypes,
  onCreated,
}: CreateAdminDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminType, setAdminType] = useState(roleTypes[0]?.value ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setPassword("");
    setAdminType(roleTypes[0]?.value ?? "");
    setFormError(null);
  }, [open, roleTypes]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setFormError(t("rolesAdmins.admins.form.emailRequired"));
      return;
    }
    if (password.length < 8) {
      setFormError(t("rolesAdmins.admins.form.passwordRequired"));
      return;
    }
    if (!adminType) {
      setFormError(t("rolesAdmins.admins.form.typeRequired"));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const res = await createAdmin({
        email: email.trim(),
        password,
        adminType,
        scopeType: "COMMUNITY",
        scopeId: communityId,
      });
      if (res.success && res.admin) {
        toast.success(res.message ?? t("rolesAdmins.admins.form.created"));
        onCreated(res.admin);
        onOpenChange(false);
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.createAdmin"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.createAdmin"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("rolesAdmins.admins.form.title")}</DialogTitle>
          <DialogDescription>
            {t("rolesAdmins.admins.form.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">
              {t("rolesAdmins.admins.form.email")}
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              placeholder="admin@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">
              {t("rolesAdmins.admins.form.password")}
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("rolesAdmins.admins.form.passwordHint")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>{t("rolesAdmins.admins.form.type")}</Label>
            <Select value={adminType} onValueChange={setAdminType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || roleTypes.length === 0}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("rolesAdmins.admins.form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AssignRoleDialogProps {
  admin: AdminAccount | null;
  communityId: string;
  roleTypes: AdminRoleTypeOption[];
  customRoles: RoleDefinition[];
  onOpenChange: (open: boolean) => void;
  onAssigned: (adminId: string) => void;
}

// The role picker encodes each choice as "builtin:<roleType>" or
// "custom:<roleDefinitionId>" so a single <Select> can offer both kinds while
// keeping them unambiguous on submit.
const BUILTIN_PREFIX = "builtin:";
const CUSTOM_PREFIX = "custom:";

function AssignRoleDialog({
  admin,
  communityId,
  roleTypes,
  customRoles,
  onOpenChange,
  onAssigned,
}: AssignRoleDialogProps) {
  const { t } = useTranslation();
  const defaultValue = roleTypes[0]
    ? `${BUILTIN_PREFIX}${roleTypes[0].value}`
    : customRoles[0]
      ? `${CUSTOM_PREFIX}${customRoles[0].id}`
      : "";
  const [selection, setSelection] = useState(defaultValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admin) setSelection(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, roleTypes, customRoles]);

  const handleSubmit = async () => {
    if (!admin || !selection) return;
    setSaving(true);
    try {
      // Send EITHER a built-in roleType OR a custom roleDefinitionId — never both.
      const base = {
        adminId: admin.id,
        scopeType: "COMMUNITY",
        scopeId: communityId,
      };
      const input = selection.startsWith(CUSTOM_PREFIX)
        ? { ...base, roleDefinitionId: selection.slice(CUSTOM_PREFIX.length) }
        : { ...base, roleType: selection.slice(BUILTIN_PREFIX.length) };
      const res = await assignAdminRole(input);
      if (res.success) {
        toast.success(res.message ?? t("rolesAdmins.admins.roleAssigned"));
        onAssigned(admin.id);
        onOpenChange(false);
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.assign"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.assign"));
    } finally {
      setSaving(false);
    }
  };

  const hasRoles = roleTypes.length > 0 || customRoles.length > 0;

  return (
    <Dialog open={!!admin} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rolesAdmins.admins.assignForm.title")}</DialogTitle>
          <DialogDescription>
            {admin?.email
              ? t("rolesAdmins.admins.assignForm.subtitle", { email: admin.email })
              : t("rolesAdmins.admins.assignForm.title")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label>{t("rolesAdmins.admins.assignForm.role")}</Label>
          <Select value={selection} onValueChange={setSelection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleTypes.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Built-in roles</SelectLabel>
                  {roleTypes.map((r) => (
                    <SelectItem
                      key={`${BUILTIN_PREFIX}${r.value}`}
                      value={`${BUILTIN_PREFIX}${r.value}`}
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {customRoles.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Custom roles</SelectLabel>
                  {customRoles.map((r) => (
                    <SelectItem
                      key={`${CUSTOM_PREFIX}${r.id}`}
                      value={`${CUSTOM_PREFIX}${r.id}`}
                    >
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !hasRoles}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("rolesAdmins.admins.assignForm.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
