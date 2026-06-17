/**
 * DirectoryDetailModal — read-only detail view of a single directory listing.
 * The parent loads the full listing (directoryListing query) and passes it in.
 */
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DirectoryListing } from "@/services/graphql/directory";
import { STATUS_COLORS, VERIFICATION_COLORS } from "@/pages/directory/types";

interface DirectoryDetailModalProps {
  open: boolean;
  loading: boolean;
  listing: DirectoryListing | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground text-sm">{label}</span>
      <p className="font-medium break-words">{value}</p>
    </div>
  );
}

export function DirectoryDetailModal({
  open,
  loading,
  listing,
  onClose,
}: DirectoryDetailModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {listing?.displayName ?? t("directory.detail.title")}
          </DialogTitle>
          <DialogDescription>{t("directory.detail.subtitle")}</DialogDescription>
        </DialogHeader>

        {loading || !listing ? (
          <div className="py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_COLORS[listing.status] ?? ""}>
                {t(`directory.status.${listing.status}`, listing.status)}
              </Badge>
              <Badge
                className={VERIFICATION_COLORS[listing.verificationStatus] ?? ""}
              >
                {t(
                  `directory.verification.${listing.verificationStatus}`,
                  listing.verificationStatus,
                )}
              </Badge>
              <Badge variant="outline">
                {t(`directory.kind.${listing.listingKind}`, listing.listingKind)}
              </Badge>
            </div>

            {/* Basic */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("directory.form.legalName")}
                value={listing.legalName}
              />
              <Field
                label={t("directory.table.category")}
                value={listing.categoryCode}
              />
              <Field
                label={t("directory.form.country")}
                value={listing.country}
              />
              <Field
                label={t("directory.detail.languages")}
                value={listing.languages?.join(", ")}
              />
            </div>

            <Field label={t("directory.form.summary")} value={listing.summary} />
            <Field
              label={t("directory.form.description")}
              value={listing.description}
            />

            {listing.tags?.length > 0 && (
              <div>
                <span className="text-muted-foreground text-sm">
                  {t("directory.form.tags")}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {listing.contact && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  {t("directory.form.contactSection")}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label={t("directory.form.email")}
                    value={listing.contact.email}
                  />
                  <Field
                    label={t("directory.form.phone")}
                    value={listing.contact.phone}
                  />
                  <Field
                    label={t("directory.form.website")}
                    value={listing.contact.website}
                  />
                  <Field
                    label={t("directory.form.whatsapp")}
                    value={listing.contact.whatsapp}
                  />
                  <Field
                    label={t("directory.form.facebook")}
                    value={listing.contact.facebook}
                  />
                  <Field
                    label={t("directory.form.instagram")}
                    value={listing.contact.instagram}
                  />
                  <Field
                    label={t("directory.form.linkedin")}
                    value={listing.contact.linkedin}
                  />
                  <Field
                    label={t("directory.form.twitter")}
                    value={listing.contact.twitter}
                  />
                </div>
              </div>
            )}

            {/* Location */}
            {listing.location && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  {t("directory.form.locationSection")}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label={t("directory.form.locationLabel")}
                    value={listing.location.label}
                  />
                  <Field
                    label={t("directory.form.addressLine1")}
                    value={listing.location.addressLine1}
                  />
                  <Field
                    label={t("directory.form.addressLine2")}
                    value={listing.location.addressLine2}
                  />
                  <Field
                    label={t("directory.form.city")}
                    value={listing.location.city}
                  />
                  <Field
                    label={t("directory.form.region")}
                    value={listing.location.region}
                  />
                  <Field
                    label={t("directory.form.postalCode")}
                    value={listing.location.postalCode}
                  />
                  <Field
                    label={t("directory.form.country")}
                    value={listing.location.country}
                  />
                </div>
              </div>
            )}

            {/* Verification metadata */}
            {(listing.verificationNote || listing.verificationSource) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  {t("directory.detail.verificationSection")}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label={t("directory.detail.verificationSource")}
                    value={listing.verificationSource}
                  />
                  <Field
                    label={t("directory.detail.verificationNote")}
                    value={listing.verificationNote}
                  />
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {listing.publishedAt && (
                <div>
                  <span className="text-muted-foreground">
                    {t("directory.detail.publishedAt")}
                  </span>
                  <p className="font-medium">
                    {new Date(listing.publishedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {listing.updatedAt && (
                <div>
                  <span className="text-muted-foreground">
                    {t("directory.detail.updatedAt")}
                  </span>
                  <p className="font-medium">
                    {new Date(listing.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
