/**
 * Admin CRUD for Support *Case Types* (the per-owner case-type configuration).
 *
 * These are the staff-side type-management operations (create / update /
 * deactivate) plus the admin list query that — unlike the public `caseTypes`
 * read — INCLUDES inactive rows (so the management screen can see and
 * re-activate them).
 *
 * Backed by the api-gateway support resolver. Auth is the usual Bearer JWT; the
 * gateway gates each call to staff of the owner.
 *
 * NOTE: Support case types have NO `formFields` (unlike service request types),
 * so the create/update inputs are a flat scalar shape.
 */
import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { SUPPORT_CASE_TYPE_FRAGMENT } from "./fragments";
import type {
  SupportCaseType,
  SupportOwnerType,
  SupportPriority,
} from "./types";

// ── Input shapes (mirror the gateway @InputType definitions) ─────────────────

/** `CreateSupportCaseTypeInput`. */
export interface CreateSupportCaseTypeInput {
  ownerType: SupportOwnerType;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  defaultPriority?: SupportPriority | null;
  slaHours?: number | null;
  caseNumberPrefix?: string | null;
  sortOrder?: number | null;
}

/** `UpdateSupportCaseTypeInput`. Only `id` is required; omit fields to leave them unchanged. */
export interface UpdateSupportCaseTypeInput {
  id: string;
  displayName?: string;
  description?: string | null;
  defaultPriority?: SupportPriority | null;
  slaHours?: number | null;
  caseNumberPrefix?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

// ── Operations ───────────────────────────────────────────────────────────────

const ADMIN_CASE_TYPES = `
  ${SUPPORT_CASE_TYPE_FRAGMENT}
  query AdminCaseTypes(
    $ownerType: SupportOwnerType!
    $ownerEntityId: String
  ) {
    adminCaseTypes(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...SupportCaseTypeInfo
    }
  }
`;

const CREATE_SUPPORT_CASE_TYPE = `
  ${SUPPORT_CASE_TYPE_FRAGMENT}
  mutation CreateSupportCaseType($input: CreateSupportCaseTypeInput!) {
    createSupportCaseType(input: $input) {
      ...SupportCaseTypeInfo
    }
  }
`;

const UPDATE_SUPPORT_CASE_TYPE = `
  ${SUPPORT_CASE_TYPE_FRAGMENT}
  mutation UpdateSupportCaseType($input: UpdateSupportCaseTypeInput!) {
    updateSupportCaseType(input: $input) {
      ...SupportCaseTypeInfo
    }
  }
`;

const DEACTIVATE_SUPPORT_CASE_TYPE = `
  ${SUPPORT_CASE_TYPE_FRAGMENT}
  mutation DeactivateSupportCaseType($id: ID!) {
    deactivateSupportCaseType(id: $id) {
      ...SupportCaseTypeInfo
    }
  }
`;

/**
 * Admin list of case-types for an owner — INCLUDES inactive rows. Use this for
 * the management screen (the public `caseTypes` read hides inactive).
 */
export async function adminCaseTypes(
  ownerType: SupportOwnerType,
  ownerEntityId?: string,
): Promise<SupportCaseType[]> {
  const data = await graphqlRequestWithAuth<
    { adminCaseTypes: SupportCaseType[] },
    { ownerType: SupportOwnerType; ownerEntityId?: string }
  >(ADMIN_CASE_TYPES, { ownerType, ownerEntityId });
  return data.adminCaseTypes;
}

/** Create a new case-type config for an owner. */
export async function createSupportCaseType(
  input: CreateSupportCaseTypeInput,
): Promise<SupportCaseType> {
  const data = await graphqlRequestWithAuth<
    { createSupportCaseType: SupportCaseType },
    { input: CreateSupportCaseTypeInput }
  >(CREATE_SUPPORT_CASE_TYPE, { input });
  return data.createSupportCaseType;
}

/** Update a case-type. Omit fields to leave them unchanged. */
export async function updateSupportCaseType(
  input: UpdateSupportCaseTypeInput,
): Promise<SupportCaseType> {
  const data = await graphqlRequestWithAuth<
    { updateSupportCaseType: SupportCaseType },
    { input: UpdateSupportCaseTypeInput }
  >(UPDATE_SUPPORT_CASE_TYPE, { input });
  return data.updateSupportCaseType;
}

/** Soft-deactivate a case-type (sets isActive=false). */
export async function deactivateSupportCaseType(
  id: string,
): Promise<SupportCaseType> {
  const data = await graphqlRequestWithAuth<
    { deactivateSupportCaseType: SupportCaseType },
    { id: string }
  >(DEACTIVATE_SUPPORT_CASE_TYPE, { id });
  return data.deactivateSupportCaseType;
}
