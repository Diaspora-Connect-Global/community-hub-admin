import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  SUPPORT_CASE_SUMMARY_FRAGMENT,
  SUPPORT_CASE_FRAGMENT,
  SUPPORT_CASE_NOTE_FRAGMENT,
  SUPPORT_CASE_EVIDENCE_FRAGMENT,
  SUPPORT_STATUS_HISTORY_FRAGMENT,
  SUPPORT_CASE_TYPE_FRAGMENT,
} from "./fragments";
import type {
  SupportCase,
  SupportCaseSummary,
  SupportCaseNote,
  SupportCaseEvidence,
  SupportCaseStatusHistoryEntry,
  SupportCaseType,
  SupportOwnerType,
  SupportCaseStatus,
  SupportPriority,
  OwnerCasesArgs,
} from "./types";

// ── Documents ────────────────────────────────────────────────────────────────

const OWNER_CASES = `
  ${SUPPORT_CASE_SUMMARY_FRAGMENT}
  query OwnerCases(
    $ownerType: SupportOwnerType!
    $ownerEntityId: ID!
    $status: SupportCaseStatus
    $priority: SupportPriority
    $assigneeUserId: ID
    $limit: Int
    $offset: Int
  ) {
    ownerCases(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      status: $status
      priority: $priority
      assigneeUserId: $assigneeUserId
      limit: $limit
      offset: $offset
    ) {
      ...SupportCaseSummaryInfo
    }
  }
`;

const SUPPORT_CASE = `
  ${SUPPORT_CASE_FRAGMENT}
  query SupportCase($id: ID!) {
    supportCase(id: $id) {
      ...SupportCaseInfo
    }
  }
`;

const CASE_INTERNAL_NOTES = `
  ${SUPPORT_CASE_NOTE_FRAGMENT}
  query CaseInternalNotes($caseId: ID!, $limit: Int, $offset: Int) {
    caseInternalNotes(caseId: $caseId, limit: $limit, offset: $offset) {
      ...SupportCaseNoteInfo
    }
  }
`;

const CASE_EVIDENCE = `
  ${SUPPORT_CASE_EVIDENCE_FRAGMENT}
  query CaseEvidence($caseId: ID!) {
    caseEvidence(caseId: $caseId) {
      ...SupportCaseEvidenceInfo
    }
  }
`;

const CASE_STATUS_HISTORY = `
  ${SUPPORT_STATUS_HISTORY_FRAGMENT}
  query CaseStatusHistory($caseId: ID!) {
    caseStatusHistory(caseId: $caseId) {
      ...SupportStatusHistoryInfo
    }
  }
`;

const CASE_TYPES = `
  ${SUPPORT_CASE_TYPE_FRAGMENT}
  query CaseTypes($ownerType: SupportOwnerType!, $ownerEntityId: String) {
    caseTypes(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...SupportCaseTypeInfo
    }
  }
`;

// ── Functions ──────────────────────────────────────────────────────────────

/** Staff-scoped list of cases for an owner entity (community / association). */
export async function ownerCases(args: OwnerCasesArgs): Promise<SupportCaseSummary[]> {
  const data = await graphqlRequestWithAuth<
    { ownerCases: SupportCaseSummary[] },
    OwnerCasesArgs
  >(OWNER_CASES, args);
  return data.ownerCases;
}

/** Single case aggregate. `statusHistory` is populated only for staff callers. */
export async function supportCase(id: string): Promise<SupportCase | null> {
  const data = await graphqlRequestWithAuth<
    { supportCase: SupportCase | null },
    { id: string }
  >(SUPPORT_CASE, { id });
  return data.supportCase;
}

/** Staff-only internal notes on a case (never visible to reporters). */
export async function caseInternalNotes(
  caseId: string,
  limit?: number,
  offset?: number,
): Promise<SupportCaseNote[]> {
  const data = await graphqlRequestWithAuth<
    { caseInternalNotes: SupportCaseNote[] },
    { caseId: string; limit?: number; offset?: number }
  >(CASE_INTERNAL_NOTES, { caseId, limit, offset });
  return data.caseInternalNotes;
}

/** Evidence attachments for a case, each carrying a fresh signed `readUrl`. */
export async function caseEvidence(caseId: string): Promise<SupportCaseEvidence[]> {
  const data = await graphqlRequestWithAuth<
    { caseEvidence: SupportCaseEvidence[] },
    { caseId: string }
  >(CASE_EVIDENCE, { caseId });
  return data.caseEvidence;
}

/** Status-history audit trail for a case. */
export async function caseStatusHistory(
  caseId: string,
): Promise<SupportCaseStatusHistoryEntry[]> {
  const data = await graphqlRequestWithAuth<
    { caseStatusHistory: SupportCaseStatusHistoryEntry[] },
    { caseId: string }
  >(CASE_STATUS_HISTORY, { caseId });
  return data.caseStatusHistory;
}

/** Active case-type config rows for an owner (used to label cases by type). */
export async function caseTypes(
  ownerType: SupportOwnerType,
  ownerEntityId?: string,
): Promise<SupportCaseType[]> {
  const data = await graphqlRequestWithAuth<
    { caseTypes: SupportCaseType[] },
    { ownerType: SupportOwnerType; ownerEntityId?: string }
  >(CASE_TYPES, { ownerType, ownerEntityId });
  return data.caseTypes;
}

export type { SupportCaseStatus, SupportPriority };
