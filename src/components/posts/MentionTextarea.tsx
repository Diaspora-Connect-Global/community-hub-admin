import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Hash, Loader2, User as UserIcon, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  searchMentionCandidates,
  type MentionCandidate,
} from "@/services/mentionSearchService";
import type { MentionInput } from "@/services/graphql/posts";
import { fetchTrendingHashtags } from "@/services/hashtagService";
import { filterHashtags, findActiveHashtagQuery, type TrendingHashtag } from "@/lib/hashtags";

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
  const { t } = useTranslation();
  const listId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const requestSeqRef = useRef(0);
  const [mentions, setMentions] = useState<MentionInput[]>(initialMentions ?? []);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  // #hashtag suggestions: list fetched lazily once per composer, filtered client-side.
  const [hashQuery, setHashQuery] = useState<string | null>(null);
  const [hashStart, setHashStart] = useState<number | null>(null);
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const trendingRequestedRef = useRef(false);
  const hashSuggestions = useMemo(
    () => (hashQuery === null ? [] : filterHashtags(trending, hashQuery)),
    [trending, hashQuery],
  );

  useEffect(() => {
    if (hashQuery === null || trendingRequestedRef.current) return;
    trendingRequestedRef.current = true;
    void fetchTrendingHashtags().then(setTrending);
  }, [hashQuery]);

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
      const tag = findActiveHashtagQuery(text, caret);
      if (tag) {
        if (tag.query !== hashQuery) setHighlightIndex(0);
        setHashQuery(tag.query);
        setHashStart(tag.start);
      } else {
        setHashQuery(null);
        setHashStart(null);
      }
      return;
    }
    setHashQuery(null);
    setHashStart(null);
    setActiveQuery(found.query);
    setQueryStart(found.start);
  };

  /** Keep mention offsets valid when text is inserted before them. */
  const shiftMentions = (at: number, delta: number) =>
    setMentions((prev) =>
      prev.map((m) =>
        m.startPosition >= at
          ? { ...m, startPosition: m.startPosition + delta, endPosition: m.endPosition + delta }
          : m,
      ),
    );

  const focusCaret = (pos: number) =>
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });

  const insertHashtag = (tag: string) => {
    if (hashStart === null) return;
    const caret = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, hashStart);
    const after = value.slice(caret);
    const inserted = `#${tag} `;
    onChange(`${before}${inserted}${after}`);
    shiftMentions(caret, inserted.length - (caret - hashStart));
    setHashQuery(null);
    setHashStart(null);
    focusCaret(before.length + inserted.length);
  };

  /** Toolbar "#" button: insert '#' at the caret and open the suggestions. */
  const insertHashSymbol = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const needsSpace = start > 0 && !/\s/.test(value[start - 1]);
    const inserted = needsSpace ? " #" : "#";
    const next = `${value.slice(0, start)}${inserted}${value.slice(end)}`;
    onChange(next);
    shiftMentions(end, inserted.length - (end - start));
    const caret = start + inserted.length;
    setHighlightIndex(0);
    setHashQuery("");
    setHashStart(caret - 1);
    focusCaret(caret);
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
    if (hashQuery !== null) {
      if (event.key === "Escape") {
        setHashQuery(null);
        setHashStart(null);
        return;
      }
      if (hashSuggestions.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((idx) => (idx + 1) % hashSuggestions.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((idx) => (idx - 1 + hashSuggestions.length) % hashSuggestions.length);
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertHashtag(hashSuggestions[Math.min(highlightIndex, hashSuggestions.length - 1)]);
      }
      return;
    }
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

  const showMentionList = activeQuery !== null && (loadingCandidates || candidates.length > 0);
  const showHashList = hashQuery !== null && hashSuggestions.length > 0;
  const expanded = showMentionList || showHashList;
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const activeIndex = showHashList
    ? Math.min(highlightIndex, hashSuggestions.length - 1)
    : Math.min(highlightIndex, Math.max(candidates.length - 1, 0));
  const hasActiveOption = expanded && (showHashList ? hashSuggestions.length > 0 : candidates.length > 0);

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
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={hasActiveOption ? optionId(activeIndex) : undefined}
      />
      <div className="mt-1 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={insertHashSymbol}
          aria-label={t("composer.insertHashtag")}
          title={t("composer.insertHashtag")}
        >
          <Hash className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {showHashList && (
        <div
          id={listId}
          role="listbox"
          aria-label={t("composer.hashtagSuggestions")}
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
        >
          {hashSuggestions.map((tag, index) => (
            <div
              key={tag}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                insertHashtag(tag);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm",
                index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              <Hash className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="truncate font-medium">{tag}</span>
            </div>
          ))}
        </div>
      )}
      {showMentionList && (
        <div
          id={listId}
          role="listbox"
          aria-label={t("composer.mentionSuggestions")}
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
        >
          {loadingCandidates && candidates.length === 0 && (
            <div role="status" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {t("composer.searching")}
            </div>
          )}
          {candidates.map((candidate, index) => {
            const Icon = getMentionEntityIcon(candidate.entityType);
            return (
              <div
                key={`${candidate.entityType}-${candidate.entityId}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(candidate);
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm",
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
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
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
