import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface RequestInfoModalProps {
  open: boolean;
  submitting: boolean;
  /** Reason is required — it is shown to the requester. */
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Reason-capture dialog for "Request Info" (UNDER_REVIEW -> PENDING_INFO).
 * The reason is surfaced to the requester so they know what to supply.
 */
export function RequestInfoModal({
  open,
  submitting,
  onConfirm,
  onClose,
}: RequestInfoModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const canSubmit = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("serviceRequests.requestInfo.title")}</DialogTitle>
          <DialogDescription>
            {t("serviceRequests.requestInfo.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="request-info-reason">
            {t("serviceRequests.requestInfo.reasonLabel")}
            <span className="text-destructive"> *</span>
          </Label>
          <Textarea
            id="request-info-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("serviceRequests.requestInfo.reasonPlaceholder")}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("serviceRequests.cancel")}
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={() => onConfirm(reason.trim())}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("serviceRequests.requestInfo.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
