/**
 * Service Request Service — GraphQL API for community / association admin.
 *
 * Staff/org-scoped surface ONLY. User-submission and system-admin operations
 * (submitServiceRequest, myServiceRequests, allServiceRequests, request-type
 * CRUD, etc.) are intentionally NOT exposed here.
 *
 * All operations require a Bearer JWT; the gateway membership-gates them to org
 * staff of the request owner (fail-closed).
 */

export * from "./types";
export * from "./fragments";
export {
  ownerServiceRequests,
  serviceRequest,
  serviceRequestInternalNotes,
  serviceRequestDocuments,
  serviceRequestStatusHistory,
  serviceRequestTypes,
} from "./queries";
export {
  assignServiceRequest,
  startServiceRequestReview,
  requestServiceRequestInfo,
  approveServiceRequest,
  rejectServiceRequest,
  completeServiceRequest,
  retryServiceRequestPayment,
  addServiceRequestInternalNote,
  requestServiceRequestDocumentUploadUrl,
  addServiceRequestDocument,
} from "./mutations";
export { uploadServiceRequestDocument } from "./uploads";
