import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  REGISTRY_FORM_FIELD_FRAGMENT,
  REGISTRY_FULL_FRAGMENT,
  REGISTRY_SUMMARY_FRAGMENT,
  REGISTRY_ENTRY_FULL_FRAGMENT,
  REGISTRY_ENTRY_SUMMARY_FRAGMENT,
  REGISTRY_IMPORT_JOB_FRAGMENT,
  REGISTRY_BROADCAST_FRAGMENT,
} from "./fragments";
import type {
  Registry,
  RegistrySummary,
  RegistryEntry,
  RegistryEntrySummary,
  RegistryImportJob,
  RegistryBroadcast,
  RegistryOwnerType,
  RegistryStatus,
  RegistryVerificationStatus,
  RegistryMembershipStatus,
  SearchRegistryEntriesInput,
} from "./types";

// ── Registry list / detail ───────────────────────────────────────────────────

const REGISTRIES = `
  ${REGISTRY_SUMMARY_FRAGMENT}
  query Registries(
    $ownerType: RegistryOwnerType!
    $ownerEntityId: ID!
    $status: RegistryStatus
    $limit: Int
    $offset: Int
  ) {
    registries(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      ...RegistrySummaryInfo
    }
  }
`;

const REGISTRY = `
  ${REGISTRY_FORM_FIELD_FRAGMENT}
  ${REGISTRY_FULL_FRAGMENT}
  query Registry($id: ID!) {
    registry(id: $id) {
      ...RegistryFullInfo
    }
  }
`;

// ── Entry list / detail ──────────────────────────────────────────────────────

const REGISTRY_ENTRIES = `
  ${REGISTRY_ENTRY_SUMMARY_FRAGMENT}
  query RegistryEntries(
    $registryId: ID!
    $verificationStatus: RegistryVerificationStatus
    $membershipStatus: RegistryMembershipStatus
    $limit: Int
    $offset: Int
  ) {
    registryEntries(
      registryId: $registryId
      verificationStatus: $verificationStatus
      membershipStatus: $membershipStatus
      limit: $limit
      offset: $offset
    ) {
      ...RegistryEntrySummaryInfo
    }
  }
`;

const REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  query RegistryEntry($id: ID!) {
    registryEntry(id: $id) {
      ...RegistryEntryFullInfo
    }
  }
`;

const PENDING_REGISTRY_VERIFICATION = `
  ${REGISTRY_ENTRY_SUMMARY_FRAGMENT}
  query PendingRegistryVerification(
    $ownerType: RegistryOwnerType!
    $ownerEntityId: ID!
    $registryId: ID
    $limit: Int
    $offset: Int
  ) {
    pendingRegistryVerification(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      registryId: $registryId
      limit: $limit
      offset: $offset
    ) {
      ...RegistryEntrySummaryInfo
    }
  }
`;

const SEARCH_REGISTRY_ENTRIES = `
  ${REGISTRY_ENTRY_SUMMARY_FRAGMENT}
  query SearchRegistryEntries(
    $ownerType: RegistryOwnerType!
    $ownerEntityId: ID!
    $input: SearchRegistryEntriesInput
  ) {
    searchRegistryEntries(
      ownerType: $ownerType
      ownerEntityId: $ownerEntityId
      input: $input
    ) {
      ...RegistryEntrySummaryInfo
    }
  }
`;

// ── Broadcasts / import job ──────────────────────────────────────────────────

const REGISTRY_BROADCASTS = `
  ${REGISTRY_BROADCAST_FRAGMENT}
  query RegistryBroadcasts($registryId: ID!, $limit: Int, $offset: Int) {
    registryBroadcasts(registryId: $registryId, limit: $limit, offset: $offset) {
      ...RegistryBroadcastInfo
    }
  }
`;

const REGISTRY_IMPORT_JOB = `
  ${REGISTRY_IMPORT_JOB_FRAGMENT}
  query RegistryImportJob($id: ID!, $registryId: ID!) {
    registryImportJob(id: $id, registryId: $registryId) {
      ...RegistryImportJobInfo
    }
  }
`;

// ── Async functions ──────────────────────────────────────────────────────────

export async function registries(
  ownerType: RegistryOwnerType,
  ownerEntityId: string,
  status?: RegistryStatus,
  limit?: number,
  offset?: number,
): Promise<RegistrySummary[]> {
  const data = await graphqlRequestWithAuth<
    { registries: RegistrySummary[] },
    {
      ownerType: RegistryOwnerType;
      ownerEntityId: string;
      status?: RegistryStatus;
      limit?: number;
      offset?: number;
    }
  >(REGISTRIES, { ownerType, ownerEntityId, status, limit, offset });
  return data.registries;
}

export async function registry(id: string): Promise<Registry | null> {
  const data = await graphqlRequestWithAuth<
    { registry: Registry | null },
    { id: string }
  >(REGISTRY, { id });
  return data.registry;
}

export async function registryEntries(
  registryId: string,
  opts?: {
    verificationStatus?: RegistryVerificationStatus;
    membershipStatus?: RegistryMembershipStatus;
    limit?: number;
    offset?: number;
  },
): Promise<RegistryEntrySummary[]> {
  const data = await graphqlRequestWithAuth<
    { registryEntries: RegistryEntrySummary[] },
    {
      registryId: string;
      verificationStatus?: RegistryVerificationStatus;
      membershipStatus?: RegistryMembershipStatus;
      limit?: number;
      offset?: number;
    }
  >(REGISTRY_ENTRIES, {
    registryId,
    verificationStatus: opts?.verificationStatus,
    membershipStatus: opts?.membershipStatus,
    limit: opts?.limit,
    offset: opts?.offset,
  });
  return data.registryEntries;
}

export async function registryEntry(id: string): Promise<RegistryEntry | null> {
  const data = await graphqlRequestWithAuth<
    { registryEntry: RegistryEntry | null },
    { id: string }
  >(REGISTRY_ENTRY, { id });
  return data.registryEntry;
}

export async function pendingRegistryVerification(
  ownerType: RegistryOwnerType,
  ownerEntityId: string,
  opts?: { registryId?: string; limit?: number; offset?: number },
): Promise<RegistryEntrySummary[]> {
  const data = await graphqlRequestWithAuth<
    { pendingRegistryVerification: RegistryEntrySummary[] },
    {
      ownerType: RegistryOwnerType;
      ownerEntityId: string;
      registryId?: string;
      limit?: number;
      offset?: number;
    }
  >(PENDING_REGISTRY_VERIFICATION, {
    ownerType,
    ownerEntityId,
    registryId: opts?.registryId,
    limit: opts?.limit,
    offset: opts?.offset,
  });
  return data.pendingRegistryVerification;
}

export async function searchRegistryEntries(
  ownerType: RegistryOwnerType,
  ownerEntityId: string,
  input?: SearchRegistryEntriesInput,
): Promise<RegistryEntrySummary[]> {
  const data = await graphqlRequestWithAuth<
    { searchRegistryEntries: RegistryEntrySummary[] },
    {
      ownerType: RegistryOwnerType;
      ownerEntityId: string;
      input?: SearchRegistryEntriesInput;
    }
  >(SEARCH_REGISTRY_ENTRIES, { ownerType, ownerEntityId, input });
  return data.searchRegistryEntries;
}

export async function registryBroadcasts(
  registryId: string,
  limit?: number,
  offset?: number,
): Promise<RegistryBroadcast[]> {
  const data = await graphqlRequestWithAuth<
    { registryBroadcasts: RegistryBroadcast[] },
    { registryId: string; limit?: number; offset?: number }
  >(REGISTRY_BROADCASTS, { registryId, limit, offset });
  return data.registryBroadcasts;
}

export async function registryImportJob(
  id: string,
  registryId: string,
): Promise<RegistryImportJob | null> {
  const data = await graphqlRequestWithAuth<
    { registryImportJob: RegistryImportJob | null },
    { id: string; registryId: string }
  >(REGISTRY_IMPORT_JOB, { id, registryId });
  return data.registryImportJob;
}
