import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  createDirectoryListing,
  updateDirectoryListing,
  publishDirectoryListing,
  unpublishDirectoryListing,
  archiveDirectoryListing,
  directoryListing,
} from "@/services/graphql/directory";
import type {
  DirectoryListing,
  DirectoryOwnerType,
} from "@/services/graphql/directory";
import {
  formToCreateInput,
  formToUpdateInput,
  type DirectoryFormState,
} from "@/pages/directory/types";

interface UseDirectoryActionsParams {
  ownerType: DirectoryOwnerType;
  scopeId: string | null;
  /** Called after any successful mutation that should refresh the list. */
  onRefetch: () => void;
}

export interface UseDirectoryActionsReturn {
  createListingHandler: (
    form: DirectoryFormState,
    onSuccess: () => void,
  ) => Promise<void>;
  updateListingHandler: (
    id: string,
    form: DirectoryFormState,
    onSuccess: () => void,
  ) => Promise<void>;
  publishListingHandler: (id: string) => Promise<void>;
  unpublishListingHandler: (id: string) => Promise<void>;
  archiveListingHandler: (id: string, onSuccess?: () => void) => Promise<void>;
  loadListingDetail: (id: string) => Promise<DirectoryListing | null>;
}

/** Client-side validation shared by create + edit. Returns true when valid. */
function validateForm(form: DirectoryFormState): boolean {
  if (!form.displayName.trim()) {
    toast({
      title: "Validation",
      description: "Display name is required.",
      variant: "destructive",
    });
    return false;
  }
  if (!form.categoryId) {
    toast({
      title: "Validation",
      description: "Please choose a category.",
      variant: "destructive",
    });
    return false;
  }
  if (!form.listingKind) {
    toast({
      title: "Validation",
      description: "Please choose a listing kind.",
      variant: "destructive",
    });
    return false;
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    toast({
      title: "Validation",
      description: "Please enter a valid contact email.",
      variant: "destructive",
    });
    return false;
  }
  return true;
}

export function useDirectoryActions({
  ownerType,
  scopeId,
  onRefetch,
}: UseDirectoryActionsParams): UseDirectoryActionsReturn {
  const createListingHandler = useCallback(
    async (form: DirectoryFormState, onSuccess: () => void): Promise<void> => {
      if (!scopeId) {
        toast({
          title: "Error",
          description: "No organization scope is active.",
          variant: "destructive",
        });
        return;
      }
      if (!validateForm(form)) return;
      try {
        await createDirectoryListing({
          ownerType,
          ownerEntityId: scopeId,
          ...formToCreateInput(form),
        });
        toast({
          title: "Created",
          description: `"${form.displayName.trim()}" was added to the directory as a draft.`,
        });
        onSuccess();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create listing",
          variant: "destructive",
        });
      }
    },
    [ownerType, scopeId, onRefetch],
  );

  const updateListingHandler = useCallback(
    async (
      id: string,
      form: DirectoryFormState,
      onSuccess: () => void,
    ): Promise<void> => {
      if (!validateForm(form)) return;
      try {
        await updateDirectoryListing(formToUpdateInput(id, form));
        toast({
          title: "Saved",
          description: "Listing updated successfully.",
        });
        onSuccess();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update listing",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  const publishListingHandler = useCallback(
    async (id: string): Promise<void> => {
      try {
        await publishDirectoryListing(id);
        toast({ title: "Published", description: "Listing is now live." });
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to publish listing",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  const unpublishListingHandler = useCallback(
    async (id: string): Promise<void> => {
      try {
        await unpublishDirectoryListing(id);
        toast({
          title: "Unpublished",
          description: "Listing is no longer publicly visible.",
        });
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to unpublish listing",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  const archiveListingHandler = useCallback(
    async (id: string, onSuccess?: () => void): Promise<void> => {
      try {
        await archiveDirectoryListing(id);
        toast({
          title: "Archived",
          description: "Listing has been archived.",
        });
        onSuccess?.();
        onRefetch();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to archive listing",
          variant: "destructive",
        });
      }
    },
    [onRefetch],
  );

  const loadListingDetail = useCallback(
    async (id: string): Promise<DirectoryListing | null> => {
      try {
        return await directoryListing(id);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to load listing",
          variant: "destructive",
        });
        return null;
      }
    },
    [],
  );

  return {
    createListingHandler,
    updateListingHandler,
    publishListingHandler,
    unpublishListingHandler,
    archiveListingHandler,
    loadListingDetail,
  };
}
