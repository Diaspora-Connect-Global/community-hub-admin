/**
 * RegistryEntryFormModal — add / edit a registry entry. Renders the registry's
 * dynamic `fieldSchema` via DynamicFieldRenderer and collects responses into a
 * flat map that the parent serializes into `fieldResponsesJson`.
 */
import { useTranslation } from "react-i18next";
import { UserPlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicFieldRenderer } from "@/pages/registries/DynamicFieldRenderer";
import type { Registry } from "@/services/graphql/registry";
import type { RegistryEntryFormState } from "@/pages/registries/types";

interface RegistryEntryFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  registry: Registry;
  form: RegistryEntryFormState;
  submitting: boolean;
  onChange: (form: RegistryEntryFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RegistryEntryFormModal({
  mode,
  open,
  registry,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: RegistryEntryFormModalProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<RegistryEntryFormState>) =>
    onChange({ ...form, ...patch });

  const setFieldResponse = (key: string, value: string) =>
    set({ fieldResponses: { ...form.fieldResponses, [key]: value } });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create"
              ? t("registries.addEntry", "Add Entry")
              : t("registries.editEntry", "Edit Entry")}
          </DialogTitle>
          <DialogDescription>{registry.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Identity */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t("registries.identity", "Identity")}
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="entry-fullName">
                  {t("registries.fullName", "Full Name")}
                </Label>
                <Input
                  id="entry-fullName"
                  value={form.fullName}
                  onChange={(e) => set({ fullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-email">{t("registries.email", "Email")}</Label>
                  <Input
                    id="entry-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-phone">{t("registries.phone", "Phone")}</Label>
                  <Input
                    id="entry-phone"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-country">
                    {t("registries.country", "Country")}
                  </Label>
                  <Input
                    id="entry-country"
                    placeholder="ISO-2 e.g. NL"
                    value={form.country}
                    onChange={(e) => set({ country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-city">{t("registries.city", "City")}</Label>
                  <Input
                    id="entry-city"
                    value={form.city}
                    onChange={(e) => set({ city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-tags">
                  {t("registries.tags", "Tags (comma-separated)")}
                </Label>
                <Input
                  id="entry-tags"
                  placeholder="board, volunteer"
                  value={form.tagsInput}
                  onChange={(e) => set({ tagsInput: e.target.value })}
                />
              </div>
            </div>
          </div>

          {registry.fieldSchema.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  {t("registries.customFields", "Custom Fields")}
                </h3>
                <div className="space-y-4 pl-6">
                  {registry.fieldSchema.map((field) => (
                    <DynamicFieldRenderer
                      key={field.key}
                      field={field}
                      value={form.fieldResponses[field.key] ?? ""}
                      onChange={(v) => setFieldResponse(field.key, v)}
                      idPrefix={`entry-${mode}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
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
              ? t("registries.addEntry", "Add Entry")
              : t("common.saveChanges", "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
