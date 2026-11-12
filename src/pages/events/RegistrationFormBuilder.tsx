/**
 * Registration section of the event form: "Where do people register?" plus the
 * organiser's form builder (default fields, own questions, reorder, options).
 * All state lives in the parent's EventFormState; this only renders and edits it.
 */
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ClipboardList, Loader2, Plus, RotateCcw, X } from "lucide-react";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventFormState } from "@/pages/events/types";
import {
  MAX_REGISTRATION_FIELDS,
  REGISTRATION_FIELD_TYPES,
  emptyQuestionDraft,
  isChoiceType,
  missingBuiltinIds,
  moveDraft,
  normalizeRegistrationLink,
  restoreDefaultFields,
  validateDrafts,
  withType,
  type RegistrationFieldDraft,
  type RegistrationFieldType,
} from "@/lib/eventRegistrationForm";

/** The translated name of a field: defaults by id, the organiser's own as typed. */
export function registrationFieldName(
  field: Pick<RegistrationFieldDraft, "builtin" | "label">,
  t: TFunction,
): string {
  return field.builtin
    ? t(`events.registration.default_${field.builtin}`, { defaultValue: field.label })
    : field.label;
}

interface Props {
  mode: "create" | "edit";
  form: EventFormState;
  onChange: (patch: Partial<EventFormState>) => void;
  /** Show field problems (after a failed save), not while the organiser is still typing. */
  showErrors?: boolean;
}

export function RegistrationSection({ mode, form, onChange, showErrors = false }: Props) {
  const { t } = useTranslation();
  const tr = (key: string, opts?: Record<string, unknown>) => t(`events.registration.${key}`, opts);
  const p = `${mode}-reg`;
  const drafts = form.registrationFields;
  const validation = validateDrafts(drafts);
  const errorByUid = new Map(validation.errors.filter(() => showErrors).map((e) => [e.uid, e.code]));
  const missing = missingBuiltinIds(drafts);
  const linkTouched = form.registrationLink.trim().length > 0;
  const linkInvalid = linkTouched && normalizeRegistrationLink(form.registrationLink) === null;

  const setFields = (registrationFields: RegistrationFieldDraft[]) => onChange({ registrationFields });
  const patchField = (uid: string, patch: Partial<RegistrationFieldDraft>) =>
    setFields(drafts.map((d) => (d.uid === uid ? { ...d, ...patch } : d)));

  const showSwitchWarning =
    form.registrationMode === "EXTERNAL" &&
    form.savedRegistrationMode !== "EXTERNAL" &&
    form.registeredCount > 0;

  if (mode === "edit" && form.registrationState === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("common.loading", { defaultValue: "Loading…" })}
      </p>
    );
  }
  if (mode === "edit" && form.registrationState === "error") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("common.errorTryAgain")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label id={`${p}-where`}>{tr("where")}</Label>
        <RadioGroup
          aria-labelledby={`${p}-where`}
          value={form.registrationMode}
          onValueChange={(v) => onChange({ registrationMode: v as EventFormState["registrationMode"] })}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="IN_APP" id={`${p}-inapp`} />
            <Label htmlFor={`${p}-inapp`} className="cursor-pointer">{tr("inApp")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="EXTERNAL" id={`${p}-external`} />
            <Label htmlFor={`${p}-external`} className="cursor-pointer">{tr("external")}</Label>
          </div>
        </RadioGroup>
      </div>

      {form.registrationMode === "EXTERNAL" ? (
        <div className="space-y-2">
          <Label htmlFor={`${p}-url`}>{tr("urlLabel")}</Label>
          <Input
            id={`${p}-url`}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder={tr("urlPlaceholder")}
            value={form.registrationLink}
            aria-invalid={linkInvalid}
            aria-describedby={`${p}-url-help`}
            onChange={(e) => onChange({ registrationLink: e.target.value })}
          />
          <p id={`${p}-url-help`} className={`text-xs ${linkInvalid ? "text-destructive" : "text-muted-foreground"}`}>
            {linkInvalid ? tr("urlInvalid") : tr("urlHelp")}
          </p>
          {showSwitchWarning && (
            <p className="rounded-md bg-warning/10 p-2 text-xs text-warning" role="status">
              {tr("alreadyRegistered", { count: form.registeredCount })}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {tr("formTitle")}
            </h4>
            <p className="text-xs text-muted-foreground">{tr("formHelp")}</p>
            {form.registeredCount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{tr("existingNote")}</p>
            )}
          </div>

          {drafts.length === 0 && <p className="text-sm text-muted-foreground">{tr("emptyForm")}</p>}

          <ul className="space-y-3">
            {drafts.map((field, index) => {
              const name = registrationFieldName(field, t) || `${tr("question")} ${index + 1}`;
              const err = errorByUid.get(field.uid);
              const fid = `${p}-f${field.uid}`;
              return (
                <li key={field.uid} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 break-words text-sm font-medium">
                      {field.builtin ? name : `${tr("question")} ${index + 1}`}
                    </span>
                    {field.builtin && <Badge variant="secondary">{tr("defaultBadge")}</Badge>}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0}
                        aria-label={tr("moveUp", { name })}
                        onClick={() => setFields(moveDraft(drafts, index, -1))}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === drafts.length - 1}
                        aria-label={tr("moveDown", { name })}
                        onClick={() => setFields(moveDraft(drafts, index, 1))}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={tr("remove", { name })}
                        onClick={() => setFields(drafts.filter((d) => d.uid !== field.uid))}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {!field.builtin && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor={`${fid}-label`} className="text-xs">{tr("question")}</Label>
                        <Input
                          id={`${fid}-label`}
                          value={field.label}
                          maxLength={150}
                          placeholder={tr("questionPlaceholder")}
                          aria-invalid={err === "label_required" || err === "label_too_long"}
                          onChange={(e) => patchField(field.uid, { label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${fid}-type`} className="text-xs">{tr("answerType")}</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            setFields(drafts.map((d) => (d.uid === field.uid ? withType(d, v as RegistrationFieldType) : d)))
                          }
                        >
                          <SelectTrigger id={`${fid}-type`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REGISTRATION_FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{tr(`type_${type}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {!field.builtin && isChoiceType(field.type) && (
                    <fieldset className="space-y-2">
                      <legend className="text-xs font-medium">{tr("options")}</legend>
                      {field.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            maxLength={80}
                            aria-label={tr("optionN", { index: i + 1 })}
                            onChange={(e) =>
                              patchField(field.uid, { options: field.options.map((o, j) => (j === i ? e.target.value : o)) })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label={tr("removeOption", { index: i + 1 })}
                            onClick={() => patchField(field.uid, { options: field.options.filter((_, j) => j !== i) })}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => patchField(field.uid, { options: [...field.options, ""] })}
                      >
                        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                        {tr("addOption")}
                      </Button>
                    </fieldset>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${fid}-req`}
                      checked={field.required}
                      onCheckedChange={(v) => patchField(field.uid, { required: v })}
                      aria-label={`${tr("required")}: ${name}`}
                    />
                    <Label htmlFor={`${fid}-req`} className="text-sm">{tr("required")}</Label>
                  </div>

                  {err && (
                    <p className="text-xs text-destructive" role="alert">{tr(`err_${err}`)}</p>
                  )}
                </li>
              );
            })}
          </ul>

          {validation.tooMany && (
            <p className="text-xs text-destructive" role="alert">{tr("err_too_many")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={drafts.length >= MAX_REGISTRATION_FIELDS}
              onClick={() => setFields([...drafts, emptyQuestionDraft()])}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {tr("addQuestion")}
            </Button>
            {missing.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setFields(restoreDefaultFields(drafts))}>
                <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                {drafts.length === 0 ? tr("addDefaults") : tr("restore")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
