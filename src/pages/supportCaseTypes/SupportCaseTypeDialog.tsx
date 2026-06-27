import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupportCaseType,
  SupportPriority,
  CreateSupportCaseTypeInput,
  UpdateSupportCaseTypeInput,
} from "@/services/graphql/support";

/** Priority options for the case type. MEDIUM default (matches typical seeds). */
export const PRIORITY_OPTIONS: SupportPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

interface SupportCaseTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The type being edited, or null for create mode. */
  editingType: SupportCaseType | null;
  /** Existing codes (lowercased) for create-mode uniqueness validation. */
  existingCodes: string[];
  saving: boolean;
  onCreate: (input: CreateSupportCaseTypeInput) => Promise<void>;
  onUpdate: (input: UpdateSupportCaseTypeInput) => Promise<void>;
}

/**
 * Create / edit dialog for a Support Case Type. Unlike service request types,
 * case types carry NO dynamic form fields — so this is a simple scalar form.
 * On submit it validates the basic fields then calls create or update.
 */
export function SupportCaseTypeDialog({
  open,
  onOpenChange,
  editingType,
  existingCodes,
  saving,
  onCreate,
  onUpdate,
}: SupportCaseTypeDialogProps) {
  const isEdit = !!editingType;

  // Basic fields
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPriority, setDefaultPriority] = useState<SupportPriority>("MEDIUM");
  const [slaHours, setSlaHours] = useState("");
  const [caseNumberPrefix, setCaseNumberPrefix] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Validation
  const [basicError, setBasicError] = useState<string | null>(null);

  // Reset the form whenever the dialog opens or the target type changes.
  useEffect(() => {
    if (!open) return;
    if (editingType) {
      setCode(editingType.code);
      setDisplayName(editingType.displayName);
      setDescription(editingType.description ?? "");
      setDefaultPriority(
        (editingType.defaultPriority as SupportPriority) ?? "MEDIUM",
      );
      setSlaHours(
        editingType.slaHours != null ? editingType.slaHours.toString() : "",
      );
      setCaseNumberPrefix(editingType.caseNumberPrefix ?? "");
      setSortOrder((editingType.sortOrder ?? 0).toString());
      setIsActive(editingType.isActive);
    } else {
      setCode("");
      setDisplayName("");
      setDescription("");
      setDefaultPriority("MEDIUM");
      setSlaHours("");
      setCaseNumberPrefix("");
      setSortOrder("0");
      setIsActive(true);
    }
    setBasicError(null);
  }, [open, editingType]);

  const validateBasic = (): string | null => {
    if (!displayName.trim()) return "Display name is required.";
    if (!isEdit) {
      const c = code.trim();
      if (!c) return "Code is required.";
      if (!CODE_PATTERN.test(c)) {
        return "Code must be lowercase letters, numbers and underscores, starting with a letter.";
      }
      if (existingCodes.includes(c.toLowerCase())) {
        return "A case type with this code already exists.";
      }
    }
    if (slaHours.trim()) {
      const n = Number(slaHours);
      if (!Number.isInteger(n) || n < 0) {
        return "SLA hours must be a non-negative whole number.";
      }
    }
    if (sortOrder.trim()) {
      const n = Number(sortOrder);
      if (!Number.isInteger(n)) return "Sort order must be a whole number.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const basicErr = validateBasic();
    setBasicError(basicErr);
    if (basicErr) return;

    const parsedSla = slaHours.trim() ? Number(slaHours) : undefined;
    const parsedSort = sortOrder.trim() ? Number(sortOrder) : undefined;
    const prefix = caseNumberPrefix.trim();

    if (isEdit && editingType) {
      const input: UpdateSupportCaseTypeInput = {
        id: editingType.id,
        displayName: displayName.trim(),
        description: description.trim() || null,
        defaultPriority,
        slaHours: parsedSla ?? null,
        caseNumberPrefix: prefix || null,
        sortOrder: parsedSort ?? null,
        isActive,
      };
      await onUpdate(input);
    } else {
      const input: CreateSupportCaseTypeInput = {
        ownerType: "COMMUNITY",
        // ownerEntityId is injected by the page so we never hardcode it here.
        code: code.trim(),
        displayName: displayName.trim(),
        description: description.trim() || undefined,
        defaultPriority,
        slaHours: parsedSla,
        caseNumberPrefix: prefix || undefined,
        sortOrder: parsedSort,
      };
      await onCreate(input);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Support Case Type" : "New Support Case Type"}
          </DialogTitle>
          <DialogDescription>
            Define a category of support cases — its default priority, SLA and
            case-number prefix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sct-code">Code</Label>
              <Input
                id="sct-code"
                value={code}
                placeholder="e.g. fraud_report"
                disabled={isEdit}
                onChange={(e) => setCode(e.target.value)}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Code can't be changed after creation.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sct-name">Display name</Label>
              <Input
                id="sct-name"
                value={displayName}
                placeholder="e.g. Fraud Reports"
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sct-desc">Description</Label>
            <Textarea
              id="sct-desc"
              value={description}
              rows={2}
              placeholder="Short description of this case type."
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Default priority</Label>
              <Select
                value={defaultPriority}
                onValueChange={(v) => setDefaultPriority(v as SupportPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sct-sla">SLA hours</Label>
              <Input
                id="sct-sla"
                type="number"
                min="0"
                step="1"
                value={slaHours}
                placeholder="e.g. 48"
                onChange={(e) => setSlaHours(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target resolution time. Leave blank for none.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sct-prefix">Case number prefix</Label>
              <Input
                id="sct-prefix"
                value={caseNumberPrefix}
                placeholder="e.g. FRD"
                className="font-mono"
                onChange={(e) => setCaseNumberPrefix(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sct-sort">Sort order</Label>
              <Input
                id="sct-sort"
                type="number"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="sct-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive case types are hidden from end users.
                </p>
              </div>
              <Switch
                id="sct-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          {basicError && (
            <p className="text-sm text-destructive">{basicError}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create case type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Title-case a priority enum for display. */
export function priorityLabel(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}
