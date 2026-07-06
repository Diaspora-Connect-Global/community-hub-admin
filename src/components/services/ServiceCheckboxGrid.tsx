import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALL_SERVICE_KEYS,
  COMMUNITY_SERVICES,
  sortServiceKeys,
} from "@/constants/communityServices";

interface ServiceCheckboxGridProps {
  /** Currently-selected service keys. */
  value: string[];
  /** Called with the next selection whenever a service is toggled or bulk action fires. */
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  /** Unique prefix so multiple grids on one page keep distinct checkbox ids. */
  idPrefix?: string;
}

/**
 * Reusable checkbox list of the canonical service catalog. Presentation only —
 * the parent owns the selected state and receives the next list via `onChange`.
 */
export function ServiceCheckboxGrid({
  value,
  onChange,
  disabled = false,
  idPrefix = "service",
}: ServiceCheckboxGridProps) {
  const { t } = useTranslation();
  const selectedSet = new Set(value);

  const toggle = (key: string) => {
    const next = new Set(value);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(sortServiceKeys([...next]));
  };

  const selectAll = () => onChange([...ALL_SERVICE_KEYS]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={selectAll}
          disabled={disabled}
        >
          {t("settings.services.selectAll")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={disabled}
        >
          {t("settings.services.clearAll")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COMMUNITY_SERVICES.map((service) => {
          const Icon = service.icon;
          const checkboxId = `${idPrefix}-${service.key}`;
          return (
            <Label
              key={service.key}
              htmlFor={checkboxId}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                id={checkboxId}
                checked={selectedSet.has(service.key)}
                onCheckedChange={() => toggle(service.key)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{service.label}</span>
                </div>
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </Label>
          );
        })}
      </div>
    </div>
  );
}
