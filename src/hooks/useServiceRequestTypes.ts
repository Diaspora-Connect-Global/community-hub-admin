import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  adminServiceRequestTypes,
  createServiceRequestType,
  updateServiceRequestType,
  deactivateServiceRequestType,
} from "@/services/graphql/serviceRequests";
import type {
  ServiceRequestType,
  ServiceRequestOwnerType,
  CreateServiceRequestTypeInput,
  UpdateServiceRequestTypeInput,
} from "@/services/graphql/serviceRequests";

// ── List hook ────────────────────────────────────────────────────────────────

export interface UseAdminServiceRequestTypesReturn {
  types: ServiceRequestType[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads the owner's request-types via `adminServiceRequestTypes` (INCLUDES
 * inactive rows — the management screen needs to see and re-activate them).
 */
export function useAdminServiceRequestTypes(
  ownerType: ServiceRequestOwnerType,
  ownerEntityId: string,
): UseAdminServiceRequestTypesReturn {
  const [types, setTypes] = useState<ServiceRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!ownerEntityId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await adminServiceRequestTypes(ownerType, ownerEntityId);
      setTypes(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load service request types",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerEntityId]);

  useEffect(() => {
    void fetchTypes();
  }, [fetchTypes]);

  return { types, loading, error, refetch: fetchTypes };
}

// ── Mutation hooks ─────────────────────────────────────────────────────────────

export interface UseCreateServiceRequestTypeReturn {
  create: (input: CreateServiceRequestTypeInput) => Promise<ServiceRequestType>;
  saving: boolean;
}

/** Create a request-type. Toasts on success / failure. */
export function useCreateServiceRequestType(): UseCreateServiceRequestTypeReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (input: CreateServiceRequestTypeInput) => {
      setSaving(true);
      try {
        const created = await createServiceRequestType(input);
        toast({ title: "Service request type created" });
        return created;
      } catch (err) {
        toast({
          title: "Failed to create type",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  return { create, saving };
}

export interface UseUpdateServiceRequestTypeReturn {
  update: (input: UpdateServiceRequestTypeInput) => Promise<ServiceRequestType>;
  saving: boolean;
}

/** Update a request-type (a non-empty formFields array replaces the whole set). */
export function useUpdateServiceRequestType(): UseUpdateServiceRequestTypeReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (input: UpdateServiceRequestTypeInput) => {
      setSaving(true);
      try {
        const updated = await updateServiceRequestType(input);
        toast({ title: "Service request type updated" });
        return updated;
      } catch (err) {
        toast({
          title: "Failed to update type",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  return { update, saving };
}

export interface UseDeactivateServiceRequestTypeReturn {
  deactivate: (id: string) => Promise<ServiceRequestType>;
  pendingId: string | null;
}

/** Soft-deactivate a request-type. Tracks the pending id for per-row spinners. */
export function useDeactivateServiceRequestType(): UseDeactivateServiceRequestTypeReturn {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const deactivate = useCallback(
    async (id: string) => {
      setPendingId(id);
      try {
        const result = await deactivateServiceRequestType(id);
        toast({ title: "Service request type deactivated" });
        return result;
      } catch (err) {
        toast({
          title: "Failed to deactivate type",
          description: err instanceof Error ? err.message : "An error occurred.",
          variant: "destructive",
        });
        throw err;
      } finally {
        setPendingId(null);
      }
    },
    [toast],
  );

  return { deactivate, pendingId };
}
