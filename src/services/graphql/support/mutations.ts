import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  SUPPORT_CASE_FRAGMENT,
  SUPPORT_CASE_NOTE_FRAGMENT,
  SUPPORT_CASE_EVIDENCE_FRAGMENT,
} from "./fragments";
import type {
  SupportCase,
  SupportCaseNote,
  SupportCaseEvidence,
  SupportEvidenceUploadUrl,
  SupportCaseStatus,
} from "./types";

const ASSIGN_CASE = `
  ${SUPPORT_CASE_FRAGMENT}
  mutation AssignCase($caseId: ID!, $assigneeUserId: ID!) {
    assignCase(caseId: $caseId, assigneeUserId: $assigneeUserId) {
      ...SupportCaseInfo
    }
  }
`;

const UPDATE_CASE_STATUS = `
  ${SUPPORT_CASE_FRAGMENT}
  mutation UpdateCaseStatus(
    $caseId: ID!
    $targetStatus: SupportCaseStatus!
    $reason: String
    $resolutionSummary: String
  ) {
    updateCaseStatus(
      caseId: $caseId
      targetStatus: $targetStatus
      reason: $reason
      resolutionSummary: $resolutionSummary
    ) {
      ...SupportCaseInfo
    }
  }
`;

const ADD_CASE_INTERNAL_NOTE = `
  ${SUPPORT_CASE_NOTE_FRAGMENT}
  mutation AddCaseInternalNote($input: AddCaseInternalNoteInput!) {
    addCaseInternalNote(input: $input) {
      ...SupportCaseNoteInfo
    }
  }
`;

const REQUEST_CASE_EVIDENCE_UPLOAD_URL = `
  mutation RequestCaseEvidenceUploadUrl(
    $caseId: ID!
    $contentType: String!
    $fileName: String!
  ) {
    requestCaseEvidenceUploadUrl(
      caseId: $caseId
      contentType: $contentType
      fileName: $fileName
    ) {
      evidenceId
      uploadUrl
      readUrl
      storageKey
      expiresAt
    }
  }
`;

const ADD_CASE_EVIDENCE = `
  ${SUPPORT_CASE_EVIDENCE_FRAGMENT}
  mutation AddCaseEvidence($caseId: ID!, $evidenceId: ID!, $sizeBytes: Int) {
    addCaseEvidence(caseId: $caseId, evidenceId: $evidenceId, sizeBytes: $sizeBytes) {
      ...SupportCaseEvidenceInfo
    }
  }
`;

/** Assign a case to a staff member (transitions SUBMITTED/REOPENED → ASSIGNED). */
export async function assignCase(
  caseId: string,
  assigneeUserId: string,
): Promise<SupportCase> {
  const data = await graphqlRequestWithAuth<
    { assignCase: SupportCase },
    { caseId: string; assigneeUserId: string }
  >(ASSIGN_CASE, { caseId, assigneeUserId });
  return data.assignCase;
}

/**
 * Transition a case to `targetStatus`. `resolutionSummary` is required by the
 * backend when resolving; `reason` is the optional audit note for any transition.
 */
export async function updateCaseStatus(args: {
  caseId: string;
  targetStatus: SupportCaseStatus;
  reason?: string;
  resolutionSummary?: string;
}): Promise<SupportCase> {
  const data = await graphqlRequestWithAuth<
    { updateCaseStatus: SupportCase },
    {
      caseId: string;
      targetStatus: SupportCaseStatus;
      reason?: string;
      resolutionSummary?: string;
    }
  >(UPDATE_CASE_STATUS, args);
  return data.updateCaseStatus;
}

/** Add a staff-only internal note to a case. */
export async function addCaseInternalNote(
  caseId: string,
  body: string,
): Promise<SupportCaseNote> {
  const data = await graphqlRequestWithAuth<
    { addCaseInternalNote: SupportCaseNote },
    { input: { caseId: string; body: string } }
  >(ADD_CASE_INTERNAL_NOTE, { input: { caseId, body } });
  return data.addCaseInternalNote;
}

/** Request a pre-signed PUT URL for a piece of case evidence. */
export async function requestCaseEvidenceUploadUrl(
  caseId: string,
  contentType: string,
  fileName: string,
): Promise<SupportEvidenceUploadUrl> {
  const data = await graphqlRequestWithAuth<
    { requestCaseEvidenceUploadUrl: SupportEvidenceUploadUrl },
    { caseId: string; contentType: string; fileName: string }
  >(REQUEST_CASE_EVIDENCE_UPLOAD_URL, { caseId, contentType, fileName });
  return data.requestCaseEvidenceUploadUrl;
}

/** Confirm an evidence upload after the file has been PUT to the signed URL. */
export async function addCaseEvidence(
  caseId: string,
  evidenceId: string,
  sizeBytes?: number,
): Promise<SupportCaseEvidence> {
  const data = await graphqlRequestWithAuth<
    { addCaseEvidence: SupportCaseEvidence },
    { caseId: string; evidenceId: string; sizeBytes?: number }
  >(ADD_CASE_EVIDENCE, { caseId, evidenceId, sizeBytes });
  return data.addCaseEvidence;
}
