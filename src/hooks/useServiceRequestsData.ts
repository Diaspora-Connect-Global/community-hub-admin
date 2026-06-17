import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ownerServiceRequests,
  serviceRequestTypes,
} from "@/services/graphql/serviceRequests";
import type {
  ServiceRequestSummary,
  ServiceRequestType,
  ServiceRequestOwnerType,
  ServiceRequestStatus,
} from "@/services/graphql/serviceRequests";
import { PAGE_SIZE, FILTER_ALL } from "@/pages/serviceRequests/types";

interface UseServiceRequestsDataParams {
  /** The owning entity id (community / association scope id). */
  ownerEntityId: string;
  /** Owner type derived from the admin scope ("COMMUNITY" | "ASSOCIATION"). */
  ownerType: ServiceRequestOwnerType;
}

export interface UseServiceRequestsDataReturn {
  requests: ServiceRequestSummary[];
  requestTypes: ServiceRequestType[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  // Filters
  statusFilter: string;
  typeFilter: string;
  assigneeFilter: string;
  searchTerm: string;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (typeId: string) => void;
  setAssigneeFilter: (assigneeUserId: string) => void;
  setSearchTerm: (term: string) => void;

  handlePageChange: (newPage: number) => void;
  refetch: () => Promise<void>;

  /** Filtered by the client-side search term (over requestNumber). */
  visibleRequests: ServiceRequestSummary[];
  /** Map of requestTypeId -> displayName for table rendering. */
  typeNameById: Record<string, string>;
}

/**
 * Loads the org-scoped service-request list with server-side status / type /
 * assignee filters and offset pagination, plus the active request-types for the
 * filter dropdown. Search over `requestNumber` is applied client-side (no
 * dedicated server search arg on `ownerServiceRequests`).
 */
export function useServiceRequestsData({
  ownerEntityId,
  ownerType,
}: UseServiceRequestsDataParams): UseServiceRequestsDataReturn {
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [requestTypes, setRequestTypes] = useState<ServiceRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [typeFilter, setTypeFilterState] = useState<string>(FILTER_ALL);
  const [assigneeFilter, setAssigneeFilterState] = useState<string>(FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = useCallback(
    async (pageNum: number) => {
      if (!ownerEntityId) return;
      setLoading(true);
      setError(null);
      try {
        const offset = pageNum * PAGE_SIZE;
        const rows = await ownerServiceRequests({
          ownerType,
          ownerEntityId,
          status:
            statusFilter === FILTER_ALL
              ? undefined
              : (statusFilter as ServiceRequestStatus),
          requestTypeId: typeFilter === FILTER_ALL ? undefined : typeFilter,
          assigneeUserId:
            assigneeFilter === FILTER_ALL ? undefined : assigneeFilter,
          limit: PAGE_SIZE,
          offset,
        });
        setRequests(rows);
        setHasMore(rows.length === PAGE_SIZE);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load service requests",
        );
      } finally {
        setLoading(false);
      }
    },
    [ownerEntityId, ownerType, statusFilter, typeFilter, assigneeFilter],
  );

  // Load active request-types once per scope (filter dropdown + name lookup).
  useEffect(() => {
    if (!ownerEntityId) return;
    let cancelled = false;
    void (async () => {
      try {
        const types = await serviceRequestTypes(ownerType, ownerEntityId);
        if (!cancelled) setRequestTypes(types);
      } catch {
        // Non-fatal — the filter just stays empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerEntityId, ownerType]);

  // Reset to page 0 and refetch whenever a server-side filter changes.
  useEffect(() => {
    setPage(0);
    void fetchRequests(0);
  }, [fetchRequests]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      void fetchRequests(newPage);
    },
    [fetchRequests],
  );

  const refetch = useCallback(() => fetchRequests(page), [fetchRequests, page]);

  const setStatusFilter = useCallback((s: string) => setStatusFilterState(s), []);
  const setTypeFilter = useCallback((t: string) => setTypeFilterState(t), []);
  const setAssigneeFilter = useCallback(
    (a: string) => setAssigneeFilterState(a),
    [],
  );

  const typeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of requestTypes) map[t.id] = t.displayName;
    return map;
  }, [requestTypes]);

  const visibleRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        (typeNameById[r.requestTypeId] ?? "").toLowerCase().includes(q),
    );
  }, [requests, searchTerm, typeNameById]);

  return {
    requests,
    requestTypes,
    loading,
    error,
    page,
    hasMore,
    statusFilter,
    typeFilter,
    assigneeFilter,
    searchTerm,
    setStatusFilter,
    setTypeFilter,
    setAssigneeFilter,
    setSearchTerm,
    handlePageChange,
    refetch,
    visibleRequests,
    typeNameById,
  };
}
