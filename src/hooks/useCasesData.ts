import { useCallback, useEffect, useMemo, useState } from "react";
import { ownerCases, caseTypes } from "@/services/graphql/support";
import type {
  SupportCaseSummary,
  SupportCaseType,
  SupportOwnerType,
  SupportCaseStatus,
  SupportPriority,
} from "@/services/graphql/support";
import { PAGE_SIZE, STATUS_ALL, PRIORITY_ALL, OPEN_STATUSES } from "@/pages/cases/types";

interface UseCasesDataParams {
  /** ownerEntityId — the community / association id from the admin scope. */
  scopeId: string | null;
  /** Maps admin.scopeType → SupportOwnerType. */
  ownerType: SupportOwnerType;
}

export interface UseCasesDataReturn {
  cases: SupportCaseSummary[];
  filteredCases: SupportCaseSummary[];
  total: number;
  openCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  filterAssignee: string;
  setFilterAssignee: (a: string) => void;
  // Pagination
  handlePageChange: (newPage: number) => void;
  refetch: () => void;
  // Case-type labels (id → displayName)
  caseTypeMap: Record<string, string>;
}

/**
 * Loads the staff-scoped case list for the admin's owner entity, with
 * server-side status / priority / assignee filters and client-side text search.
 */
export function useCasesData({ scopeId, ownerType }: UseCasesDataParams): UseCasesDataReturn {
  const [cases, setCases] = useState<SupportCaseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(STATUS_ALL);
  const [filterPriority, setFilterPriority] = useState<string>(PRIORITY_ALL);
  const [filterAssignee, setFilterAssignee] = useState("");

  const [caseTypeMap, setCaseTypeMap] = useState<Record<string, string>>({});

  // Note: ownerCases returns a bare list (no total). We track length as a best-
  // effort total and use a "hasNextPage" heuristic via the page-size check.
  const fetchCases = useCallback(
    async (pageNum: number) => {
      if (!scopeId) return;
      setLoading(true);
      setError(null);
      try {
        const rows = await ownerCases({
          ownerType,
          ownerEntityId: scopeId,
          status: filterStatus === STATUS_ALL ? undefined : (filterStatus as SupportCaseStatus),
          priority:
            filterPriority === PRIORITY_ALL ? undefined : (filterPriority as SupportPriority),
          assigneeUserId: filterAssignee.trim() || undefined,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        });
        setCases(rows);
        setTotal(pageNum * PAGE_SIZE + rows.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    },
    [scopeId, ownerType, filterStatus, filterPriority, filterAssignee],
  );

  // Reset to page 0 and refetch whenever the server-side filters change.
  useEffect(() => {
    setPage(0);
    void fetchCases(0);
  }, [fetchCases]);

  // Load case-type labels once per owner so the table can show type names.
  useEffect(() => {
    if (!scopeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const types: SupportCaseType[] = await caseTypes(ownerType, scopeId);
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const t of types) map[t.id] = t.displayName;
        setCaseTypeMap(map);
      } catch {
        // non-fatal — table falls back to the raw category / id.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scopeId, ownerType]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      void fetchCases(newPage);
    },
    [fetchCases],
  );

  const refetch = useCallback(() => {
    void fetchCases(page);
  }, [fetchCases, page]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.caseNumber?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.assigneeUserId?.toLowerCase().includes(q),
    );
  }, [cases, searchQuery]);

  const openCount = useMemo(
    () => cases.filter((c) => OPEN_STATUSES.includes(c.status as SupportCaseStatus)).length,
    [cases],
  );

  return {
    cases,
    filteredCases,
    total,
    openCount,
    loading,
    error,
    page,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    handlePageChange,
    refetch,
    caseTypeMap,
  };
}
