import { useQuery } from "@tanstack/react-query";
import { useCommunityScope } from "@/hooks/useCommunityScope";
import { getCommunity } from "@/services/graphql/community/queries";
import { isEventsOnly } from "@/lib/eventNetworking";

/**
 * Whether this community exists only to run events (its enabled services are
 * exactly `events`). Shares the sidebar's ["community", id] cache entry, so it
 * costs no extra request. While loading — or if the lookup fails — the console
 * is NOT narrowed: the server still enforces what each admin may do.
 */
export function useEventsOnly(): { eventsOnly: boolean; loading: boolean; communityId: string } {
  const { communityId } = useCommunityScope();
  const q = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => getCommunity(communityId),
    enabled: !!communityId,
    staleTime: 60_000,
  });
  return {
    eventsOnly: isEventsOnly(q.data?.enabledServices),
    loading: !!communityId && q.isLoading,
    communityId,
  };
}
