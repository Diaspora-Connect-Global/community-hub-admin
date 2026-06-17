import { useCallback, useEffect, useState } from "react";
import { registries as fetchRegistries } from "@/services/graphql/registry";
import type {
  RegistryOwnerType,
  RegistrySummary,
  RegistryStatus,
} from "@/services/graphql/registry";

const PAGE_SIZE = 100;

export interface UseRegistriesOptions {
  ownerType: RegistryOwnerType;
  ownerEntityId: string;
  status?: RegistryStatus;
}

export interface UseRegistriesReturn {
  registries: RegistrySummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Lists registries owned by the current org scope (community / association).
 * Fetches up to PAGE_SIZE rows; the registry count per org is small so a single
 * page is sufficient.
 */
export function useRegistries({
  ownerType,
  ownerEntityId,
  status,
}: UseRegistriesOptions): UseRegistriesReturn {
  const [list, setList] = useState<RegistrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!ownerEntityId) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchRegistries(
        ownerType,
        ownerEntityId,
        status,
        PAGE_SIZE,
        0,
      );
      setList(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registries");
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerEntityId, status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { registries: list, loading, error, refetch };
}
