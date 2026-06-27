import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  resourcesByOwner,
  resourceCategories,
  createResource,
  updateResource,
  publishResource,
  unpublishResource,
  archiveResource,
  uploadResourceFile,
} from "@/services/graphql/resources";
import type {
  ResourceSummary,
  ResourceCategory,
  Resource,
  ResourceOwnerType,
  CreateResourceInput,
  UpdateResourceInput,
} from "@/services/graphql/resources";

// ── List hook ────────────────────────────────────────────────────────────────

export interface UseAdminResourcesReturn {
  resources: ResourceSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads the owner's resource library via `resourcesByOwner` (INCLUDES drafts and
 * archived — the management screen needs to see and act on every state).
 */
export function useAdminResources(
  ownerType: ResourceOwnerType,
  ownerEntityId: string,
): UseAdminResourcesReturn {
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    if (!ownerEntityId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await resourcesByOwner(ownerType, ownerEntityId);
      setResources(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerEntityId]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  return { resources, loading, error, refetch: fetchResources };
}

// ── Categories hook ────────────────────────────────────────────────────────────

export interface UseResourceCategoriesReturn {
  categories: ResourceCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Loads the owner's active resource categories (for the form's category picker). */
export function useResourceCategories(
  ownerType: ResourceOwnerType,
  ownerEntityId: string,
): UseResourceCategoriesReturn {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!ownerEntityId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await resourceCategories(ownerType, ownerEntityId);
      setCategories(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerEntityId]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

// ── Mutation hooks ─────────────────────────────────────────────────────────────

export interface UseCreateResourceReturn {
  /**
   * Create a resource and, when a file is supplied, run the signed-URL upload
   * flow (requestResourceUploadUrl -> PUT -> confirmResourceVersion) against the
   * new id. Toasts on success / failure.
   */
  create: (input: CreateResourceInput, file?: File | null) => Promise<Resource>;
  saving: boolean;
}

/** Create a resource (+ optional file upload). */
export function useCreateResource(): UseCreateResourceReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (input: CreateResourceInput, file?: File | null) => {
      setSaving(true);
      try {
        let created = await createResource(input);
        if (file) {
          created = await uploadResourceFile(created.id, file);
        }
        toast({ title: "Resource created" });
        return created;
      } catch (err) {
        toast({
          title: "Failed to create resource",
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

export interface UseUpdateResourceReturn {
  /** Update a resource's metadata and, when a file is supplied, replace its file. */
  update: (input: UpdateResourceInput, file?: File | null) => Promise<Resource>;
  saving: boolean;
}

/** Update a resource (+ optional file replacement). */
export function useUpdateResource(): UseUpdateResourceReturn {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (input: UpdateResourceInput, file?: File | null) => {
      setSaving(true);
      try {
        let updated = await updateResource(input);
        if (file) {
          updated = await uploadResourceFile(input.id, file);
        }
        toast({ title: "Resource updated" });
        return updated;
      } catch (err) {
        toast({
          title: "Failed to update resource",
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

export interface UseResourceLifecycleReturn {
  publish: (id: string) => Promise<Resource>;
  unpublish: (id: string) => Promise<Resource>;
  archive: (id: string) => Promise<Resource>;
  /** The id with a lifecycle action in flight (for per-row spinners). */
  pendingId: string | null;
}

/** Publish / unpublish / archive a resource. Tracks the pending id. */
export function useResourceLifecycle(): UseResourceLifecycleReturn {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const run = useCallback(
    async (
      id: string,
      action: (id: string) => Promise<Resource>,
      successTitle: string,
      failTitle: string,
    ) => {
      setPendingId(id);
      try {
        const result = await action(id);
        toast({ title: successTitle });
        return result;
      } catch (err) {
        toast({
          title: failTitle,
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

  const publish = useCallback(
    (id: string) =>
      run(id, publishResource, "Resource published", "Failed to publish resource"),
    [run],
  );
  const unpublish = useCallback(
    (id: string) =>
      run(
        id,
        unpublishResource,
        "Resource unpublished",
        "Failed to unpublish resource",
      ),
    [run],
  );
  const archive = useCallback(
    (id: string) =>
      run(id, archiveResource, "Resource archived", "Failed to archive resource"),
    [run],
  );

  return { publish, unpublish, archive, pendingId };
}
