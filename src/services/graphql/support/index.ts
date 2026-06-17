/**
 * Support / Case-Management Service — GraphQL API for staff/org-scoped admin.
 *
 * All operations require a Bearer JWT and are membership-gated at the gateway
 * (org admin/officer of the case owner, or a system admin). This module exposes
 * ONLY the staff-scoped surface — user-submission and system-admin (allCases,
 * case-type CRUD) operations are intentionally omitted.
 */

export * from "./types";
export * from "./fragments";
export {
  ownerCases,
  supportCase,
  caseInternalNotes,
  caseEvidence,
  caseStatusHistory,
  caseTypes,
} from "./queries";
export {
  assignCase,
  updateCaseStatus,
  addCaseInternalNote,
  requestCaseEvidenceUploadUrl,
  addCaseEvidence,
} from "./mutations";
export { uploadCaseEvidence } from "./uploads";
