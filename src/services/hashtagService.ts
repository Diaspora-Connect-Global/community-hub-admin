import { graphqlRequestWithAuth } from "./authentication/adminAuthService";
import { normaliseTag, type TrendingHashtag } from "@/lib/hashtags";

const QUERY = `
  query GetTrendingHashtags($input: GetTrendingHashtagsInput) {
    trendingHashtags(input: $input) {
      id
      tag
      usageCount
    }
  }
`;

const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; tags: TrendingHashtag[] } | null = null;
let inflight: Promise<TrendingHashtag[]> | null = null;

/** Trending hashtags for suggestions. Cached for 5 minutes; never throws (returns []). */
export async function fetchTrendingHashtags(): Promise<TrendingHashtag[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.tags;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await graphqlRequestWithAuth<{ trendingHashtags: TrendingHashtag[] | null }>(QUERY, {
        input: { limit: 50, timeRange: "30d" },
      });
      const tags = (data.trendingHashtags ?? [])
        .map((t) => ({ ...t, tag: normaliseTag(t.tag) }))
        .filter((t) => t.tag.length > 0);
      cache = { at: Date.now(), tags };
      return tags;
    } catch {
      return [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
