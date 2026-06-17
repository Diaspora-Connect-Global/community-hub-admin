/**
 * Renders a single registry `RegistryFormField` definition as the appropriate
 * shadcn input, controlled by a flat string value.
 *
 * Value encoding (matches `serializeFieldResponses` in ./types):
 *   - TEXT / NUMBER / DATE / EMAIL / TEXTAREA / SELECT / RADIO: the raw string.
 *   - CHECKBOX: a comma-joined list of the selected option labels.
 *   - FILE_UPLOAD: the uploaded file's URL (entered/pasted as a string here; the
 *     signed-upload flow is handled separately for bulk import — single-entry
 *     file fields accept a URL string).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { RegistryFormField } from "@/services/graphql/registry";

interface DynamicFieldRendererProps {
  field: RegistryFormField;
  value: string;
  onChange: (value: string) => void;
  idPrefix?: string;
}

function splitChecked(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  idPrefix = "df",
}: DynamicFieldRendererProps) {
  const id = `${idPrefix}-${field.key}`;
  const labelNode = (
    <Label htmlFor={id}>
      {field.label || field.key}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  );

  switch (field.type) {
    case "TEXTAREA":
      return (
        <div className="space-y-2">
          {labelNode}
          <Textarea
            id={id}
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "NUMBER":
      return (
        <div className="space-y-2">
          {labelNode}
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "DATE":
      return (
        <div className="space-y-2">
          {labelNode}
          <Input
            id={id}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "EMAIL":
      return (
        <div className="space-y-2">
          {labelNode}
          <Input
            id={id}
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "SELECT":
      return (
        <div className="space-y-2">
          {labelNode}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "RADIO":
      return (
        <div className="space-y-2">
          {labelNode}
          <RadioGroup value={value} onValueChange={onChange} className="space-y-1">
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${id}-${opt}`} />
                <Label htmlFor={`${id}-${opt}`} className="cursor-pointer font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "CHECKBOX": {
      const selected = splitChecked(value);
      const toggle = (opt: string, checked: boolean) => {
        const next = checked
          ? [...selected, opt]
          : selected.filter((s) => s !== opt);
        onChange(next.join(", "));
      };
      return (
        <div className="space-y-2">
          {labelNode}
          <div className="space-y-1">
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${id}-${opt}`}
                  checked={selected.includes(opt)}
                  onCheckedChange={(c) => toggle(opt, c === true)}
                />
                <Label htmlFor={`${id}-${opt}`} className="cursor-pointer font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "FILE_UPLOAD":
      return (
        <div className="space-y-2">
          {labelNode}
          <Input
            id={id}
            type="url"
            placeholder="https://… (file URL)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "TEXT":
    default:
      return (
        <div className="space-y-2">
          {labelNode}
          <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
  }
}
