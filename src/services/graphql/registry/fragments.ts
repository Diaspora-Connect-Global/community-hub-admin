/**
 * GraphQL fragments for Registry Service types.
 * Reuse across queries and mutations. The GraphQL type names match the gateway
 * @ObjectType class names: Registry, RegistrySummary, RegistryEntry,
 * RegistryEntrySummary, RegistryImportJob, RegistryBroadcast, RegistryFormField.
 */

export const REGISTRY_FORM_FIELD_FRAGMENT = `
  fragment RegistryFormFieldInfo on RegistryFormField {
    key
    label
    type
    required
    options
  }
`;

/** Slim registry shape for list views. */
export const REGISTRY_SUMMARY_FRAGMENT = `
  fragment RegistrySummaryInfo on RegistrySummary {
    id
    ownerType
    ownerEntityId
    registryType
    name
    code
    status
    selfRegistrationEnabled
    version
    updatedAt
  }
`;

/** Full registry shape including dynamic field schema. */
export const REGISTRY_FULL_FRAGMENT = `
  fragment RegistryFullInfo on Registry {
    id
    ownerType
    ownerEntityId
    registryType
    registryTypeId
    name
    code
    description
    fieldSchema {
      ...RegistryFormFieldInfo
    }
    selfRegistrationEnabled
    requiresApproval
    casePrefix
    sourceRequestTypeId
    sourceFieldMapJson
    status
    version
    archivedAt
    createdAt
    updatedAt
  }
`;

/** Slim entry shape for list / search views. */
export const REGISTRY_ENTRY_SUMMARY_FRAGMENT = `
  fragment RegistryEntrySummaryInfo on RegistryEntrySummary {
    id
    registryId
    ownerType
    ownerEntityId
    linkedUserId
    fullName
    email
    country
    tags
    verificationStatus
    membershipStatus
    directoryVisible
    entryNumber
    source
    createdAt
    updatedAt
  }
`;

/** Full entry shape (linked or shadow identity, both state machines). */
export const REGISTRY_ENTRY_FULL_FRAGMENT = `
  fragment RegistryEntryFullInfo on RegistryEntry {
    id
    registryId
    ownerType
    ownerEntityId
    linkedUserId
    fullName
    email
    phone
    country
    city
    fieldResponsesJson
    tags
    verificationStatus
    membershipStatus
    directoryVisible
    entryNumber
    source
    sourceRequestId
    verificationNote
    verifiedBy
    verificationSource
    claimedAt
    verifiedAt
    createdAt
    updatedAt
  }
`;

export const REGISTRY_IMPORT_JOB_FRAGMENT = `
  fragment RegistryImportJobInfo on RegistryImportJob {
    id
    registryId
    ownerType
    ownerEntityId
    status
    storageKey
    total
    processed
    succeeded
    failed
    errorsJson
    lastCursor
    actorUserId
    startedAt
    completedAt
    createdAt
    updatedAt
  }
`;

export const REGISTRY_BROADCAST_FRAGMENT = `
  fragment RegistryBroadcastInfo on RegistryBroadcast {
    id
    registryId
    ownerType
    ownerEntityId
    actorUserId
    title
    body
    channels
    recipientCount
    channelBreakdownJson
    sentAt
    createdAt
  }
`;
