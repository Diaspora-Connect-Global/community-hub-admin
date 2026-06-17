import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";
import {
  requestServiceRequestDocumentUploadUrl,
  addServiceRequestDocument,
} from "./mutations";
import type { ServiceRequestDocument } from "./types";

/**
 * Full document-upload flow for a service request:
 *   1. requestServiceRequestDocumentUploadUrl -> signed PUT URL + documentId
 *   2. PUT the file binary to that URL (signed, no auth header)
 *   3. addServiceRequestDocument -> confirm + persist size, returns the document
 *
 * `formFieldKey` links the upload to a FILE_UPLOAD form field on the RequestType.
 */
export async function uploadServiceRequestDocument(
  requestId: string,
  file: File,
  formFieldKey?: string,
): Promise<ServiceRequestDocument> {
  const contentType = file.type || "application/octet-stream";
  const signed = await requestServiceRequestDocumentUploadUrl(
    requestId,
    contentType,
    file.name,
    formFieldKey,
  );
  await uploadFileToSignedUrl(signed.uploadUrl, file, contentType);
  return addServiceRequestDocument(requestId, signed.documentId, file.size);
}
