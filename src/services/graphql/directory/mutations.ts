import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { DIRECTORY_LISTING_FULL_FRAGMENT } from "./fragments";
import type {
  DirectoryListing,
  CreateDirectoryListingInput,
  UpdateDirectoryListingInput,
} from "./types";

const CREATE_DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  mutation CreateDirectoryListing($input: CreateDirectoryListingInput!) {
    createDirectoryListing(input: $input) {
      ...DirectoryListingFullInfo
    }
  }
`;

const UPDATE_DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  mutation UpdateDirectoryListing($input: UpdateDirectoryListingInput!) {
    updateDirectoryListing(input: $input) {
      ...DirectoryListingFullInfo
    }
  }
`;

const PUBLISH_DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  mutation PublishDirectoryListing($id: ID!) {
    publishDirectoryListing(id: $id) {
      ...DirectoryListingFullInfo
    }
  }
`;

const UNPUBLISH_DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  mutation UnpublishDirectoryListing($id: ID!) {
    unpublishDirectoryListing(id: $id) {
      ...DirectoryListingFullInfo
    }
  }
`;

const ARCHIVE_DIRECTORY_LISTING = `
  ${DIRECTORY_LISTING_FULL_FRAGMENT}
  mutation ArchiveDirectoryListing($id: ID!) {
    archiveDirectoryListing(id: $id) {
      ...DirectoryListingFullInfo
    }
  }
`;

export async function createDirectoryListing(
  input: CreateDirectoryListingInput,
): Promise<DirectoryListing> {
  const data = await graphqlRequestWithAuth<
    { createDirectoryListing: DirectoryListing },
    { input: CreateDirectoryListingInput }
  >(CREATE_DIRECTORY_LISTING, { input });
  return data.createDirectoryListing;
}

export async function updateDirectoryListing(
  input: UpdateDirectoryListingInput,
): Promise<DirectoryListing> {
  const data = await graphqlRequestWithAuth<
    { updateDirectoryListing: DirectoryListing },
    { input: UpdateDirectoryListingInput }
  >(UPDATE_DIRECTORY_LISTING, { input });
  return data.updateDirectoryListing;
}

export async function publishDirectoryListing(
  id: string,
): Promise<DirectoryListing> {
  const data = await graphqlRequestWithAuth<
    { publishDirectoryListing: DirectoryListing },
    { id: string }
  >(PUBLISH_DIRECTORY_LISTING, { id });
  return data.publishDirectoryListing;
}

export async function unpublishDirectoryListing(
  id: string,
): Promise<DirectoryListing> {
  const data = await graphqlRequestWithAuth<
    { unpublishDirectoryListing: DirectoryListing },
    { id: string }
  >(UNPUBLISH_DIRECTORY_LISTING, { id });
  return data.unpublishDirectoryListing;
}

export async function archiveDirectoryListing(
  id: string,
): Promise<DirectoryListing> {
  const data = await graphqlRequestWithAuth<
    { archiveDirectoryListing: DirectoryListing },
    { id: string }
  >(ARCHIVE_DIRECTORY_LISTING, { id });
  return data.archiveDirectoryListing;
}
