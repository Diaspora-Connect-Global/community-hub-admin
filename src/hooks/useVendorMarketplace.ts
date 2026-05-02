import { useQuery } from "@tanstack/react-query";
import {
  getCommunityScopedListings,
  getCommunityScopedOrders,
} from "@/services/graphql/vendor/queries";
import type {
  VendorListingDTO,
  CommunityScopedVendorOrderDTO,
} from "@/services/graphql/vendor/types";

// ── Listings hook ─────────────────────────────────────────────────────────────

export interface UseGetCommunityScopedListingsResult {
  listings: VendorListingDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGetCommunityScopedListings(
  communityId: string | null,
  limit = 20,
  offset = 0,
): UseGetCommunityScopedListingsResult {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["vendor-listings", communityId, limit, offset],
    queryFn: () => getCommunityScopedListings(communityId!, limit, offset),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  return {
    listings: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isFetching,
    error: error?.message ?? null,
    refetch: () => void refetch(),
  };
}

// ── Orders hook ───────────────────────────────────────────────────────────────

export interface UseGetCommunityScopedOrdersResult {
  orders: CommunityScopedVendorOrderDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGetCommunityScopedOrders(
  communityId: string | null,
  limit = 20,
  offset = 0,
): UseGetCommunityScopedOrdersResult {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["vendor-orders", communityId, limit, offset],
    queryFn: () => getCommunityScopedOrders(communityId!, limit, offset),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isFetching,
    error: error?.message ?? null,
    refetch: () => void refetch(),
  };
}
