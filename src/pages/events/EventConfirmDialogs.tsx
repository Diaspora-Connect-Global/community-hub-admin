/**
 * EventConfirmDialogs — Cancel and Delete confirmation dialogs.
 *
 * Extracted to keep the Events.tsx orchestrator under the 150-line target.
 * Both dialogs are simple destructive-action confirms with no internal state;
 * the parent owns all flags and callbacks.
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Cancel dialog
// ---------------------------------------------------------------------------

interface CancelEventDialogProps {
  open: boolean;
  eventTitle: string | undefined;
  cancelReason: string;
  submitting: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancelEventDialog({
  open,
  eventTitle,
  cancelReason,
  submitting,
  onReasonChange,
  onConfirm,
  onClose,
}: CancelEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display text-destructive">Cancel Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel "{eventTitle}"? All registered attendees
            will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-reason">Cancellation reason</Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            placeholder="Shown internally / sent to attendees per platform rules"
            value={cancelReason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Keep Event
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete dialog
// ---------------------------------------------------------------------------

interface DeleteEventDialogProps {
  open: boolean;
  eventTitle: string | undefined;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteEventDialog({
  open,
  eventTitle,
  submitting,
  onConfirm,
  onClose,
}: DeleteEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display text-destructive">Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete "{eventTitle}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
