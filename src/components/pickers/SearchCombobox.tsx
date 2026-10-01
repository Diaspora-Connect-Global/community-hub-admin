import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSearchAsYouType } from "@/hooks/useSearchAsYouType";

export interface SearchComboboxMessages {
  /** Shown/announced while the term is shorter than `minLength`. */
  minChars: string;
  searching: string;
  noResults: string;
  error: string;
  results: (count: number) => string;
  selected: (label: string) => string;
  /** Accessible name of the "clear selection" button. */
  clear: string;
}

export interface SearchComboboxProps<T> {
  label: string;
  placeholder?: string;
  /** Must be stable (module-level function or memoised); see useSearchAsYouType. */
  search: (term: string, signal: AbortSignal) => Promise<T[]>;
  /** React key only — never rendered. */
  getKey: (item: T) => string;
  /** Human label of an item, used for announcements and the clear button. */
  getLabel: (item: T) => string;
  renderOption: (item: T) => ReactNode;
  /** A reason string makes the option visible but not selectable (e.g. "Already linked"). */
  getDisabledReason?: (item: T) => string | null;
  value: T | null;
  onChange: (item: T | null) => void;
  messages: SearchComboboxMessages;
  minLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Search-as-you-type picker following the WAI-ARIA editable combobox pattern
 * (list autocomplete, manual selection): the input owns focus, the active
 * option is exposed through aria-activedescendant, and result counts are
 * announced through a polite live region. Items are identified to the caller by
 * object, so no id ever needs to be typed or shown.
 *
 * The listbox renders in normal flow (not a floating layer) so it is never
 * clipped by a dialog's overflow.
 */
export function SearchCombobox<T>({
  label,
  placeholder,
  search,
  getKey,
  getLabel,
  renderOption,
  getDisabledReason,
  value,
  onChange,
  messages,
  minLength = 2,
  debounceMs = 300,
  disabled,
  className,
}: SearchComboboxProps<T>) {
  const baseId = `combobox-${useId().replace(/:/g, "")}`;
  const inputId = `${baseId}-input`;
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { status, results } = useSearchAsYouType(query, search, { minLength, debounceMs });

  const inputRef = useRef<HTMLInputElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const focusAfterChange = useRef<"clear" | "input" | null>(null);

  const listVisible = open && !value && results.length > 0 && (status === "success" || status === "loading");
  const active = listVisible && activeIndex < results.length ? activeIndex : -1;

  // Keep focus on something meaningful when the input is swapped for the selection and back.
  useEffect(() => {
    if (focusAfterChange.current === "clear" && value) clearRef.current?.focus();
    if (focusAfterChange.current === "input" && !value) inputRef.current?.focus();
    focusAfterChange.current = null;
  }, [value]);

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
    // optionId is derived from baseId, which is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Escape closes the suggestions, not the dialog around the picker: Radix listens for
  // Escape on the document in the capture phase, so intercept it one level up first.
  useEffect(() => {
    if (!listVisible) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || document.activeElement !== inputRef.current) return;
      event.stopPropagation();
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [listVisible]);

  const select = (item: T) => {
    if (getDisabledReason?.(item)) return;
    focusAfterChange.current = "clear";
    onChange(item);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  };

  const clear = () => {
    focusAfterChange.current = "input";
    onChange(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        if (count > 0) setActiveIndex((i) => (i < 0 || i >= count - 1 ? 0 : i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setOpen(true);
        if (count > 0) setActiveIndex((i) => (i <= 0 || i >= count ? count - 1 : i - 1));
        break;
      case "Enter":
        if (active >= 0) {
          event.preventDefault();
          select(results[active]);
        }
        break;
      case "Escape":
        // Reached only when the list is closed (see the capture listener above).
        if (query) {
          event.preventDefault();
          setQuery("");
        }
        break;
      default:
        break;
    }
  };

  let statusMessage = "";
  if (value) statusMessage = messages.selected(getLabel(value));
  else if (status === "tooShort") statusMessage = messages.minChars;
  else if (status === "loading") statusMessage = messages.searching;
  else if (status === "error") statusMessage = messages.error;
  else if (status === "success") {
    statusMessage = results.length > 0 ? messages.results(results.length) : messages.noResults;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label id={labelId} htmlFor={value ? undefined : inputId}>
        {label}
      </Label>

      {value ? (
        <div
          role="group"
          aria-labelledby={labelId}
          className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2"
        >
          <div className="min-w-0 flex-1">{renderOption(value)}</div>
          <Button
            ref={clearRef}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`${messages.clear}: ${getLabel(value)}`}
            onClick={clear}
            disabled={disabled}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listVisible}
              aria-controls={listboxId}
              aria-activedescendant={active >= 0 ? optionId(active) : undefined}
              autoComplete="off"
              spellCheck={false}
              className="pl-9"
              placeholder={placeholder}
              value={query}
              disabled={disabled}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            hidden={!listVisible}
            className="max-h-64 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-sm"
          >
            {results.map((item, index) => {
              const reason = getDisabledReason?.(item) ?? null;
              return (
                <li
                  key={getKey(item)}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  aria-disabled={reason ? true : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm",
                    reason ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    index === active && "bg-accent text-accent-foreground",
                  )}
                  // Keep focus in the input so the list doesn't close before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(item)}
                >
                  <div className="min-w-0 flex-1">{renderOption(item)}</div>
                  {reason && <span className="shrink-0 text-xs text-muted-foreground">{reason}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p role="status" aria-live="polite" className="flex min-h-[1rem] items-center gap-1.5 text-xs text-muted-foreground">
        {status === "loading" && !value && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {statusMessage}
      </p>
    </div>
  );
}
