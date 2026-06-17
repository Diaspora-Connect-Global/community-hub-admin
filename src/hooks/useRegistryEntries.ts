import { useCallback, useEffect, useMemo, useState } from "react";
import {
  registryEntries as fetchEntries,
  searchRegistryEntries as fetchSearch,
} from "@/services/graphql/registry";
import type {
  RegistryEntrySummary,
  RegistryOwnerType,
  RegistryVerificationStatus,
  RegistryMembershipStatus,
} from "@/services/graphql/registry";
import { useDebounce } from "@/hooks/useDebounce";

export const REGISTRY_ENTRY_PAGE_SIZE = 25;

export interface UseRegistryEntriesOptions {
  registryId: string;
  ownerType: RegistryOwnerType;
  ownerEntityId: string;
}

export interface UseRegistryEntriesReturn {
  entries: RegistryEntrySummary[];
  loading: boolean;
  error: string | null;
  page: number;
  hasNextPage: boolean;
  searchTerm: string;
  verificationFilter: RegistryVerificationStatus | "ALL";
  membershipFilter: RegistryMembershipStatus | "ALL";
  setSearchTerm: (value: string) => void;
  setVerificationFilter: (value: RegistryVerificationStatus | "ALL") => void;
  setMembershipFilter: (value: RegistryMembershipStatus | "ALL") => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Entries list for a single registry, with pagination, debounced text search
 * and verification/membership filters.
 *
 * When a search term is present the hook switches to the owner-scoped
 * `searchRegistryEntries` query (full-text + facet filters); otherwise it uses
 * the cheaper `registryEntries` list-by-registry query. Both return summary
 * projections.
 */
export function useRegistryEntries({
  registryId,
  ownerType,
  ownerEntityId,
}: UseRegistryEntriesOptions): UseRegistryEntriesReturn {
  const [entries, setEntries] = useState<RegistryEntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [searchTerm, setSearchTermRaw] = useState("");
  const [verificationFilter, setVerificationFilterRaw] = useState<
    RegistryVerificationStatus | "ALL"
  >("ALL");
  const [membershipFilter, setMembershipFilterRaw] = useState<
    RegistryMembershipStatus | "ALL"
  >("ALL");

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Any filter / search change resets pagination to the first page.
  const setSearchTerm = useCallback((value: string) => {
    setSearchTermRaw(value);
    setPage(0);
  }, []);
  const setVerificationFilter = useCallback(
    (value: RegistryVerificationStatus | "ALL") => {
      setVerificationFilterRaw(value);
      setPage(0);
    },
    [],
  );
  const setMembershipFilter = useCallback(
    (value: RegistryMembershipStatus | "ALL") => {
      setMembershipFilterRaw(value);
      setPage(0);
    },
    [],
  );

  const trimmedSearch = useMemo(() => debouncedSearch.trim(), [debouncedSearch]);

  const refetch = useCallback(async () => {
    if (!registryId) return;
    setLoading(true);
    setError(null);
    try {
      const verification =
        verificationFilter === "ALL" ? undefined : verificationFilter;
      const membership =
        membershipFilter === "ALL" ? undefined : membershipFilter;
      const limit = REGISTRY_ENTRY_PAGE_SIZE;
      const offset = page * REGISTRY_ENTRY_PAGE_SIZE;

      let rows: RegistryEntrySummary[];
      if (trimmedSearch) {
        rows = await fetchSearch(ownerType, ownerEntityId, {
          registryId,
          query: trimmedSearch,
          filter: {
            verificationStatus: verification,
            membershipStatus: membership,
          },
          limit,
          offset,
        });
      } else {
        rows = await fetchEntries(registryId, {
          verificationStatus: verification,
          membershipStatus: membership,
          limit,
          offset,
        });
      }
      setEntries(rows);
      // No total on the wire; infer "has next" from a full page.
      setHasNextPage(rows.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [
    registryId,
    ownerType,
    ownerEntityId,
    trimmedSearch,
    verificationFilter,
    membershipFilter,
    page,
  ]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    entries,
    loading,
    error,
    page,
    hasNextPage,
    searchTerm,
    verificationFilter,
    membershipFilter,
    setSearchTerm,
    setVerificationFilter,
    setMembershipFilter,
    setPage,
    refetch,
  };
}
