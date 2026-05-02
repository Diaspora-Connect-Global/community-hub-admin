import { useQuery } from "@tanstack/react-query";
import { getCommunityReports } from "@/services/graphql/community/queries";
import type { CommunityReport } from "@/services/graphql/community/types";

export interface UseGetCommunityReportsResult {
  reports: CommunityReport[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGetCommunityReports(
  communityId: string | null,
  status?: string,
  limit = 50,
  offset = 0,
): UseGetCommunityReportsResult {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["community-reports", communityId, status ?? null, limit, offset],
    queryFn: () =>
      getCommunityReports(communityId!, status, undefined, limit, offset),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  return {
    reports: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isFetching,
    error: error?.message ?? null,
    refetch: () => void refetch(),
  };
}
