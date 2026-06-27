import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssignCaseModalProps {
  open: boolean;
  caseNumber: string;
  /** Pre-fill with the current assignee when reassigning. */
  currentAssignee?: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (assigneeUserId: string) => void;
}

/**
 * Dialog for assigning (or reassigning) a case to a staff member by user id.
 * The gateway `assignCase` takes a raw `assigneeUserId`; there is no staff
 * directory query in scope, so this collects the id directly.
 */
export function AssignCaseModal({
  open,
  caseNumber,
  currentAssignee,
  submitting,
  onClose,
  onSubmit,
}: AssignCaseModalProps) {
  const { t } = useTranslation();
  const [assigneeUserId, setAssigneeUserId] = useState("");

  useEffect(() => {
    if (open) setAssigneeUserId(currentAssignee ?? "");
  }, [open, currentAssignee]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display">{t("cases.assignTitle")}</DialogTitle>
          <DialogDescription>
            {t("cases.assignDescription", { caseNumber })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assigneeUserId">
              {t("cases.assigneeUserId")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="assigneeUserId"
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(e.target.value)}
              placeholder={t("cases.assigneePlaceholder")}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSubmit(assigneeUserId)}
            disabled={submitting || !assigneeUserId.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {t("cases.action.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
