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
export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `GCS upload failed: ${response.status.toString()} ${response.statusText}`
    );
  }
}
