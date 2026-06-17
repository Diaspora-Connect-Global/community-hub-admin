import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  createRegistry,
  updateRegistry,
  archiveRegistry,
  addRegistryEntry,
  updateRegistryEntry,
  verifyRegistryEntry,
  rejectRegistryEntry,
  suspendRegistryEntry,
  changeRegistryEntryMembershipStatus,
  setRegistryEntryDirectoryVisibility,
  sendRegistryBroadcast,
} from "@/services/graphql/registry";
import type {
  Registry,
  RegistryEntry,
  RegistryBroadcast,
  RegistryOwnerType,
  RegistryMembershipStatus,
  SendRegistryBroadcastInput,
} from "@/services/graphql/registry";
import {
  formToCreateInput,
  formToUpdateInput,
  entryFormToAddInput,
  entryFormToUpdateInput,
  type RegistryFormState,
  type RegistryEntryFormState,
} from "@/pages/registries/types";

export interface UseRegistryActionsOptions {
  ownerType: RegistryOwnerType;
  ownerEntityId: string;
}

/** Centralised, toast-wrapped registry/entry mutations. Each returns the
 *  resulting record (or null on failure) so callers can update local state. */
export function useRegistryActions({
  ownerType,
  ownerEntityId,
}: UseRegistryActionsOptions) {
  const wrap = useCallback(
    async <T>(
      fn: () => Promise<T>,
      success: { title: string; description?: string },
      failTitle: string,
    ): Promise<T | null> => {
      try {
        const result = await fn();
        toast({ title: success.title, description: success.description });
        return result;
      } catch (err) {
        toast({
          title: failTitle,
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
        return null;
      }
    },
    [],
  );

  // ── Registry ───────────────────────────────────────────────────────────────

  const createRegistryHandler = useCallback(
    (form: RegistryFormState): Promise<Registry | null> => {
      if (!form.name.trim()) {
        toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
        return Promise.resolve(null);
      }
      if (!form.registryTypeId.trim()) {
        toast({ title: "Validation", description: "Registry type id is required.", variant: "destructive" });
        return Promise.resolve(null);
      }
      return wrap(
        () => createRegistry(formToCreateInput(form, ownerType, ownerEntityId)),
        { title: "Registry created", description: form.name.trim() },
        "Failed to create registry",
      );
    },
    [wrap, ownerType, ownerEntityId],
  );

  const updateRegistryHandler = useCallback(
    (id: string, form: RegistryFormState): Promise<Registry | null> => {
      if (!form.name.trim()) {
        toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
        return Promise.resolve(null);
      }
      return wrap(
        () => updateRegistry(formToUpdateInput(id, form)),
        { title: "Registry updated" },
        "Failed to update registry",
      );
    },
    [wrap],
  );

  const archiveRegistryHandler = useCallback(
    (id: string): Promise<Registry | null> =>
      wrap(
        () => archiveRegistry(id),
        { title: "Registry archived" },
        "Failed to archive registry",
      ),
    [wrap],
  );

  // ── Entry CRUD ───────────────────────────────────────────────────────────────

  const addEntryHandler = useCallback(
    (registryId: string, form: RegistryEntryFormState): Promise<RegistryEntry | null> =>
      wrap(
        () => addRegistryEntry(entryFormToAddInput(registryId, form)),
        { title: "Entry added" },
        "Failed to add entry",
      ),
    [wrap],
  );

  const updateEntryHandler = useCallback(
    (id: string, form: RegistryEntryFormState): Promise<RegistryEntry | null> =>
      wrap(
        () => updateRegistryEntry(entryFormToUpdateInput(id, form)),
        { title: "Entry updated" },
        "Failed to update entry",
      ),
    [wrap],
  );

  // ── Entry verification lifecycle ───────────────────────────────────────────

  const verifyEntryHandler = useCallback(
    (id: string, note?: string): Promise<RegistryEntry | null> =>
      wrap(
        () => verifyRegistryEntry({ id, note }),
        { title: "Entry verified" },
        "Failed to verify entry",
      ),
    [wrap],
  );

  const rejectEntryHandler = useCallback(
    (id: string, note?: string): Promise<RegistryEntry | null> =>
      wrap(
        () => rejectRegistryEntry({ id, note }),
        { title: "Entry rejected" },
        "Failed to reject entry",
      ),
    [wrap],
  );

  const suspendEntryHandler = useCallback(
    (id: string, note?: string): Promise<RegistryEntry | null> =>
      wrap(
        () => suspendRegistryEntry({ id, note }),
        { title: "Entry suspended" },
        "Failed to suspend entry",
      ),
    [wrap],
  );

  const changeMembershipStatusHandler = useCallback(
    (
      id: string,
      membershipStatus: RegistryMembershipStatus,
      reason?: string,
    ): Promise<RegistryEntry | null> =>
      wrap(
        () => changeRegistryEntryMembershipStatus({ id, membershipStatus, reason }),
        { title: "Membership status updated" },
        "Failed to update membership status",
      ),
    [wrap],
  );

  const setDirectoryVisibilityHandler = useCallback(
    (id: string, directoryVisible: boolean): Promise<RegistryEntry | null> =>
      wrap(
        () => setRegistryEntryDirectoryVisibility({ id, directoryVisible }),
        { title: directoryVisible ? "Listed in directory" : "Hidden from directory" },
        "Failed to update visibility",
      ),
    [wrap],
  );

  // ── Broadcast ────────────────────────────────────────────────────────────────

  const sendBroadcastHandler = useCallback(
    (input: SendRegistryBroadcastInput): Promise<RegistryBroadcast | null> => {
      if (!input.title.trim() || !input.body.trim()) {
        toast({ title: "Validation", description: "Title and body are required.", variant: "destructive" });
        return Promise.resolve(null);
      }
      return wrap(
        () => sendRegistryBroadcast(input),
        { title: "Broadcast sent" },
        "Failed to send broadcast",
      );
    },
    [wrap],
  );

  return {
    createRegistryHandler,
    updateRegistryHandler,
    archiveRegistryHandler,
    addEntryHandler,
    updateEntryHandler,
    verifyEntryHandler,
    rejectEntryHandler,
    suspendEntryHandler,
    changeMembershipStatusHandler,
    setDirectoryVisibilityHandler,
    sendBroadcastHandler,
  };
}
