import { graphqlRequestWithAuth } from "./authentication/adminAuthService";
import { searchAssociations } from "./graphql/associations/queries";
import type { MentionEntityType } from "./graphql/posts";

export interface MentionCandidate {
  entityId: string;
  entityType: MentionEntityType;
  displayName: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
}

const SEARCH_USERS = `
  query SearchUsers($input: SearchUsersInput!) {
    searchUsers(input: $input) {
      profiles {
        id
        userId
        firstName
        lastName
        avatarUrl
        headline
      }
    }
  }
`;

const LIST_COMMUNITIES = `
  query ListCommunities($searchTerm: String, $limit: Int) {
    listCommunities(searchTerm: $searchTerm, limit: $limit) {
      communities {
        id
        name
        avatarUrl
        description
      }
    }
  }
`;

interface SearchUsersResponse {
  searchUsers: {
    profiles: Array<{
      id: string;
      userId?: string;
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
      headline?: string | null;
    }>;
  };
}

interface ListCommunitiesResponse {
  listCommunities: {
    communities: Array<{
      id: string;
      name: string;
      avatarUrl?: string | null;
      description?: string | null;
    }>;
  };
}

const PER_TYPE_LIMIT = 5;

async function searchUserCandidates(query: string): Promise<MentionCandidate[]> {
  try {
    const data = await graphqlRequestWithAuth<SearchUsersResponse>(SEARCH_USERS, {
      input: { query, limit: PER_TYPE_LIMIT },
    });
    return data.searchUsers.profiles.map((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
      return {
        entityId: p.userId ?? p.id,
        entityType: "USER" as const,
        displayName: name || "Unnamed user",
        avatarUrl: p.avatarUrl,
        subtitle: p.headline ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function searchCommunityCandidates(query: string): Promise<MentionCandidate[]> {
  try {
    const data = await graphqlRequestWithAuth<ListCommunitiesResponse>(LIST_COMMUNITIES, {
      searchTerm: query,
      limit: PER_TYPE_LIMIT,
    });
    return data.listCommunities.communities.map((c) => ({
      entityId: c.id,
      entityType: "COMMUNITY" as const,
      displayName: c.name,
      avatarUrl: c.avatarUrl,
      subtitle: c.description ?? null,
    }));
  } catch {
    return [];
  }
}

async function searchAssociationCandidates(query: string): Promise<MentionCandidate[]> {
  try {
    const data = await searchAssociations({ query, limit: PER_TYPE_LIMIT, page: 1 });
    return data.associations.map((a) => ({
      entityId: a.id,
      entityType: "ASSOCIATION" as const,
      displayName: a.name,
      avatarUrl: a.avatarUrl,
      subtitle: a.description ?? null,
    }));
  } catch {
    return [];
  }
}

export async function searchMentionCandidates(query: string): Promise<MentionCandidate[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const [users, communities, associations] = await Promise.all([
    searchUserCandidates(trimmed),
    searchCommunityCandidates(trimmed),
    searchAssociationCandidates(trimmed),
  ]);

  return [...users, ...communities, ...associations];
}
