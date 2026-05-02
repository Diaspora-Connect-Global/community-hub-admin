import { useCallback, useEffect, useState } from "react";
import {
  listCommunityMembers,
  listAssociationMembers,
  searchMembers,
  listPendingMemberships,
  getMemberDetails,
} from "@/services/graphql/community/queries";
import type { MemberDetails, PendingMembershipRequest } from "@/pages/members/types";
import { PAGE_SIZE } from "@/pages/members/types";

interface UseMembersDataParams {
  scopeId: string;
  entityType: string;
}

export interface UseMembersDataReturn {
  // Members list
  members: MemberDetails[];
  totalMembers: number;
  loading: boolean;
  error: string | null;
  page: number;
  searchTerm: string;
  searching: boolean;
  setSearchTerm: (term: string) => void;
  fetchMembers: (pageNum: number) => Promise<void>;
  handlePageChange: (newPage: number) => void;

  // Pending requests
  pendingRequests: PendingMembershipRequest[];
  loadingPending: boolean;
  removePendingById: (id: string) => void;

  // View modal
  viewModalOpen: boolean;
  setViewModalOpen: (open: boolean) => void;
  selectedMember: MemberDetails | null;
  loadingDetail: boolean;
  handleView: (member: MemberDetails) => Promise<void>;
}

export function useMembersData({
  scopeId,
  entityType,
}: UseMembersDataParams): UseMembersDataReturn {
  const [members, setMembers] = useState<MemberDetails[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<PendingMembershipRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Fetch members ─────────────────────────────────────────────────────────
  const fetchMembers = useCallback(
    async (pageNum: number) => {
      if (!scopeId) return;
      setLoading(true);
      setError(null);
      try {
        const offset = pageNum * PAGE_SIZE;
        const res =
          entityType === "ASSOCIATION"
            ? await listAssociationMembers(scopeId, PAGE_SIZE, offset)
            : await listCommunityMembers(scopeId, PAGE_SIZE, offset);
        setMembers(res.members);
        setTotalMembers(res.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        setLoading(false);
      }
    },
    [scopeId, entityType]
  );

  // ── Fetch pending requests ────────────────────────────────────────────────
  const fetchPendingRequests = useCallback(async () => {
    if (!scopeId) return;
    setLoadingPending(true);
    try {
      const res = await listPendingMemberships({
        entityId: scopeId,
        entityType,
        limit: 50,
        offset: 0,
      });
      setPendingRequests(res.requests);
    } catch {
      // non-fatal
    } finally {
      setLoadingPending(false);
    }
  }, [scopeId, entityType]);

  useEffect(() => {
    fetchMembers(0);
    fetchPendingRequests();
  }, [fetchMembers, fetchPendingRequests]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!scopeId) return;
    if (!searchTerm.trim()) {
      fetchMembers(page);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMembers(scopeId, entityType, searchTerm.trim());
        setMembers(results);
        setTotalMembers(results.length);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, scopeId, entityType, fetchMembers, page]);

  // ── View detail ───────────────────────────────────────────────────────────
  const handleView = async (member: MemberDetails): Promise<void> => {
    setSelectedMember(member);
    setViewModalOpen(true);
    setLoadingDetail(true);
    try {
      const detail = await getMemberDetails(member.userId, scopeId, entityType);
      setSelectedMember(detail);
    } catch {
      // use existing data
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
    fetchMembers(newPage);
  };

  const removePendingById = (id: string): void => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    members,
    totalMembers,
    loading,
    error,
    page,
    searchTerm,
    searching,
    setSearchTerm,
    fetchMembers,
    handlePageChange,
    pendingRequests,
    loadingPending,
    removePendingById,
    viewModalOpen,
    setViewModalOpen,
    selectedMember,
    loadingDetail,
    handleView,
  };
}
