/**
 * Admin CRUD + lifecycle for Resources (community / association knowledge base).
 *
 * Backed by the api-gateway resource resolver. Auth is the usual Bearer JWT; the
 * gateway gates each WRITE to staff of the owner (assertStaffForOwner).
 *
 * MONEY: `downloadFeeMinor` is integer minor units (×100 of the major unit);
 * 0 / omitted = free. Never a decimal.
 */
import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { RESOURCE_FRAGMENT } from "./fragments";
import type {
  Resource,
  ResourceUploadUrl,
  ResourceOwnerType,
  ResourceVisibility,
  ResourceFileType,
} from "./types";

// ── Input shapes (mirror the gateway @InputType definitions) ─────────────────

/** `CreateResourceInput`. Always pass ownerType=COMMUNITY + the admin's scope id. */
export interface CreateResourceInput {
  ownerType?: ResourceOwnerType;
  ownerEntityId?: string | null;
  title: string;
  description?: string | null;
  fileType?: ResourceFileType | null;
  visibility?: ResourceVisibility | null;
  categoryIds?: string[];
  tags?: string[];
  /** Integer minor units; 0 / omitted = free. */
  downloadFeeMinor?: number | null;
  feeCurrency?: string | null;
  /** Optional per-owner resource-number prefix, e.g. "EMB-DOC". */
  numberPrefix?: string | null;
}

/** `UpdateResourceInput`. Only `id` is required; omit fields to leave them unchanged. */
export interface UpdateResourceInput {
  id: string;
  title?: string;
  description?: string | null;
  fileType?: ResourceFileType | null;
  categoryIds?: string[];
  tags?: string[];
  /** Integer minor units. */
  downloadFeeMinor?: number | null;
  feeCurrency?: string | null;
  /** Set the fee back to free. */
  clearFee?: boolean;
}

// ── Operations ───────────────────────────────────────────────────────────────

const CREATE_RESOURCE = `
  ${RESOURCE_FRAGMENT}
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      ...ResourceInfo
    }
  }
`;

const UPDATE_RESOURCE = `
  ${RESOURCE_FRAGMENT}
  mutation UpdateResource($input: UpdateResourceInput!) {
    updateResource(input: $input) {
      ...ResourceInfo
    }
  }
`;

const PUBLISH_RESOURCE = `
  ${RESOURCE_FRAGMENT}
  mutation PublishResource($id: ID!) {
    publishResource(id: $id) {
      ...ResourceInfo
    }
  }
`;

const UNPUBLISH_RESOURCE = `
  ${RESOURCE_FRAGMENT}
  mutation UnpublishResource($id: ID!) {
    unpublishResource(id: $id) {
      ...ResourceInfo
    }
  }
`;

const ARCHIVE_RESOURCE = `
  ${RESOURCE_FRAGMENT}
  mutation ArchiveResource($id: ID!) {
    archiveResource(id: $id) {
      ...ResourceInfo
    }
  }
`;

const REQUEST_RESOURCE_UPLOAD_URL = `
  mutation RequestResourceUploadUrl(
    $resourceId: ID!
    $contentType: String!
    $fileExtension: String!
  ) {
    requestResourceUploadUrl(
      resourceId: $resourceId
      contentType: $contentType
      fileExtension: $fileExtension
    ) {
      uploadUrl
      storageKey
      versionId
      expiresAt
    }
  }
`;

const CONFIRM_RESOURCE_VERSION = `
  ${RESOURCE_FRAGMENT}
  mutation ConfirmResourceVersion(
    $resourceId: ID!
    $versionId: ID!
    $storageKey: String!
    $fileSize: Int
    $mimeType: String
  ) {
    confirmResourceVersion(
      resourceId: $resourceId
      versionId: $versionId
      storageKey: $storageKey
      fileSize: $fileSize
      mimeType: $mimeType
    ) {
      ...ResourceInfo
    }
  }
`;

/** Create a new (DRAFT) resource for an owner. */
export async function createResource(
  input: CreateResourceInput,
): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { createResource: Resource },
    { input: CreateResourceInput }
  >(CREATE_RESOURCE, { input });
  return data.createResource;
}

/** Update a resource's metadata. Omit fields to leave them unchanged. */
export async function updateResource(
  input: UpdateResourceInput,
): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { updateResource: Resource },
    { input: UpdateResourceInput }
  >(UPDATE_RESOURCE, { input });
  return data.updateResource;
}

/** DRAFT -> PUBLISHED. */
export async function publishResource(id: string): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { publishResource: Resource },
    { id: string }
  >(PUBLISH_RESOURCE, { id });
  return data.publishResource;
}

/** PUBLISHED -> DRAFT. */
export async function unpublishResource(id: string): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { unpublishResource: Resource },
    { id: string }
  >(UNPUBLISH_RESOURCE, { id });
  return data.unpublishResource;
}

/** -> ARCHIVED. */
export async function archiveResource(id: string): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { archiveResource: Resource },
    { id: string }
  >(ARCHIVE_RESOURCE, { id });
  return data.archiveResource;
}

/** Step 1 of file upload — request a signed PUT URL (pre-allocates a versionId). */
export async function requestResourceUploadUrl(
  resourceId: string,
  contentType: string,
  fileExtension: string,
): Promise<ResourceUploadUrl> {
  const data = await graphqlRequestWithAuth<
    { requestResourceUploadUrl: ResourceUploadUrl },
    { resourceId: string; contentType: string; fileExtension: string }
  >(REQUEST_RESOURCE_UPLOAD_URL, { resourceId, contentType, fileExtension });
  return data.requestResourceUploadUrl;
}

/** Step 3 of file upload — confirm the uploaded version. */
export async function confirmResourceVersion(
  resourceId: string,
  versionId: string,
  storageKey: string,
  fileSize?: number,
  mimeType?: string,
): Promise<Resource> {
  const data = await graphqlRequestWithAuth<
    { confirmResourceVersion: Resource },
    {
      resourceId: string;
      versionId: string;
      storageKey: string;
      fileSize?: number;
      mimeType?: string;
    }
  >(CONFIRM_RESOURCE_VERSION, {
    resourceId,
    versionId,
    storageKey,
    fileSize,
    mimeType,
  });
  return data.confirmResourceVersion;
}
