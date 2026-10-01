import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userLabel } from "@/lib/userLabel";
import {
  PEOPLE_SEARCH_MIN_LENGTH,
  searchPeople,
  type PersonSearchResult,
} from "@/services/peopleSearchService";
import { SearchCombobox } from "./SearchCombobox";

export interface PersonPickerProps {
  value: PersonSearchResult | null;
  onChange: (person: PersonSearchResult | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Pick a person by name or @username. Shows name, @username and avatar; the
 * person's id travels in the returned object and is never displayed.
 */
export function PersonPicker({ value, onChange, label, disabled, className }: PersonPickerProps) {
  const { t } = useTranslation();
  const fallback = t("common.unknownUser");
  const nameOf = (person: PersonSearchResult) =>
    userLabel({ name: person.displayName, username: person.username }, fallback);

  const renderPerson = (person: PersonSearchResult) => {
    const name = nameOf(person);
    const hasName = Boolean(person.displayName?.trim()) && name === person.displayName?.trim();
    return (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          {person.avatarUrl && <AvatarImage src={person.avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {hasName ? initials(name) : <User className="h-4 w-4" aria-hidden="true" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          {hasName && person.username && (
            <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <SearchCombobox<PersonSearchResult>
      className={className}
      label={label ?? t("peoplePicker.label")}
      placeholder={t("peoplePicker.placeholder")}
      search={searchPeople}
      getKey={(person) => person.id}
      getLabel={nameOf}
      renderOption={renderPerson}
      value={value}
      onChange={onChange}
      minLength={PEOPLE_SEARCH_MIN_LENGTH}
      disabled={disabled}
      messages={{
        minChars: t("peoplePicker.minChars", { count: PEOPLE_SEARCH_MIN_LENGTH }),
        searching: t("peoplePicker.searching"),
        noResults: t("peoplePicker.noResults"),
        error: t("peoplePicker.error"),
        results: (count) => t("peoplePicker.results", { count }),
        selected: (name) => t("peoplePicker.selected", { name }),
        clear: t("peoplePicker.clear"),
      }}
    />
  );
}
