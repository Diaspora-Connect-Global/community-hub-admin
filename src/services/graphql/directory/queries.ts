import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  DIRECTORY_LISTING_SUMMARY_FRAGMENT,
  DIRECTORY_LISTING_FULL_FRAGMENT,
  DIRECTORY_CATEGORY_FRAGMENT,
} from "./fragments";
import type {
  DirectoryListing,
  DirectoryListingSummary,
  DirectoryCategory,
  DirectoryOwnerType,
  DirectoryListingStatus,
  DirectoryVerificationStatus,
  SearchDirectoryInput,
} from "./types";

// ── Documents ────────────────────────────────────────────────────────────────

const OWNER_DIRECTORY_LISTINGS = `
  ${DIRECTORY_LISTING_SUMMARY_FRAGMENT}
  query OwnerDirectoryListings(
    $ownerType: DirectoryOwnerType!
    $ownerEntityId: ID!
    $status: DirectoryListingStatus
    $verificationStatus: DirectoryVerificationStatus
    $limit: Int
    $offset: Int
  ) {
    ownerDirectoryListings(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      status: $status
      verificationStatus: $verificationStatus
      limit: $limit
      offset: $offset
    ) {
      ...DirectoryListingSummaryInfo
    }
  }
`;

const DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  query DirectoryListing($id: ID!) {
    directoryListing(id: $id) {
      ...DirectoryListingFullInfo
    }
  }
`;

const DIRECTORY_CATEGORIES = `
  ${DIRECTORY_CATEGORY_FRAGMENT}
  query DirectoryCategories(
    $ownerType: DirectoryOwnerType!
    $ownerEntityId: String
  ) {
    directoryCategories(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...DirectoryCategoryInfo
    }
  }
`;

const SEARCH_DIRECTORY = `
  ${DIRECTORY_LISTING_SUMMARY_FRAGMENT}
  query SearchDirectory($input: SearchDirectoryInput) {
    searchDirectory(input: $input) {
      ...DirectoryListingSummaryInfo
    }
  }
`;

// ── Functions ────────────────────────────────────────────────────────────────

export interface OwnerDirectoryListingsArgs {
  ownerType: DirectoryOwnerType;
  ownerEntityId: string;
  status?: DirectoryListingStatus;
  verificationStatus?: DirectoryVerificationStatus;
  limit?: number;
  offset?: number;
}

/**
 * Staff/org-scoped listing query. The gateway asserts the caller is active org
 * staff (admin/officer) of the given owner before returning anything.
 */
export async function ownerDirectoryListings(
  args: OwnerDirectoryListingsArgs,
): Promise<DirectoryListingSummary[]> {
  const data = await graphqlRequestWithAuth<
    { ownerDirectoryListings: DirectoryListingSummary[] },
    OwnerDirectoryListingsArgs
  >(OWNER_DIRECTORY_LISTINGS, args);
  return data.ownerDirectoryListings ?? [];
}

export async function directoryListing(
  id: string,
): Promise<DirectoryListing | null> {
  const data = await graphqlRequestWithAuth<
    { directoryListing: DirectoryListing | null },
    { id: string }
  >(DIRECTORY_LISTING, { id });
  return data.directoryListing;
}

export async function directoryCategories(
  ownerType: DirectoryOwnerType,
  ownerEntityId?: string,
): Promise<DirectoryCategory[]> {
  const data = await graphqlRequestWithAuth<
    { directoryCategories: DirectoryCategory[] },
    { ownerType: DirectoryOwnerType; ownerEntityId?: string }
  >(DIRECTORY_CATEGORIES, { ownerType, ownerEntityId });
  return data.directoryCategories ?? [];
}

export async function searchDirectory(
  input?: SearchDirectoryInput,
): Promise<DirectoryListingSummary[]> {
  const data = await graphqlRequestWithAuth<
    { searchDirectory: DirectoryListingSummary[] },
    { input?: SearchDirectoryInput }
  >(SEARCH_DIRECTORY, { input });
  return data.searchDirectory ?? [];
}
