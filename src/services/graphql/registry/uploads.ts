import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";
import {
  requestRegistryCsvUploadUrl,
  bulkImportRegistryEntries,
} from "./mutations";
import type { RegistryImportJob } from "./types";

/**
 * Full bulk-CSV import flow for a registry:
 *   1. Request a signed v4 PUT URL via `requestRegistryCsvUploadUrl`.
 *   2. PUT the CSV file binary to that URL (no auth header — the signed URL
 *      already embeds credentials).
 *   3. Kick off the import job via `bulkImportRegistryEntries(registryId,
 *      storageKey)` and return the created/queued `RegistryImportJob`.
 *
 * Poll the job afterwards with `registryImportJob(id, registryId)` to surface
 * progress (total / processed / succeeded / failed) and `errorsJson`.
 */
export async function uploadAndImportRegistryCsv(
  registryId: string,
  file: File,
): Promise<RegistryImportJob> {
  const contentType = file.type || "text/csv";
  const signed = await requestRegistryCsvUploadUrl(
    registryId,
    contentType,
    file.name,
  );
  await uploadFileToSignedUrl(signed.uploadUrl, file, contentType);
  return bulkImportRegistryEntries(registryId, signed.storageKey);
}
