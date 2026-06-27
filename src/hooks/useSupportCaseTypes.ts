import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  adminCaseTypes,
  createSupportCaseType,
  updateSupportCaseType,
  deactivateSupportCaseType,
} from "@/services/graphql/support";
import type {
  SupportCaseType,
  SupportOwnerType,
  CreateSupportCaseTypeInput,
  UpdateSupportCaseTypeInput,
} from "@/services/graphql/support";

// ── List hook ────────────────────────────────────────────────────────────────

export interface UseAdminCaseTypesReturn {
  types: SupportCaseType[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads the owner's support case-types via `adminCaseTypes` (INCLUDES inactive
 * rows — the management screen needs to see and re-activate them).
 */
export function useAdminCaseTypes(
  ownerType: SupportOwnerType,
  ownerEntityId: string,
): UseAdminCaseTypesReturn {
  const [types, setTypes] = useState<SupportCaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!ownerEntityId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await adminCaseTypes(ownerType, ownerEntityId);
      setTypes(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load support case types",
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

export interface UseCreateCaseTypeReturn {
  create: (input: CreateSupportCaseTypeInput) => Promise<SupportCaseType>;
  saving: boolean;
}

/** Create a support case-type. Toasts on success / failure. */
export function useCreateCaseType(): UseCreateCaseTypeReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (input: CreateSupportCaseTypeInput) => {
      setSaving(true);
      try {
        const created = await createSupportCaseType(input);
        toast({ title: "Support case type created" });
        return created;
      } catch (err) {
        toast({
          title: "Failed to create case type",
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

export interface UseUpdateCaseTypeReturn {
  update: (input: UpdateSupportCaseTypeInput) => Promise<SupportCaseType>;
  saving: boolean;
}

/** Update a support case-type. Omitted fields are left unchanged. */
export function useUpdateCaseType(): UseUpdateCaseTypeReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (input: UpdateSupportCaseTypeInput) => {
      setSaving(true);
      try {
        const updated = await updateSupportCaseType(input);
        toast({ title: "Support case type updated" });
        return updated;
      } catch (err) {
        toast({
          title: "Failed to update case type",
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

export interface UseDeactivateCaseTypeReturn {
  deactivate: (id: string) => Promise<SupportCaseType>;
  pendingId: string | null;
}

/** Soft-deactivate a case-type. Tracks the pending id for per-row spinners. */
export function useDeactivateCaseType(): UseDeactivateCaseTypeReturn {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const deactivate = useCallback(
    async (id: string) => {
      setPendingId(id);
      try {
        const result = await deactivateSupportCaseType(id);
        toast({ title: "Support case type deactivated" });
        return result;
      } catch (err) {
        toast({
          title: "Failed to deactivate case type",
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
