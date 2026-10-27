/** Pure helpers for the composer's #hashtag suggestions. */

export interface TrendingHashtag {
  id?: string;
  tag: string;
  usageCount?: number;
}

const TAG_CHAR = /[\p{L}\p{N}_]/u;

/** Strip leading '#'s and surrounding whitespace ("#Jobs " -> "Jobs"). */
export function normaliseTag(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/^#+/, "").trim();
}

/**
 * The hashtag being typed at the caret, or null. A hashtag starts with '#' at the
 * start of the text or after whitespace, followed only by letters/digits/underscore.
 */
export function findActiveHashtagQuery(
  text: string,
  caret: number,
): { query: string; start: number } | null {
  let i = Math.min(caret, text.length) - 1;
  while (i >= 0 && TAG_CHAR.test(text[i])) i -= 1;
  if (i < 0 || text[i] !== "#") return null;
  const before = i === 0 ? " " : text[i - 1];
  if (!/\s/.test(before)) return null;
  return { query: text.slice(i + 1, caret), start: i };
}

/** Case-insensitive prefix filter, de-duplicated, most used first, capped. */
export function filterHashtags(tags: TrendingHashtag[], query: string, max = 8): string[] {
  const q = normaliseTag(query).toLowerCase();
  const seen = new Set<string>();
  return tags
    .map((t) => ({ tag: normaliseTag(t.tag), count: t.usageCount ?? 0 }))
    .filter((t) => t.tag.length > 0 && t.tag.toLowerCase().startsWith(q))
    .sort((a, b) => b.count - a.count)
    .filter((t) => {
      const k = t.tag.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, max)
    .map((t) => t.tag);
}
