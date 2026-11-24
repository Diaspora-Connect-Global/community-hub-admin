/**
 * Uploads a file binary to a GCS signed URL.
 *
 * This is the shared second step of all image/media upload flows:
 *   1. Call the relevant upload URL mutation (getCommunityAvatarUploadUrl,
 *      getCommunityCoverUploadUrl, requestUploadUrl, getAssociationAvatarUploadUrl, etc.)
 *      to receive { uploadUrl, fileUrl (or objectKey) }
 *   2. Call this function with the signed uploadUrl, the File/Blob, and the same
 *      contentType you passed to the mutation.
 *   3. Save the returned fileUrl on the entity via the update mutation.
 *
 * Note: No Authorization header is sent — the signed URL already embeds credentials.
 */

/**
 * The cache-control value the backend signers put in the URL (community-service,
 * event-service, post-feed-service and the gateway all sign this exact string).
 * A V4 signed URL lists every header it was signed over; storage answers 400
 * when one is missing and 403 when one differs, so it must be sent byte-for-byte.
 */
export const SIGNED_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * The headers to send with a PUT to `uploadUrl`. Content-Type always; Cache-Control
 * only when the URL says it was signed over it (`X-Goog-SignedHeaders`), so
 * uploads to services that do not sign it are unchanged.
 */
export function signedUploadHeaders(uploadUrl: string, contentType: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": contentType };
  let signed = "";
  try {
    signed = new URL(uploadUrl).searchParams.get("X-Goog-SignedHeaders") ?? "";
  } catch {
    signed = "";
  }
  if (signed.toLowerCase().split(";").includes("cache-control")) {
    headers["Cache-Control"] = SIGNED_CACHE_CONTROL;
  }
  return headers;
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: signedUploadHeaders(uploadUrl, contentType),
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `GCS upload failed: ${response.status.toString()} ${response.statusText}`
    );
  }
}
