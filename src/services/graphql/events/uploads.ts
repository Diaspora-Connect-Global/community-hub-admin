import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";

/**
 * Signed-upload response from the gateway's generic `getUploadUrl` query.
 * The bucket pre-signs a v4 PUT URL; the file is then accessible at `publicUrl`.
 */
export interface EventCoverUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  expiresAt: number;
}

const GET_UPLOAD_URL = `
  query GetUploadUrl($category: String!, $contentType: String!) {
    getUploadUrl(category: $category, contentType: $contentType) {
      uploadUrl
      publicUrl
      objectKey
      expiresAt
    }
  }
`;

/**
 * Request a signed v4 PUT URL for an event cover image.
 *
 * Backed by the gateway query `getUploadUrl(category: "event_cover", contentType)`,
 * which is already implemented and authenticated via `GqlAuthGuard`.
 */
export async function getEventCoverUploadUrl(
  contentType: string,
): Promise<EventCoverUploadUrl> {
  const data = await graphqlRequestWithAuth<
    { getUploadUrl: EventCoverUploadUrl },
    { category: string; contentType: string }
  >(GET_UPLOAD_URL, { category: "event_cover", contentType });
  return data.getUploadUrl;
}

/**
 * Full upload flow for an event cover image:
 *   1. Request signed upload URL.
 *   2. PUT the file binary to that URL.
 *   3. Return the resulting public URL for use as `coverImageUrl` in `createEvent` /
 *      `updateEvent`.
 *
 * This replaces the previous behaviour of base64-inlining the image into the
 * `createEvent` mutation, which produced multi-megabyte GraphQL request bodies
 * and triggered nginx/gateway timeouts.
 */
export async function uploadEventCoverImage(file: File): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  const signed = await getEventCoverUploadUrl(contentType);
  await uploadFileToSignedUrl(signed.uploadUrl, file, contentType);
  return signed.publicUrl;
}
