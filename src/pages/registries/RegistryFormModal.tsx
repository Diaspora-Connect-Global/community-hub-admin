/**
 * RegistryFormModal — create / edit a registry, including a dynamic field-schema
 * builder. The parent owns the form state via `form` / `onChange`.
 *
 * On edit, `code` and `registryTypeId` are immutable (the gateway
 * `updateRegistry` ignores them), so they render read-only.
 */
import { useTranslation } from "react-i18next";
import { FileText, ListPlus, Plus, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegistryFormFieldType } from "@/services/graphql/registry";
import {
  FIELD_TYPES,
  fieldTypeNeedsOptions,
  newFieldRow,
  titleCase,
  type RegistryFormState,
  type FieldSchemaRow,
} from "@/pages/registries/types";

interface RegistryFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  form: RegistryFormState;
  submitting: boolean;
  onChange: (form: RegistryFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RegistryFormModal({
  mode,
  open,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: RegistryFormModalProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<RegistryFormState>) => onChange({ ...form, ...patch });

  const updateRow = (rowId: string, patch: Partial<FieldSchemaRow>) =>
    set({
      fieldSchema: form.fieldSchema.map((r) =>
        r.rowId === rowId ? { ...r, ...patch } : r,
      ),
    });

  const removeRow = (rowId: string) =>
    set({ fieldSchema: form.fieldSchema.filter((r) => r.rowId !== rowId) });

  const addRow = () => set({ fieldSchema: [...form.fieldSchema, newFieldRow()] });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create"
              ? t("registries.createRegistry", "Create Registry")
              : t("registries.editRegistry", "Edit Registry")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "registries.formDescription",
              "Define the registry and the dynamic fields its entries collect.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("registries.basicInfo", "Basic Information")}
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="reg-name">{t("registries.name", "Name")} *</Label>
                <Input
                  id="reg-name"
                  placeholder="e.g. Members Register"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-code">{t("registries.code", "Code")}</Label>
                  <Input
                    id="reg-code"
                    placeholder="auto-derived if blank"
                    value={form.code}
                    onChange={(e) => set({ code: e.target.value })}
                    disabled={mode === "edit"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-type-id">
                    {t("registries.registryTypeId", "Registry Type ID")} *
                  </Label>
                  <Input
                    id="reg-type-id"
                    placeholder="registry-type UUID"
                    value={form.registryTypeId}
                    onChange={(e) => set({ registryTypeId: e.target.value })}
                    disabled={mode === "edit"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-description">
                  {t("registries.description", "Description")}
                </Label>
                <Textarea
                  id="reg-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-case-prefix">
                  {t("registries.casePrefix", "Entry Number Prefix")}
                </Label>
                <Input
                  id="reg-case-prefix"
                  placeholder="e.g. EMB"
                  value={form.casePrefix}
                  onChange={(e) => set({ casePrefix: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reg-self-reg" className="cursor-pointer">
                  {t("registries.selfRegistrationEnabled", "Allow self-registration")}
                </Label>
                <Switch
                  id="reg-self-reg"
                  checked={form.selfRegistrationEnabled}
                  onCheckedChange={(v) => set({ selfRegistrationEnabled: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reg-requires-approval" className="cursor-pointer">
                  {t("registries.requiresApproval", "Require approval")}
                </Label>
                <Switch
                  id="reg-requires-approval"
                  checked={form.requiresApproval}
                  onCheckedChange={(v) => set({ requiresApproval: v })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Field schema builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ListPlus className="h-4 w-4" />
                {t("registries.fieldSchema", "Form Fields")}
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" />
                {t("registries.addField", "Add Field")}
              </Button>
            </div>

            <div className="space-y-3 pl-6">
              {form.fieldSchema.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("registries.noFields", "No custom fields yet.")}
                </p>
              )}

              {form.fieldSchema.map((row, index) => (
                <div
                  key={row.rowId}
                  className="p-3 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t("registries.field", "Field")} {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeRow(row.rowId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("registries.fieldKey", "Key")}</Label>
                      <Input
                        placeholder="e.g. profession"
                        value={row.key}
                        onChange={(e) => updateRow(row.rowId, { key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("registries.fieldLabel", "Label")}</Label>
                      <Input
                        placeholder="e.g. Profession"
                        value={row.label}
                        onChange={(e) => updateRow(row.rowId, { label: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("registries.fieldType", "Type")}</Label>
                      <Select
                        value={row.type}
                        onValueChange={(v) =>
                          updateRow(row.rowId, { type: v as RegistryFormFieldType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((ft) => (
                            <SelectItem key={ft} value={ft}>
                              {titleCase(ft)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        id={`req-${row.rowId}`}
                        checked={row.required}
                        onCheckedChange={(v) => updateRow(row.rowId, { required: v })}
                      />
                      <Label htmlFor={`req-${row.rowId}`} className="text-xs cursor-pointer">
                        {t("registries.fieldRequired", "Required")}
                      </Label>
                    </div>
                  </div>

                  {fieldTypeNeedsOptions(row.type) && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t("registries.fieldOptions", "Options (comma-separated)")}
                      </Label>
                      <Input
                        placeholder="Option A, Option B, Option C"
                        value={row.options.join(", ")}
                        onChange={(e) =>
                          updateRow(row.rowId, {
                            options: e.target.value
                              .split(",")
                              .map((o) => o.trimStart()),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="outline" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {mode === "create"
              ? t("registries.createRegistry", "Create Registry")
              : t("common.saveChanges", "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
