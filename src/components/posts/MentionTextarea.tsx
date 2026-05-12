import { useEffect, useRef, useState } from "react";
import { Loader2, User as UserIcon, Users, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  searchMentionCandidates,
  type MentionCandidate,
} from "@/services/mentionSearchService";
import type { MentionInput } from "@/services/graphql/posts";

interface MentionTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: MentionInput[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  initialMentions?: MentionInput[];
}

function getMentionEntityIcon(type: MentionCandidate["entityType"]) {
  if (type === "COMMUNITY") return Users;
  if (type === "ASSOCIATION") return Building2;
  return UserIcon;
}

function findActiveMentionQuery(text: string, caret: number): { query: string; start: number } | null {
  if (caret <= 0) return null;
  let i = caret - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === "@") {
      const before = i === 0 ? " " : text[i - 1];
      if (/\s/.test(before) || before === "@" || i === 0) {
        return { query: text.slice(i + 1, caret), start: i };
      }
      return null;
    }
    if (/\s/.test(ch)) return null;
    i -= 1;
  }
  return null;
}

export function MentionTextarea({
  id,
  value,
  onChange,
  onMentionsChange,
  placeholder,
  rows = 6,
  className,
  initialMentions,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const requestSeqRef = useRef(0);
  const [mentions, setMentions] = useState<MentionInput[]>(initialMentions ?? []);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    onMentionsChange?.(mentions);
  }, [mentions, onMentionsChange]);

  useEffect(() => {
    if (activeQuery === null) {
      setCandidates([]);
      return;
    }
    const trimmed = activeQuery.trim();
    if (trimmed.length === 0) {
      setCandidates([]);
      setLoadingCandidates(false);
      return;
    }

    const seq = ++requestSeqRef.current;
    setLoadingCandidates(true);
    const handle = setTimeout(async () => {
      try {
        const results = await searchMentionCandidates(trimmed);
        if (seq === requestSeqRef.current) {
          setCandidates(results);
          setHighlightIndex(0);
        }
      } finally {
        if (seq === requestSeqRef.current) setLoadingCandidates(false);
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [activeQuery]);

  const updateActiveQuery = (text: string, caret: number) => {
    const found = findActiveMentionQuery(text, caret);
    if (!found) {
      setActiveQuery(null);
      setQueryStart(null);
      return;
    }
    setActiveQuery(found.query);
    setQueryStart(found.start);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    onChange(next);
    setMentions((prev) => prev.filter((m) => next.slice(m.startPosition, m.endPosition) === `@${m.displayName}`));
    updateActiveQuery(next, event.target.selectionStart ?? next.length);
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    updateActiveQuery(target.value, target.selectionStart ?? target.value.length);
  };

  const insertMention = (candidate: MentionCandidate) => {
    if (queryStart === null) return;
    const textarea = textareaRef.current;
    const caret = textarea?.selectionStart ?? value.length;
    const before = value.slice(0, queryStart);
    const after = value.slice(caret);
    const inserted = `@${candidate.displayName}`;
    const nextText = `${before}${inserted} ${after}`;
    const startPosition = before.length;
    const endPosition = startPosition + inserted.length;

    onChange(nextText);
    setMentions((prev) => [
      ...prev,
      {
        entityId: candidate.entityId,
        entityType: candidate.entityType,
        displayName: candidate.displayName,
        startPosition,
        endPosition,
      },
    ]);
    setActiveQuery(null);
    setQueryStart(null);
    setCandidates([]);

    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      const nextCaret = endPosition + 1;
      t.focus();
      t.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeQuery === null || candidates.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((idx) => (idx + 1) % candidates.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((idx) => (idx - 1 + candidates.length) % candidates.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertMention(candidates[highlightIndex]);
    } else if (event.key === "Escape") {
      setActiveQuery(null);
      setQueryStart(null);
    }
  };

  const showDropdown = activeQuery !== null && (loadingCandidates || candidates.length > 0);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {loadingCandidates && candidates.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}
          {candidates.map((candidate, index) => {
            const Icon = getMentionEntityIcon(candidate.entityType);
            return (
              <button
                key={`${candidate.entityType}-${candidate.entityId}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(candidate);
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                  index === highlightIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                )}
              >
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt=""
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{candidate.displayName}</p>
                  {candidate.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{candidate.subtitle}</p>
                  )}
                </div>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {candidate.entityType.toLowerCase()}
                </span>
              </button>
            );
          })}
          {!loadingCandidates && candidates.length === 0 && activeQuery && activeQuery.trim().length > 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
