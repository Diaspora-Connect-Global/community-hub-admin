import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";
import {
  requestResourceUploadUrl,
  confirmResourceVersion,
} from "./mutations";
import type { Resource } from "./types";

/** Extract a lowercase file extension (no dot) from a filename; "" when none. */
function fileExtensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Full file-upload flow for a resource (signed-URL flow):
 *   1. requestResourceUploadUrl -> signed PUT URL + pre-allocated versionId
 *   2. PUT the file binary to that URL with `Content-Type: <contentType>`
 *      (signed, no auth header)
 *   3. confirmResourceVersion -> confirm + persist size/mime, returns the Resource
 */
export async function uploadResourceFile(
  resourceId: string,
  file: File,
): Promise<Resource> {
  const contentType = file.type || "application/octet-stream";
  const fileExtension = fileExtensionOf(file.name);
  const signed = await requestResourceUploadUrl(
    resourceId,
    contentType,
    fileExtension,
  );
  await uploadFileToSignedUrl(signed.uploadUrl, file, contentType);
  return confirmResourceVersion(
    resourceId,
    signed.versionId,
    signed.storageKey,
    file.size,
    contentType,
  );
}
