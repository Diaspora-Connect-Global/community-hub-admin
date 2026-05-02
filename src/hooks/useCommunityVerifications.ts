import { useQuery } from "@tanstack/react-query";
import { getCommunityVerifications } from "@/services/graphql/kyc/queries";
import type { CommunityVerification } from "@/services/graphql/kyc/types";

export interface CommunityVerificationsState {
  verifications: CommunityVerification[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGetCommunityVerifications(
  communityId: string | null,
  status?: string,
  limit = 50,
  offset = 0,
): CommunityVerificationsState {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["kyc-verifications", communityId, status ?? null, limit, offset],
    queryFn: () =>
      getCommunityVerifications(communityId!, status, limit, offset),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  return {
    verifications: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isFetching,
    error: error?.message ?? null,
    refetch: () => void refetch(),
  };
}
