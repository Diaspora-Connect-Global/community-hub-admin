import { useCallback, useEffect, useState } from "react";
import {
  ownerDirectoryListings,
  searchDirectory,
} from "@/services/graphql/directory";
import type {
  DirectoryListingSummary,
  DirectoryOwnerType,
  DirectoryListingStatus,
} from "@/services/graphql/directory";
import { PAGE_SIZE } from "@/pages/directory/types";

export const STATUS_FILTER_ALL = "ALL";

interface UseDirectoryDataParams {
  /** Owner entity id (admin.scopeId). Null while unknown / out-of-scope. */
  scopeId: string | null;
  /** "COMMUNITY" | "ASSOCIATION" derived from admin.scopeType. */
  ownerType: DirectoryOwnerType;
}

export interface UseDirectoryDataReturn {
  listings: DirectoryListingSummary[];
  loading: boolean;
  error: string | null;
  page: number;
  /** True once a page returned a full PAGE_SIZE — there may be more. */
  hasNextPage: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  handlePageChange: (newPage: number) => void;
  refetch: () => void;
}

/**
 * List + pagination + search + status-filter state for the org-scoped
 * Directory admin list page.
 *
 * - When a search term is present we hit `searchDirectory` (server-side text
 *   search) constrained to this owner so staff can find a listing fast.
 * - Otherwise we page through `ownerDirectoryListings` with the chosen status.
 */
export function useDirectoryData({
  scopeId,
  ownerType,
}: UseDirectoryDataParams): UseDirectoryDataReturn {
  const [listings, setListings] = useState<DirectoryListingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);

  const fetchListings = useCallback(
    async (pageNum: number, term: string, status: string) => {
      if (!scopeId) return;
      setLoading(true);
      setError(null);
      try {
        const offset = pageNum * PAGE_SIZE;
        const trimmed = term.trim();
        let rows: DirectoryListingSummary[];
        if (trimmed) {
          rows = await searchDirectory({
            query: trimmed,
            ownerType,
            ownerEntityId: scopeId,
            // Staff search should surface drafts/unpublished too.
            publishedOnly: false,
            limit: PAGE_SIZE,
            offset,
          });
        } else {
          rows = await ownerDirectoryListings({
            ownerType,
            ownerEntityId: scopeId,
            status:
              status === STATUS_FILTER_ALL
                ? undefined
                : (status as DirectoryListingStatus),
            limit: PAGE_SIZE,
            offset,
          });
        }
        setListings(rows);
        setHasNextPage(rows.length === PAGE_SIZE);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load directory listings",
        );
        setListings([]);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    },
    [scopeId, ownerType],
  );

  // Initial load + reload whenever the owner scope changes.
  useEffect(() => {
    setPage(0);
    fetchListings(0, "", statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, ownerType]);

  // Re-fetch on status-filter change (reset to first page).
  useEffect(() => {
    if (!scopeId) return;
    setPage(0);
    fetchListings(0, searchTerm, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Debounced search.
  useEffect(() => {
    if (!scopeId) return;
    const timer = setTimeout(() => {
      setPage(0);
      fetchListings(0, searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 0) return;
      setPage(newPage);
      fetchListings(newPage, searchTerm, statusFilter);
    },
    [fetchListings, searchTerm, statusFilter],
  );

  const refetch = useCallback(() => {
    fetchListings(page, searchTerm, statusFilter);
  }, [fetchListings, page, searchTerm, statusFilter]);

  return {
    listings,
    loading,
    error,
    page,
    hasNextPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    handlePageChange,
    refetch,
  };
}
