/**
 * Admin CRUD for Service Request *Types* (the per-owner dynamic form templates).
 *
 * These are the staff-side type-management operations (create / update /
 * deactivate) plus the admin list query that — unlike the public
 * `serviceRequestTypes` read — INCLUDES inactive rows.
 *
 * Backed by the api-gateway service-request resolver. Auth is the usual Bearer
 * JWT; the gateway gates each call to staff of the owner (assertStaffForOwner).
 *
 * Verified against live (api.diaspoplug.net) — shapes confirmed by round-trip:
 *   - `updateServiceRequestType` REPLACES the whole `formFields` array when a
 *     NON-EMPTY array is provided. IMPORTANT: an empty array `[]` is treated as
 *     "leave unchanged" by the backend (omit semantics), so it cannot clear all
 *     fields. The UI surfaces this so admins keep at least one field.
 *   - `options` is always returned as `[]` (never null), even for non-option
 *     field types.
 */
import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import { SERVICE_REQUEST_TYPE_FRAGMENT } from "./fragments";
import type {
  ServiceRequestType,
  ServiceRequestOwnerType,
  ServiceRequestFormFieldType,
} from "./types";

// ── Input shapes (mirror the gateway @InputType definitions) ─────────────────

/** One form-field definition on the wire (`ServiceRequestFormFieldInput`). */
export interface ServiceRequestFormFieldInput {
  key: string;
  label: string;
  type: ServiceRequestFormFieldType;
  required?: boolean;
  /** Required (non-empty) for SELECT / RADIO / CHECKBOX. */
  options?: string[];
}

/** `CreateServiceRequestTypeInput`. */
export interface CreateServiceRequestTypeInput {
  ownerType: ServiceRequestOwnerType;
  ownerEntityId?: string | null;
  code: string;
  displayName: string;
  description?: string | null;
  formFields?: ServiceRequestFormFieldInput[];
  attachedResourceIds?: string[];
  feeAmountMinor?: number | null;
  feeCurrency?: string | null;
  escrowEnabled?: boolean;
  escrowReleaseMode?: string | null;
  defaultAssigneeUserId?: string | null;
  requestNumberPrefix?: string | null;
  sortOrder?: number | null;
}

/** `UpdateServiceRequestTypeInput`. Only `id` is required; omit fields to leave them unchanged. */
export interface UpdateServiceRequestTypeInput {
  id: string;
  displayName?: string;
  description?: string | null;
  /** REPLACES the whole array when a non-empty array is sent. */
  formFields?: ServiceRequestFormFieldInput[];
  attachedResourceIds?: string[];
  feeAmountMinor?: number | null;
  feeCurrency?: string | null;
  escrowEnabled?: boolean;
  escrowReleaseMode?: string | null;
  defaultAssigneeUserId?: string | null;
  requestNumberPrefix?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

// ── Operations ───────────────────────────────────────────────────────────────

const ADMIN_SERVICE_REQUEST_TYPES = `
  ${SERVICE_REQUEST_TYPE_FRAGMENT}
  query AdminServiceRequestTypes(
    $ownerType: ServiceRequestOwnerType!
    $ownerEntityId: String
  ) {
    adminServiceRequestTypes(ownerType: $ownerType, ownerEntityId: $ownerEntityId) {
      ...ServiceRequestTypeInfo
    }
  }
`;

const CREATE_SERVICE_REQUEST_TYPE = `
  ${SERVICE_REQUEST_TYPE_FRAGMENT}
  mutation CreateServiceRequestType($input: CreateServiceRequestTypeInput!) {
    createServiceRequestType(input: $input) {
      ...ServiceRequestTypeInfo
    }
  }
`;

const UPDATE_SERVICE_REQUEST_TYPE = `
  ${SERVICE_REQUEST_TYPE_FRAGMENT}
  mutation UpdateServiceRequestType($input: UpdateServiceRequestTypeInput!) {
    updateServiceRequestType(input: $input) {
      ...ServiceRequestTypeInfo
    }
  }
`;

const DEACTIVATE_SERVICE_REQUEST_TYPE = `
  ${SERVICE_REQUEST_TYPE_FRAGMENT}
  mutation DeactivateServiceRequestType($id: ID!) {
    deactivateServiceRequestType(id: $id) {
      ...ServiceRequestTypeInfo
    }
  }
`;

/**
 * Admin list of request-types for an owner — INCLUDES inactive rows. Use this
 * for the management screen (the public `serviceRequestTypes` hides inactive).
 */
export async function adminServiceRequestTypes(
  ownerType: ServiceRequestOwnerType,
  ownerEntityId?: string,
): Promise<ServiceRequestType[]> {
  const data = await graphqlRequestWithAuth<
    { adminServiceRequestTypes: ServiceRequestType[] },
    { ownerType: ServiceRequestOwnerType; ownerEntityId?: string }
  >(ADMIN_SERVICE_REQUEST_TYPES, { ownerType, ownerEntityId });
  return data.adminServiceRequestTypes;
}

/** Create a new request-type / form template for an owner. */
export async function createServiceRequestType(
  input: CreateServiceRequestTypeInput,
): Promise<ServiceRequestType> {
  const data = await graphqlRequestWithAuth<
    { createServiceRequestType: ServiceRequestType },
    { input: CreateServiceRequestTypeInput }
  >(CREATE_SERVICE_REQUEST_TYPE, { input });
  return data.createServiceRequestType;
}

/** Update a request-type. A non-empty `formFields` array REPLACES the whole set. */
export async function updateServiceRequestType(
  input: UpdateServiceRequestTypeInput,
): Promise<ServiceRequestType> {
  const data = await graphqlRequestWithAuth<
    { updateServiceRequestType: ServiceRequestType },
    { input: UpdateServiceRequestTypeInput }
  >(UPDATE_SERVICE_REQUEST_TYPE, { input });
  return data.updateServiceRequestType;
}

/** Soft-deactivate a request-type (sets isActive=false). */
export async function deactivateServiceRequestType(
  id: string,
): Promise<ServiceRequestType> {
  const data = await graphqlRequestWithAuth<
    { deactivateServiceRequestType: ServiceRequestType },
    { id: string }
  >(DEACTIVATE_SERVICE_REQUEST_TYPE, { id });
  return data.deactivateServiceRequestType;
}
