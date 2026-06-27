import { useEffect, useState } from "react";
import { Loader2, Send, Upload, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type {
  ResourceSummary,
  ResourceCategory,
  ResourceFileType,
  ResourceVisibility,
  CreateResourceInput,
  UpdateResourceInput,
} from "@/services/graphql/resources";
import {
  FILE_TYPES,
  VISIBILITIES,
  fileTypeLabel,
  visibilityLabel,
} from "./types";

/** Currency options for the download fee. EUR default (matches existing seed data). */
const CURRENCY_OPTIONS = ["EUR", "USD", "GBP", "GHS", "NGN", "XOF", "CAD"];

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The resource being edited, or null for create mode. */
  editingResource: ResourceSummary | null;
  /** Active owner categories for the multi-select. */
  categories: ResourceCategory[];
  saving: boolean;
  onCreate: (input: CreateResourceInput, file: File | null) => Promise<void>;
  onUpdate: (input: UpdateResourceInput, file: File | null) => Promise<void>;
}

/**
 * Create / edit dialog for a Resource. On create it builds a `CreateResourceInput`
 * (ownerType/ownerEntityId are injected by the page) and hands back any chosen
 * file so the page can run the upload flow against the new id. On edit it sends
 * an `UpdateResourceInput` plus any replacement file.
 *
 * The download fee is entered in MAJOR units and converted to integer minor
 * units (×100) on submit; blank / 0 is omitted (free).
 */
export function ResourceDialog({
  open,
  onOpenChange,
  editingResource,
  categories,
  saving,
  onCreate,
  onUpdate,
}: ResourceDialogProps) {
  const isEdit = !!editingResource;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState<ResourceFileType>("PDF");
  const [visibility, setVisibility] = useState<ResourceVisibility>(
    "COMMUNITY_MEMBERS",
  );
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState(""); // comma-separated
  const [feeMajor, setFeeMajor] = useState(""); // major-units string input
  const [feeCurrency, setFeeCurrency] = useState("EUR");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the dialog opens or the target resource changes.
  useEffect(() => {
    if (!open) return;
    if (editingResource) {
      setTitle(editingResource.title);
      setDescription(""); // summary projection carries no description; left blank
      setFileType((editingResource.fileType as ResourceFileType) ?? "PDF");
      setVisibility(
        (editingResource.visibility as ResourceVisibility) ?? "COMMUNITY_MEMBERS",
      );
      setCategoryIds(editingResource.categoryIds ?? []);
      setTagsInput((editingResource.tags ?? []).join(", "));
      setFeeMajor("");
      setFeeCurrency("EUR");
    } else {
      setTitle("");
      setDescription("");
      setFileType("PDF");
      setVisibility("COMMUNITY_MEMBERS");
      setCategoryIds([]);
      setTagsInput("");
      setFeeMajor("");
      setFeeCurrency("EUR");
    }
    setFile(null);
    setError(null);
  }, [open, editingResource]);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (feeMajor.trim()) {
      const n = Number(feeMajor);
      if (!Number.isFinite(n) || n < 0) return "Fee must be a non-negative number.";
    }
    if (!feeCurrency) return "Currency is required.";
    return null;
  };

  const parseTags = (): string[] =>
    tagsInput
      .split(",")
      .map((tg) => tg.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    const err = validate();
    setError(err);
    if (err) {
      toast({ title: "Validation", description: err, variant: "destructive" });
      return;
    }

    const feeMinor = feeMajor.trim()
      ? Math.round(Number(feeMajor) * 100)
      : undefined;
    const tags = parseTags();

    if (isEdit && editingResource) {
      const input: UpdateResourceInput = {
        id: editingResource.id,
        title: title.trim(),
        description: description.trim() || null,
        fileType,
        categoryIds,
        tags,
      };
      // Fee: a positive value sets it; an explicit 0 clears it back to free.
      if (feeMinor !== undefined) {
        if (feeMinor > 0) {
          input.downloadFeeMinor = feeMinor;
          input.feeCurrency = feeCurrency;
        } else {
          input.clearFee = true;
        }
      }
      await onUpdate(input, file);
    } else {
      const input: CreateResourceInput = {
        ownerType: "COMMUNITY",
        // ownerEntityId is injected by the page so we never hardcode it here.
        title: title.trim(),
        description: description.trim() || undefined,
        fileType,
        visibility,
        categoryIds,
        tags,
      };
      if (feeMinor && feeMinor > 0) {
        input.downloadFeeMinor = feeMinor;
        input.feeCurrency = feeCurrency;
      }
      await onCreate(input, file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Resource" : "New Resource"}
          </DialogTitle>
          <DialogDescription>
            Add a document to your community's resource library. New resources
            start as a draft until you publish them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="res-title">Title *</Label>
            <Input
              id="res-title"
              value={title}
              placeholder="e.g. Passport Renewal Guide"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">Description</Label>
            <Textarea
              id="res-desc"
              value={description}
              rows={3}
              placeholder="Short description shown to members."
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>File type</Label>
              <Select
                value={fileType}
                onValueChange={(v) => setFileType(v as ResourceFileType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {fileTypeLabel(ft)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as ResourceVisibility)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {visibilityLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Visibility is managed via access settings after creation.
                </p>
              )}
            </div>
          </div>

          {/* Categories multi-select */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No categories available for this community yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-border p-3">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={categoryIds.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <span className="text-foreground">{cat.displayName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-tags">Tags</Label>
            <Input
              id="res-tags"
              value={tagsInput}
              placeholder="Comma-separated, e.g. passport, embassy, forms"
              onChange={(e) => setTagsInput(e.target.value)}
            />
            {parseTags().length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parseTags().map((tg) => (
                  <Badge key={tg} variant="secondary" className="text-[10px]">
                    {tg}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="res-fee">Download fee</Label>
              <Input
                id="res-fee"
                type="number"
                min="0"
                step="0.01"
                value={feeMajor}
                placeholder="0.00"
                onChange={(e) => setFeeMajor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Major units. Leave blank or 0 for free.
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
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="res-file">File {isEdit ? "(replace)" : ""}</Label>
            <Input
              id="res-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setFile(null)}
                  aria-label="Remove selected file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? "Optional — choose a file to upload a new version."
                  : "Optional — you can upload the file now or later by editing."}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
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
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEdit ? "Save changes" : "Create resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
