import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  X,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type {
  ServiceRequestType,
  ServiceRequestFormFieldType,
  CreateServiceRequestTypeInput,
  UpdateServiceRequestTypeInput,
} from "@/services/graphql/serviceRequests";
import {
  FORM_FIELD_TYPES,
  formFieldTypeLabel,
  typeRequiresOptions,
  slugifyKey,
  emptyFieldDraft,
  fieldsToDrafts,
  validateFieldDrafts,
  draftsToFormFieldInputs,
  type FormFieldDraft,
  type FieldError,
} from "./formFieldBuilder";

/** Currency options for the fee. EUR default (matches existing seed data). */
const CURRENCY_OPTIONS = ["EUR", "USD", "GBP", "GHS", "NGN", "XOF", "CAD"];

const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

interface ServiceRequestTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The type being edited, or null for create mode. */
  editingType: ServiceRequestType | null;
  /** Existing codes (lowercased) for create-mode uniqueness validation. */
  existingCodes: string[];
  saving: boolean;
  onCreate: (input: CreateServiceRequestTypeInput) => Promise<void>;
  onUpdate: (input: UpdateServiceRequestTypeInput) => Promise<void>;
}

/**
 * Create / edit dialog for a Service Request Type, including the dynamic
 * form-field builder. On submit it validates the basic fields + every form
 * field (surfacing problems inline and via a toast, mirroring the Opportunity
 * form), then maps the drafts to `formFields: ServiceRequestFormFieldInput[]`
 * and calls create or update.
 */
export function ServiceRequestTypeDialog({
  open,
  onOpenChange,
  editingType,
  existingCodes,
  saving,
  onCreate,
  onUpdate,
}: ServiceRequestTypeDialogProps) {
  const isEdit = !!editingType;

  // Basic fields
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [feeMajor, setFeeMajor] = useState(""); // major-units string input
  const [feeCurrency, setFeeCurrency] = useState("EUR");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Form-field builder + key-touched tracking (stop auto-slug once user edits key)
  const [fields, setFields] = useState<FormFieldDraft[]>([]);
  const [keyTouched, setKeyTouched] = useState<Record<string, boolean>>({});

  // Validation
  const [basicError, setBasicError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  // Reset the form whenever the dialog opens or the target type changes.
  useEffect(() => {
    if (!open) return;
    if (editingType) {
      setCode(editingType.code);
      setDisplayName(editingType.displayName);
      setDescription(editingType.description ?? "");
      setFeeMajor(
        editingType.feeAmountMinor != null
          ? (editingType.feeAmountMinor / 100).toString()
          : "",
      );
      setFeeCurrency(editingType.feeCurrency ?? "EUR");
      setSortOrder((editingType.sortOrder ?? 0).toString());
      setIsActive(editingType.isActive);
      setFields(fieldsToDrafts(editingType.formFields));
    } else {
      setCode("");
      setDisplayName("");
      setDescription("");
      setFeeMajor("");
      setFeeCurrency("EUR");
      setSortOrder("0");
      setIsActive(true);
      setFields([]);
    }
    setKeyTouched({});
    setBasicError(null);
    setFieldErrors([]);
  }, [open, editingType]);

  const errorByUid = useMemo(() => {
    const map: Record<string, FieldError> = {};
    for (const e of fieldErrors) map[e.uid] = e;
    return map;
  }, [fieldErrors]);

  // When editing, the type already has persisted fields; clearing them all means
  // the backend's "empty array = leave unchanged" omit-semantics kick in.
  const hadInitialFields = isEdit && (editingType?.formFields?.length ?? 0) > 0;
  const fieldsCleared = hadInitialFields && fields.length === 0;

  // ── Field mutators ──────────────────────────────────────────────────────────

  const addField = () => {
    setFields((prev) => [...prev, emptyFieldDraft()]);
  };

  const removeField = (uid: string) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const moveField = (uid: string, dir: -1 | 1) => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.uid === uid);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const patchField = (uid: string, patch: Partial<FormFieldDraft>) => {
    setFields((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f)),
    );
  };

  const handleLabelChange = (uid: string, label: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.uid !== uid) return f;
        // Auto-slug the key from the label until the user edits the key manually.
        const key = keyTouched[uid] ? f.key : slugifyKey(label);
        return { ...f, label, key };
      }),
    );
  };

  const handleKeyChange = (uid: string, key: string) => {
    setKeyTouched((prev) => ({ ...prev, [uid]: true }));
    patchField(uid, { key });
  };

  const handleTypeChange = (uid: string, type: ServiceRequestFormFieldType) => {
    patchField(uid, {
      type,
      // Seed one empty option row when switching to an option type.
      options: typeRequiresOptions(type) ? [""] : [],
    });
  };

  // Options sub-editor
  const addOption = (uid: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.uid === uid ? { ...f, options: [...f.options, ""] } : f,
      ),
    );
  };
  const updateOption = (uid: string, idx: number, value: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.uid === uid
          ? { ...f, options: f.options.map((o, i) => (i === idx ? value : o)) }
          : f,
      ),
    );
  };
  const removeOption = (uid: string, idx: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.uid === uid
          ? { ...f, options: f.options.filter((_, i) => i !== idx) }
          : f,
      ),
    );
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const validateBasic = (): string | null => {
    if (!displayName.trim()) return "Display name is required.";
    if (!isEdit) {
      const c = code.trim();
      if (!c) return "Code is required.";
      if (!CODE_PATTERN.test(c)) {
        return "Code must be lowercase letters, numbers and underscores, starting with a letter.";
      }
      if (existingCodes.includes(c.toLowerCase())) {
        return "A type with this code already exists.";
      }
    }
    if (feeMajor.trim()) {
      const n = Number(feeMajor);
      if (!Number.isFinite(n) || n < 0) return "Fee must be a non-negative number.";
    }
    if (!feeCurrency) return "Currency is required.";
    if (sortOrder.trim()) {
      const n = Number(sortOrder);
      if (!Number.isInteger(n)) return "Sort order must be a whole number.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const basicErr = validateBasic();
    setBasicError(basicErr);

    const fieldResult = validateFieldDrafts(fields);
    setFieldErrors(fieldResult.errors);

    if (basicErr) {
      toast({ title: "Validation", description: basicErr, variant: "destructive" });
      return;
    }

    // Require at least one field to define a meaningful application form, and
    // surface the "empty = leave unchanged" omit-semantics when editing.
    if (fields.length === 0) {
      toast({
        title: "Add a form field",
        description: hadInitialFields
          ? "Removing every field won't clear the form — the backend keeps the existing fields. Add at least one field to change the form."
          : "An application form needs at least one field.",
        variant: "destructive",
      });
      return;
    }

    if (!fieldResult.ok) {
      toast({
        title: "Fix the form fields",
        description: fieldResult.summary ?? "One or more form fields are invalid.",
        variant: "destructive",
      });
      return;
    }

    const feeAmountMinor = feeMajor.trim()
      ? Math.round(Number(feeMajor) * 100)
      : undefined;
    const parsedSort = sortOrder.trim() ? Number(sortOrder) : undefined;
    const formFields = draftsToFormFieldInputs(fields);

    if (isEdit && editingType) {
      const input: UpdateServiceRequestTypeInput = {
        id: editingType.id,
        displayName: displayName.trim(),
        description: description.trim() || null,
        feeAmountMinor: feeAmountMinor ?? null,
        feeCurrency,
        sortOrder: parsedSort ?? null,
        isActive,
        // Always send the full set so the replace semantics keep edits in sync.
        formFields,
      };
      await onUpdate(input);
    } else {
      const input: CreateServiceRequestTypeInput = {
        ownerType: "COMMUNITY",
        // ownerEntityId is injected by the page so we never hardcode it here.
        code: code.trim(),
        displayName: displayName.trim(),
        description: description.trim() || undefined,
        feeAmountMinor,
        feeCurrency,
        sortOrder: parsedSort,
        formFields,
      };
      await onCreate(input);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Service Request Type" : "New Service Request Type"}
          </DialogTitle>
          <DialogDescription>
            Define the service and the dynamic form end users fill in when they
            submit a request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="srt-code">Code *</Label>
              <Input
                id="srt-code"
                value={code}
                placeholder="e.g. birth_cert"
                className="font-mono text-sm"
                disabled={isEdit}
                onChange={(e) => setCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? "Code can't be changed after creation."
                  : "Lowercase letters, numbers and underscores; start with a letter."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="srt-name">Display name *</Label>
              <Input
                id="srt-name"
                value={displayName}
                placeholder="e.g. Birth Certificate Requests"
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="srt-desc">Description</Label>
            <Textarea
              id="srt-desc"
              value={description}
              rows={2}
              placeholder="Short description shown to end users."
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="srt-fee">Fee</Label>
              <Input
                id="srt-fee"
                type="number"
                min="0"
                step="0.01"
                value={feeMajor}
                placeholder="0.00"
                onChange={(e) => setFeeMajor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Major units. Leave blank for none, 0 for free.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={feeCurrency} onValueChange={setFeeCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="srt-sort">Sort order</Label>
              <Input
                id="srt-sort"
                type="number"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="srt-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive types are hidden from end users.
                </p>
              </div>
              <Switch
                id="srt-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          {basicError && (
            <p className="text-sm text-destructive">{basicError}</p>
          )}

          {/* ── Form-field builder ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Application form fields
                </h3>
                <p className="text-xs text-muted-foreground">
                  The dynamic form end users fill in for this service.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add field
              </Button>
            </div>

            {fields.length === 0 && (
              <div
                className={
                  fieldsCleared
                    ? "rounded-lg border border-dashed border-warning/50 bg-warning/5 p-4 text-sm text-warning flex items-start gap-2"
                    : "rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
                }
              >
                {fieldsCleared ? (
                  <>
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      You've removed all fields. Saving now won't clear the form —
                      the backend keeps the existing fields when none are sent. Add
                      at least one field to change the form.
                    </span>
                  </>
                ) : (
                  <span>
                    An application form needs at least one field. Add a field to
                    start building the form.
                  </span>
                )}
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const err = errorByUid[field.uid];
                const showOptions = typeRequiresOptions(field.type);
                return (
                  <div
                    key={field.uid}
                    className="rounded-lg border border-border bg-card p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Field {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => moveField(field.uid, -1)}
                          aria-label="Move field up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === fields.length - 1}
                          onClick={() => moveField(field.uid, 1)}
                          aria-label="Move field down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeField(field.uid)}
                          aria-label="Remove field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Label *</Label>
                        <Input
                          value={field.label}
                          placeholder="e.g. Full Name"
                          onChange={(e) =>
                            handleLabelChange(field.uid, e.target.value)
                          }
                        />
                        {err?.label && (
                          <p className="text-xs text-destructive">{err.label}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Key *</Label>
                        <Input
                          value={field.key}
                          placeholder="auto-generated"
                          className="font-mono text-sm"
                          onChange={(e) =>
                            handleKeyChange(field.uid, e.target.value)
                          }
                        />
                        {err?.key && (
                          <p className="text-xs text-destructive">{err.key}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            handleTypeChange(
                              field.uid,
                              v as ServiceRequestFormFieldType,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FORM_FIELD_TYPES.map((ft) => (
                              <SelectItem key={ft} value={ft}>
                                {formFieldTypeLabel(ft)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border px-3 self-end h-10">
                        <Label
                          htmlFor={`req-${field.uid}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          Required
                        </Label>
                        <Switch
                          id={`req-${field.uid}`}
                          checked={field.required}
                          onCheckedChange={(c) =>
                            patchField(field.uid, { required: c })
                          }
                        />
                      </div>
                    </div>

                    {showOptions && (
                      <div className="space-y-2 rounded-md bg-muted/40 p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Options *</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addOption(field.uid)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {field.options.map((opt, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={opt}
                                placeholder={`Option ${i + 1}`}
                                onChange={(e) =>
                                  updateOption(field.uid, i, e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => removeOption(field.uid, i)}
                                aria-label="Remove option"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {err?.options && (
                          <p className="text-xs text-destructive">
                            {err.options}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {formFieldTypeLabel(field.type)}
                      </Badge>
                      {field.required && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-primary/10 text-primary"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEdit ? "Save changes" : "Create type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small helper export for the list page to render the field count consistently. */
export function fieldCountLabel(count: number): string {
  return count === 1 ? "1 field" : `${count} fields`;
}
