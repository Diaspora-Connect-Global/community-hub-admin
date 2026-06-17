/**
 * Registry Service — GraphQL API for community / association admin.
 *
 * All operations require a Bearer JWT and are membership-gated (fail-closed) at
 * the gateway against the registry owner. Only the STAFF-scoped surface is
 * exposed here; the SYSTEM-admin registry-type taxonomy lives in a separate
 * super-admin portal.
 */

export * from "./types";
export * from "./fragments";
export {
  registries,
  registry,
  registryEntries,
  registryEntry,
  pendingRegistryVerification,
  searchRegistryEntries,
  registryBroadcasts,
  registryImportJob,
} from "./queries";
export {
  createRegistry,
  updateRegistry,
  archiveRegistry,
  addRegistryEntry,
  updateRegistryEntry,
  verifyRegistryEntry,
  rejectRegistryEntry,
  suspendRegistryEntry,
  changeRegistryEntryMembershipStatus,
  setRegistryEntryDirectoryVisibility,
  requestRegistryCsvUploadUrl,
  bulkImportRegistryEntries,
  sendRegistryBroadcast,
} from "./mutations";
export { uploadAndImportRegistryCsv } from "./uploads";
