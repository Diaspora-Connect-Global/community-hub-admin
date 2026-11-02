import { useEffect, useId, useState } from "react";
import { Briefcase, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { detectOpportunity } from "@/lib/opportunityDetection";
import {
  OPP_COMMITMENTS,
  OPP_CURRENCIES,
  OPP_DELIVERY_MODES,
  OPP_TYPES,
  TITLE_MAX,
  validateOpportunityDraft,
  type OppApplicationMethod,
  type OppAudience,
  type OppType,
  type OpportunityDraft,
  type OpportunityIssue,
} from "@/lib/postOpportunity";

/** Short-key translator supplied by each console (keys like "fTitle", "type_GRANT"). */
export type OppTr = (key: string) => string;

const MIN_CHARS = 40;
const DEBOUNCE_MS = 600;
const NONE = "__none__";

/** Debounced on-device detection: runs 600 ms after typing stops, only for >= 40 chars. */
export function useOpportunityDetection(text: string, active: boolean) {
  const [result, setResult] = useState<{ match: boolean; type: OppType | null }>({ match: false, type: null });
  useEffect(() => {
    if (!active || text.trim().length < MIN_CHARS) {
      setResult((r) => (r.match ? { match: false, type: null } : r));
      return;
    }
    const h = setTimeout(() => {
      const d = detectOpportunity(text);
      setResult({ match: d.match, type: d.suggestedType });
    }, DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [text, active]);
  return result;
}

export function OpportunityHint({ tr, onAdd, onDismiss }: { tr: OppTr; onAdd: () => void; onDismiss: () => void }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
      <p className="flex-1 min-w-[12rem]">{tr("hint")}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onAdd}>{tr("addDetails")}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onDismiss}>{tr("notNow")}</Button>
      </div>
    </div>
  );
}

export function OpportunityChip({ tr, title, onEdit, onRemove }: { tr: OppTr; title: string; onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <Briefcase className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="shrink-0 font-medium">{tr("attached")}:</span>
        <span className="truncate text-muted-foreground">{title}</span>
      </span>
      <span className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={tr("edit")} title={tr("edit")}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={tr("remove")} title={tr("remove")}>
          <X className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
}

const ISSUE_KEY: Record<OpportunityIssue, string> = {
  title: "errTitle",
  description: "errDescription",
  link: "errLink",
  email: "errEmail",
  pay: "errPay",
  payRange: "errPayRange",
  deadline: "errDeadline",
};

export function OpportunityDetailsDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  tr,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: OpportunityDraft;
  onSave: (draft: OpportunityDraft) => void;
  tr: OppTr;
}) {
  const uid = useId();
  const [d, setD] = useState<OpportunityDraft>(initial);
  const [issues, setIssues] = useState<OpportunityIssue[]>([]);

  // Re-seed each time the dialog opens (prefill comes from the post text / the saved details).
  useEffect(() => {
    if (open) {
      setD(initial);
      setIssues([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof OpportunityDraft>(k: K, v: OpportunityDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const err = (...which: OpportunityIssue[]) => which.find((i) => issues.includes(i));
  const errText = (...which: OpportunityIssue[]) => {
    const i = err(...which);
    return i ? tr(ISSUE_KEY[i]) : null;
  };
  const id = (n: string) => `${uid}-${n}`;
  const fieldErr = (n: string, ...which: OpportunityIssue[]) => {
    const text = errText(...which);
    return text ? (
      <p id={id(`${n}-err`)} role="alert" className="text-xs text-destructive">{text}</p>
    ) : null;
  };
  const invalid = (...which: OpportunityIssue[]) => (err(...which) ? true : undefined);
  const describedBy = (n: string, ...which: OpportunityIssue[]) => (err(...which) ? id(`${n}-err`) : undefined);

  const submit = () => {
    const found = validateOpportunityDraft(d);
    setIssues(found);
    if (found.length === 0) onSave(d);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{tr("dlgTitle")}</DialogTitle>
          <DialogDescription>{tr("dlgDesc")}</DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={id("title")}>{tr("fTitle")}</Label>
            <Input id={id("title")} value={d.title} maxLength={TITLE_MAX} onChange={(e) => set("title", e.target.value)}
              aria-invalid={invalid("title")} aria-describedby={describedBy("title", "title")} />
            {fieldErr("title", "title")}
          </div>

          <div className="space-y-1">
            <Label htmlFor={id("desc")}>{tr("fDescription")}</Label>
            <Textarea id={id("desc")} rows={5} value={d.description} onChange={(e) => set("description", e.target.value)}
              aria-invalid={invalid("description")} aria-describedby={describedBy("desc", "description")} />
            {fieldErr("desc", "description")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={id("type")}>{tr("fType")}</Label>
              <Select value={d.type} onValueChange={(v) => set("type", v as OppType)}>
                <SelectTrigger id={id("type")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPP_TYPES.map((t) => <SelectItem key={t} value={t}>{tr(`type_${t}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={id("aud")}>{tr("fAudience")}</Label>
              <Select value={d.audience} onValueChange={(v) => set("audience", v as OppAudience)}>
                <SelectTrigger id={id("aud")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">{tr("audPublic")}</SelectItem>
                  <SelectItem value="MEMBERS">{tr("audMembers")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={id("apply")}>{tr("fApply")}</Label>
            <Select value={d.applicationMethod} onValueChange={(v) => set("applicationMethod", v as OppApplicationMethod)}>
              <SelectTrigger id={id("apply")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PLATFORM_FORM">{tr("applyForm")}</SelectItem>
                <SelectItem value="EXTERNAL_LINK">{tr("applyLink")}</SelectItem>
                <SelectItem value="EMAIL_REQUEST">{tr("applyEmail")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {d.applicationMethod === "EXTERNAL_LINK" && (
            <div className="space-y-1">
              <Label htmlFor={id("link")}>{tr("fLink")}</Label>
              <Input id={id("link")} type="url" inputMode="url" placeholder="https://" value={d.externalLink}
                onChange={(e) => set("externalLink", e.target.value)}
                aria-invalid={invalid("link")} aria-describedby={describedBy("link", "link")} />
              {fieldErr("link", "link")}
            </div>
          )}
          {d.applicationMethod === "EMAIL_REQUEST" && (
            <div className="space-y-1">
              <Label htmlFor={id("email")}>{tr("fEmail")}</Label>
              <Input id={id("email")} type="email" value={d.applicationEmail}
                onChange={(e) => set("applicationEmail", e.target.value)}
                aria-invalid={invalid("email")} aria-describedby={describedBy("email", "email")} />
              {fieldErr("email", "email")}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor={id("loc")}>{tr("fLocation")}</Label>
            <Input id={id("loc")} value={d.location} maxLength={300} onChange={(e) => set("location", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={id("del")}>{tr("fDelivery")}</Label>
              <Select value={d.deliveryMode || NONE} onValueChange={(v) => set("deliveryMode", v === NONE ? "" : v)}>
                <SelectTrigger id={id("del")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tr("notSet")}</SelectItem>
                  {OPP_DELIVERY_MODES.map((m) => <SelectItem key={m} value={m}>{tr(`del_${m}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={id("com")}>{tr("fCommitment")}</Label>
              <Select value={d.commitmentType || NONE} onValueChange={(v) => set("commitmentType", v === NONE ? "" : v)}>
                <SelectTrigger id={id("com")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tr("notSet")}</SelectItem>
                  {OPP_COMMITMENTS.map((m) => <SelectItem key={m} value={m}>{tr(`com_${m}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={id("min")}>{tr("fPayMin")}</Label>
              <Input id={id("min")} inputMode="decimal" value={d.payMin} onChange={(e) => set("payMin", e.target.value)}
                aria-invalid={invalid("pay", "payRange")} aria-describedby={describedBy("pay", "pay", "payRange")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={id("max")}>{tr("fPayMax")}</Label>
              <Input id={id("max")} inputMode="decimal" value={d.payMax} onChange={(e) => set("payMax", e.target.value)}
                aria-invalid={invalid("pay", "payRange")} aria-describedby={describedBy("pay", "pay", "payRange")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={id("cur")}>{tr("fCurrency")}</Label>
              <Select value={d.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger id={id("cur")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPP_CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{tr("payHint")}</p>
          {fieldErr("pay", "pay", "payRange")}

          <div className="space-y-1">
            <Label htmlFor={id("dl")}>{tr("fDeadline")}</Label>
            <Input id={id("dl")} type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)}
              aria-invalid={invalid("deadline")} aria-describedby={describedBy("dl", "deadline")} />
            {fieldErr("dl", "deadline")}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tr("cancel")}</Button>
            <Button type="submit">{tr("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
