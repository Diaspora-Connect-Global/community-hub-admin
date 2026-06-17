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

export type DecisionKind = "approve" | "reject" | "complete";

interface RequestDecisionModalProps {
  open: boolean;
  kind: DecisionKind;
  submitting: boolean;
  /** Reason is required for "reject", optional for "approve" / "complete". */
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Reason-capture dialog for the approve / reject / complete decisions.
 * Reject requires a reason; approve and complete make it optional.
 */
export function RequestDecisionModal({
  open,
  kind,
  submitting,
  onConfirm,
  onClose,
}: RequestDecisionModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open, kind]);

  const reasonRequired = kind === "reject";
  const canSubmit = !reasonRequired || reason.trim().length > 0;

  const title =
    kind === "approve"
      ? t("serviceRequests.decision.approveTitle")
      : kind === "reject"
        ? t("serviceRequests.decision.rejectTitle")
        : t("serviceRequests.decision.completeTitle");

  const description =
    kind === "approve"
      ? t("serviceRequests.decision.approveDesc")
      : kind === "reject"
        ? t("serviceRequests.decision.rejectDesc")
        : t("serviceRequests.decision.completeDesc");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="decision-reason">
            {t("serviceRequests.decision.reasonLabel")}
            {reasonRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id="decision-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("serviceRequests.decision.reasonPlaceholder")}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("serviceRequests.cancel")}
          </Button>
          <Button
            variant={kind === "reject" ? "destructive" : "default"}
            disabled={!canSubmit || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("serviceRequests.decision.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
