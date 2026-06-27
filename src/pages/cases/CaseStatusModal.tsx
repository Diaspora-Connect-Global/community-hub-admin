import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { CaseActionConfig } from "@/pages/cases/types";
import { ACTION_LABEL_KEY, statusColors } from "@/pages/cases/types";

interface CaseStatusModalProps {
  open: boolean;
  caseNumber: string;
  /** The action being confirmed (drives label + whether a resolution is required). */
  config: CaseActionConfig | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (args: { reason?: string; resolutionSummary?: string }) => void;
}

/**
 * Status-transition confirmation dialog. Collects a free-text `reason` for the
 * audit trail and, when the target status is RESOLVED, a required
 * `resolutionSummary`.
 */
export function CaseStatusModal({
  open,
  caseNumber,
  config,
  submitting,
  onClose,
  onSubmit,
}: CaseStatusModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setResolutionSummary("");
    }
  }, [open]);

  const requiresResolution = config?.requiresResolution ?? false;
  const actionLabel = config ? t(`cases.action.${ACTION_LABEL_KEY[config.action]}`) : "";
  const canSubmit = !submitting && (!requiresResolution || resolutionSummary.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            {t("cases.statusTitle", { action: actionLabel })}
          </DialogTitle>
          <DialogDescription>
            {t("cases.statusDescription", {
              caseNumber,
              status: config?.targetStatus ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        {config && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("cases.colStatus")}:</span>
            <Badge className={statusColors[config.targetStatus] ?? ""}>
              {config.targetStatus}
            </Badge>
          </div>
        )}
        <div className="space-y-4 py-4">
          {requiresResolution && (
            <div className="space-y-2">
              <Label htmlFor="resolutionSummary">
                {t("cases.resolutionSummary")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolutionSummary"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder={t("cases.resolutionSummaryPlaceholder")}
                rows={3}
              />
              {resolutionSummary.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("cases.resolutionRequired")}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reason">{t("cases.reason")}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("cases.reasonPlaceholder")}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={config?.action === "REJECT" ? "destructive" : "default"}
            onClick={() =>
              onSubmit({
                reason: reason.trim() || undefined,
                resolutionSummary: requiresResolution
                  ? resolutionSummary.trim() || undefined
                  : undefined,
              })
            }
            disabled={!canSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
