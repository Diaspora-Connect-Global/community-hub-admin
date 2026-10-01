import { graphqlRequestWithAuth } from "./authentication/adminAuthService";

/**
 * A person found by the people picker. Display data only: the gateway's
 * `searchUserSummaries` type has no email, phone or other contact fields.
 * `id` is sent back to the server behind the scenes and is never rendered.
 */
export interface PersonSearchResult {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

/** Below this the gateway returns nothing, so the picker doesn't ask. */
export const PEOPLE_SEARCH_MIN_LENGTH = 2;
const PEOPLE_SEARCH_LIMIT = 8;

const SEARCH_USER_SUMMARIES = `
  query SearchUserSummaries($query: String!, $limit: Int) {
    searchUserSummaries(query: $query, limit: $limit) {
      id
      displayName
      username
      avatarUrl
    }
  }
`;

export async function searchPeople(
  query: string,
  signal?: AbortSignal,
): Promise<PersonSearchResult[]> {
  const term = query.trim();
  if (term.length < PEOPLE_SEARCH_MIN_LENGTH) return [];
  const data = await graphqlRequestWithAuth<
    { searchUserSummaries: PersonSearchResult[] | null },
    { query: string; limit: number }
  >(SEARCH_USER_SUMMARIES, { query: term, limit: PEOPLE_SEARCH_LIMIT }, { signal });
  return (data.searchUserSummaries ?? []).filter((p) => Boolean(p?.id));
}
