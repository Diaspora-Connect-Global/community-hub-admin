/**
 * Pure helpers behind the post view (admin Posts page). Kept free of React so
 * they are unit-testable.
 */

export type ReactionKind = "HAPPY" | "HOPEFUL" | "SAD";

export interface ReactionsPageLike {
  total?: number | null;
  happy?: number | null;
  hopeful?: number | null;
  sad?: number | null;
}

export interface ReactionSummary {
  total: number;
  happy: number;
  hopeful: number;
  sad: number;
}

const toCount = (n: unknown): number => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
};

/**
 * Headline comes from `total` (it includes pre-migration likes that carry no
 * type), never from the sum of the three kinds.
 */
export function toReactionSummary(page: ReactionsPageLike | null | undefined): ReactionSummary {
  const happy = toCount(page?.happy);
  const hopeful = toCount(page?.hopeful);
  const sad = toCount(page?.sad);
  const total = Math.max(toCount(page?.total), happy + hopeful + sad);
  return { total, happy, hopeful, sad };
}

export function normaliseReactionKind(raw: string | null | undefined): ReactionKind {
  const v = (raw ?? "").toUpperCase();
  // A pre-migration like has no type and is displayed as Happy.
  if (v === "HOPEFUL" || v === "SAD") return v;
  return "HAPPY";
}

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  HAPPY: "😊",
  HOPEFUL: "🙏",
  SAD: "😢",
};

/** Display name for a person: never an id. */
export function displayNameOrFallback(
  name: string | null | undefined,
  handle: string | null | undefined,
  fallback: string,
): string {
  const n = name?.trim();
  if (n) return n;
  const h = handle?.trim().replace(/^@/, "");
  if (h) return `@${h}`;
  return fallback;
}

export function initialsOf(label: string): string {
  const parts = label.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

/** Locale-aware "3 hours ago"; falls back to a date for old or invalid input. */
export function relativeTime(iso: string, locale: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diffSec / 86400), "day");
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export type TextSegment = { kind: "text" | "mention" | "hashtag"; value: string };

/** Split post text into plain / @mention / #hashtag parts (rendered as text nodes, never HTML). */
export function segmentPostText(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re = /(^|[\s(])([@#][\p{L}\p{N}_.-]*[\p{L}\p{N}_])/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[1].length;
    if (start > last) out.push({ kind: "text", value: text.slice(last, start) });
    out.push({ kind: m[2][0] === "@" ? "mention" : "hashtag", value: m[2] });
    last = start + m[2].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

/** Comment pages: merge a new page, dropping ids already shown. */
export function mergePage<T extends { id: string }>(existing: T[], page: T[]): T[] {
  const seen = new Set(existing.map((x) => x.id));
  return [...existing, ...page.filter((x) => !seen.has(x.id))];
}
