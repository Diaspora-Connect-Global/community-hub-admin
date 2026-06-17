import { uploadFileToSignedUrl } from "@/services/uploadFileToSignedUrl";
import {
  requestCaseEvidenceUploadUrl,
  addCaseEvidence,
} from "./mutations";
import type { SupportCaseEvidence } from "./types";

/**
 * Full evidence-upload flow for a support case:
 *   1. Request a pre-signed PUT URL (`requestCaseEvidenceUploadUrl`).
 *   2. PUT the file binary to that URL (no auth header — the URL is signed).
 *   3. Confirm the upload via `addCaseEvidence`, returning the persisted row
 *      (with a fresh signed `readUrl`).
 *
 * Mirrors the event-cover upload flow in `events/uploads.ts`.
 */
export async function uploadCaseEvidence(
  caseId: string,
  file: File,
): Promise<SupportCaseEvidence> {
  const contentType = file.type || "application/octet-stream";
  const signed = await requestCaseEvidenceUploadUrl(caseId, contentType, file.name);
  await uploadFileToSignedUrl(signed.uploadUrl, file, contentType);
  return addCaseEvidence(caseId, signed.evidenceId, file.size);
}
