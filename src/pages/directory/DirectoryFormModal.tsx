/**
 * DirectoryFormModal — handles both "Create" and "Edit" modes for a directory
 * listing. The parent owns the form state (form / onChange) and supplies the
 * category options loaded from `directoryCategories`.
 */
import { useTranslation } from "react-i18next";
import { Building, Phone, MapPin, Tags, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import type { DirectoryCategory } from "@/services/graphql/directory";
import {
  LISTING_KINDS,
  type DirectoryFormState,
} from "@/pages/directory/types";

interface DirectoryFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  form: DirectoryFormState;
  submitting: boolean;
  categories: DirectoryCategory[];
  categoriesLoading?: boolean;
  onChange: (form: DirectoryFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function DirectoryFormModal({
  mode,
  open,
  form,
  submitting,
  categories,
  categoriesLoading = false,
  onChange,
  onSubmit,
  onClose,
}: DirectoryFormModalProps) {
  const { t } = useTranslation();
  const p = mode === "create" ? "create" : "edit";
  const set = (patch: Partial<DirectoryFormState>) =>
    onChange({ ...form, ...patch });
  const idPrefix = (field: string) => `dir-${p}-${field}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create"
              ? t("directory.form.createTitle")
              : t("directory.form.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("directory.form.createSubtitle")
              : t("directory.form.editSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("directory.form.basicSection")}
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor={idPrefix("displayName")}>
                  {t("directory.form.displayName")} *
                </Label>
                <Input
                  id={idPrefix("displayName")}
                  placeholder={t("directory.form.displayNamePlaceholder")}
                  value={form.displayName}
                  onChange={(e) => set({ displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={idPrefix("legalName")}>
                  {t("directory.form.legalName")}
                </Label>
                <Input
                  id={idPrefix("legalName")}
                  placeholder={t("directory.form.legalNamePlaceholder")}
                  value={form.legalName}
                  onChange={(e) => set({ legalName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("directory.form.listingKind")} *</Label>
                  <Select
                    value={form.listingKind}
                    onValueChange={(v) =>
                      set({ listingKind: v as DirectoryFormState["listingKind"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("directory.form.listingKindPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {t(`directory.kind.${k}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("directory.form.category")} *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => set({ categoryId: v })}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categoriesLoading
                            ? t("common.loading")
                            : t("directory.form.categoryPlaceholder")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={idPrefix("summary")}>
                  {t("directory.form.summary")}
                </Label>
                <Input
                  id={idPrefix("summary")}
                  placeholder={t("directory.form.summaryPlaceholder")}
                  value={form.summary}
                  onChange={(e) => set({ summary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={idPrefix("description")}>
                  {t("directory.form.description")}
                </Label>
                <Textarea
                  id={idPrefix("description")}
                  placeholder={t("directory.form.descriptionPlaceholder")}
                  rows={4}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={idPrefix("country")}>
                  {t("directory.form.country")}
                </Label>
                <Input
                  id={idPrefix("country")}
                  placeholder="ET"
                  maxLength={2}
                  value={form.country}
                  onChange={(e) =>
                    set({ country: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t("directory.form.contactSection")}
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor={idPrefix("email")}>
                  {t("directory.form.email")}
                </Label>
                <Input
                  id={idPrefix("email")}
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("phone")}>
                  {t("directory.form.phone")}
                </Label>
                <Input
                  id={idPrefix("phone")}
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("website")}>
                  {t("directory.form.website")}
                </Label>
                <Input
                  id={idPrefix("website")}
                  value={form.website}
                  onChange={(e) => set({ website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("whatsapp")}>
                  {t("directory.form.whatsapp")}
                </Label>
                <Input
                  id={idPrefix("whatsapp")}
                  value={form.whatsapp}
                  onChange={(e) => set({ whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("facebook")}>
                  {t("directory.form.facebook")}
                </Label>
                <Input
                  id={idPrefix("facebook")}
                  value={form.facebook}
                  onChange={(e) => set({ facebook: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("instagram")}>
                  {t("directory.form.instagram")}
                </Label>
                <Input
                  id={idPrefix("instagram")}
                  value={form.instagram}
                  onChange={(e) => set({ instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("linkedin")}>
                  {t("directory.form.linkedin")}
                </Label>
                <Input
                  id={idPrefix("linkedin")}
                  value={form.linkedin}
                  onChange={(e) => set({ linkedin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("twitter")}>
                  {t("directory.form.twitter")}
                </Label>
                <Input
                  id={idPrefix("twitter")}
                  value={form.twitter}
                  onChange={(e) => set({ twitter: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("directory.form.locationSection")}
            </h3>
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor={idPrefix("locationLabel")}>
                  {t("directory.form.locationLabel")}
                </Label>
                <Input
                  id={idPrefix("locationLabel")}
                  placeholder={t("directory.form.locationLabelPlaceholder")}
                  value={form.locationLabel}
                  onChange={(e) => set({ locationLabel: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("addressLine1")}>
                    {t("directory.form.addressLine1")}
                  </Label>
                  <Input
                    id={idPrefix("addressLine1")}
                    value={form.addressLine1}
                    onChange={(e) => set({ addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("addressLine2")}>
                    {t("directory.form.addressLine2")}
                  </Label>
                  <Input
                    id={idPrefix("addressLine2")}
                    value={form.addressLine2}
                    onChange={(e) => set({ addressLine2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("city")}>
                    {t("directory.form.city")}
                  </Label>
                  <Input
                    id={idPrefix("city")}
                    value={form.city}
                    onChange={(e) => set({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("region")}>
                    {t("directory.form.region")}
                  </Label>
                  <Input
                    id={idPrefix("region")}
                    value={form.region}
                    onChange={(e) => set({ region: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("postalCode")}>
                    {t("directory.form.postalCode")}
                  </Label>
                  <Input
                    id={idPrefix("postalCode")}
                    value={form.postalCode}
                    onChange={(e) => set({ postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={idPrefix("locationCountry")}>
                    {t("directory.form.country")}
                  </Label>
                  <Input
                    id={idPrefix("locationCountry")}
                    placeholder="ET"
                    maxLength={2}
                    value={form.locationCountry}
                    onChange={(e) =>
                      set({ locationCountry: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags & Languages */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tags className="h-4 w-4" />
              {t("directory.form.metaSection")}
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor={idPrefix("languages")}>
                  {t("directory.form.languages")}
                </Label>
                <Input
                  id={idPrefix("languages")}
                  placeholder="en, am, fr"
                  value={form.languages}
                  onChange={(e) => set({ languages: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={idPrefix("tags")}>
                  {t("directory.form.tags")}
                </Label>
                <Input
                  id={idPrefix("tags")}
                  placeholder={t("directory.form.tagsPlaceholder")}
                  value={form.tags}
                  onChange={(e) => set({ tags: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {mode === "create"
              ? t("directory.form.createAction")
              : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
