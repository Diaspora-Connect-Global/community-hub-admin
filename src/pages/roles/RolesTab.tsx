import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  permissionLabel,
} from "@/constants/adminPermissions";
import {
  getRoleDefinitions,
  createRoleDefinition,
  type RoleDefinition,
} from "@/services/graphql/admin-management";

interface RolesTabProps {
  communityId: string;
}

export function RolesTab({ communityId }: RolesTabProps) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRoles = async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getRoleDefinitions("COMMUNITY", communityId);
      if (res.success) {
        // Strict scope isolation: only ever surface roles that belong to THIS
        // community. Defends against the backend returning global/other-scope
        // roles alongside the requested scope.
        setRoles(
          (res.roles ?? []).filter(
            (r) => r.scopeType === "COMMUNITY" && r.scopeId === communityId,
          ),
        );
      } else {
        setError(res.message ?? t("rolesAdmins.errors.loadRoles"));
      }
    } catch (err) {
      setError((err as Error).message ?? t("rolesAdmins.errors.loadRoles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("rolesAdmins.roles.description")}
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("rolesAdmins.roles.create")}
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
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("rolesAdmins.roles.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {role.name}
                      </h3>
                      {role.isSystem && (
                        <Badge variant="secondary" className="shrink-0">
                          <Lock className="h-3 w-3 mr-1" />
                          {t("rolesAdmins.roles.system")}
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t("rolesAdmins.roles.noPermissions")}
                    </span>
                  ) : (
                    role.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="font-normal">
                        {permissionLabel(p)}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateRoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        communityId={communityId}
        onCreated={fetchRoles}
      />
    </div>
  );
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  onCreated: () => void;
}

function CreateRoleDialog({
  open,
  onOpenChange,
  communityId,
  onCreated,
}: CreateRoleDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setPermissions([]);
    setFormError(null);
  }, [open]);

  const togglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError(t("rolesAdmins.roles.form.nameRequired"));
      return;
    }
    if (permissions.length === 0) {
      setFormError(t("rolesAdmins.roles.form.permissionsRequired"));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const res = await createRoleDefinition({
        name: name.trim(),
        description: description.trim() || undefined,
        scopeType: "COMMUNITY",
        scopeId: communityId,
        permissions,
      });
      if (res.success) {
        toast.success(res.message ?? t("rolesAdmins.roles.form.created"));
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(res.message ?? t("rolesAdmins.errors.createRole"));
      }
    } catch (err) {
      toast.error((err as Error).message ?? t("rolesAdmins.errors.createRole"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("rolesAdmins.roles.form.title")}</DialogTitle>
          <DialogDescription>
            {t("rolesAdmins.roles.form.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">{t("rolesAdmins.roles.form.name")}</Label>
            <Input
              id="role-name"
              value={name}
              placeholder={t("rolesAdmins.roles.form.namePlaceholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc">
              {t("rolesAdmins.roles.form.descriptionLabel")}
            </Label>
            <Textarea
              id="role-desc"
              rows={2}
              value={description}
              placeholder={t("rolesAdmins.roles.form.descriptionPlaceholder")}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>{t("rolesAdmins.roles.form.permissions")}</Label>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ADMIN_PERMISSIONS.filter((p) => p.group === group).map(
                    (perm) => {
                      const id = `perm-${perm.key}`;
                      return (
                        <Label
                          key={perm.key}
                          htmlFor={id}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-2.5 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            id={id}
                            checked={permissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <span className="text-sm">{perm.label}</span>
                        </Label>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
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
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("rolesAdmins.roles.form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
