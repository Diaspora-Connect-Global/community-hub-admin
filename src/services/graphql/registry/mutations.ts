import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  REGISTRY_FORM_FIELD_FRAGMENT,
  REGISTRY_FULL_FRAGMENT,
  REGISTRY_ENTRY_FULL_FRAGMENT,
  REGISTRY_IMPORT_JOB_FRAGMENT,
  REGISTRY_BROADCAST_FRAGMENT,
} from "./fragments";
import type {
  Registry,
  RegistryEntry,
  RegistryImportJob,
  RegistryBroadcast,
  RegistryCsvUploadUrl,
  CreateRegistryInput,
  UpdateRegistryInput,
  AddRegistryEntryInput,
  UpdateRegistryEntryInput,
  VerifyRegistryEntryInput,
  RejectRegistryEntryInput,
  SuspendRegistryEntryInput,
  ChangeRegistryEntryMembershipStatusInput,
  SetRegistryEntryDirectoryVisibilityInput,
  SendRegistryBroadcastInput,
} from "./types";

// ── Registry CRUD ────────────────────────────────────────────────────────────

const CREATE_REGISTRY = `
  ${REGISTRY_FORM_FIELD_FRAGMENT}
  ${REGISTRY_FULL_FRAGMENT}
  mutation CreateRegistry($input: CreateRegistryInput!) {
    createRegistry(input: $input) {
      ...RegistryFullInfo
    }
  }
`;

const UPDATE_REGISTRY = `
  ${REGISTRY_FORM_FIELD_FRAGMENT}
  ${REGISTRY_FULL_FRAGMENT}
  mutation UpdateRegistry($input: UpdateRegistryInput!) {
    updateRegistry(input: $input) {
      ...RegistryFullInfo
    }
  }
`;

const ARCHIVE_REGISTRY = `
  ${REGISTRY_FORM_FIELD_FRAGMENT}
  ${REGISTRY_FULL_FRAGMENT}
  mutation ArchiveRegistry($id: ID!) {
    archiveRegistry(id: $id) {
      ...RegistryFullInfo
    }
  }
`;

// ── Entry CRUD / lifecycle ───────────────────────────────────────────────────

const ADD_REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation AddRegistryEntry($input: AddRegistryEntryInput!) {
    addRegistryEntry(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const UPDATE_REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation UpdateRegistryEntry($input: UpdateRegistryEntryInput!) {
    updateRegistryEntry(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const VERIFY_REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation VerifyRegistryEntry($input: VerifyRegistryEntryInput!) {
    verifyRegistryEntry(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const REJECT_REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation RejectRegistryEntry($input: RejectRegistryEntryInput!) {
    rejectRegistryEntry(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const SUSPEND_REGISTRY_ENTRY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation SuspendRegistryEntry($input: SuspendRegistryEntryInput!) {
    suspendRegistryEntry(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const CHANGE_REGISTRY_ENTRY_MEMBERSHIP_STATUS = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation ChangeRegistryEntryMembershipStatus(
    $input: ChangeRegistryEntryMembershipStatusInput!
  ) {
    changeRegistryEntryMembershipStatus(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

const SET_REGISTRY_ENTRY_DIRECTORY_VISIBILITY = `
  ${REGISTRY_ENTRY_FULL_FRAGMENT}
  mutation SetRegistryEntryDirectoryVisibility(
    $input: SetRegistryEntryDirectoryVisibilityInput!
  ) {
    setRegistryEntryDirectoryVisibility(input: $input) {
      ...RegistryEntryFullInfo
    }
  }
`;

// ── CSV import ───────────────────────────────────────────────────────────────

const REQUEST_REGISTRY_CSV_UPLOAD_URL = `
  mutation RequestRegistryCsvUploadUrl(
    $registryId: ID!
    $contentType: String!
    $fileName: String!
  ) {
    requestRegistryCsvUploadUrl(
      registryId: $registryId
      contentType: $contentType
      fileName: $fileName
    ) {
      uploadUrl
      storageKey
      expiresAt
    }
  }
`;

const BULK_IMPORT_REGISTRY_ENTRIES = `
  ${REGISTRY_IMPORT_JOB_FRAGMENT}
  mutation BulkImportRegistryEntries($registryId: ID!, $storageKey: String!) {
    bulkImportRegistryEntries(registryId: $registryId, storageKey: $storageKey) {
      ...RegistryImportJobInfo
    }
  }
`;

// ── Broadcast ────────────────────────────────────────────────────────────────

const SEND_REGISTRY_BROADCAST = `
  ${REGISTRY_BROADCAST_FRAGMENT}
  mutation SendRegistryBroadcast($input: SendRegistryBroadcastInput!) {
    sendRegistryBroadcast(input: $input) {
      ...RegistryBroadcastInfo
    }
  }
`;

// ── Async functions ──────────────────────────────────────────────────────────

export async function createRegistry(
  input: CreateRegistryInput,
): Promise<Registry> {
  const data = await graphqlRequestWithAuth<
    { createRegistry: Registry },
    { input: CreateRegistryInput }
  >(CREATE_REGISTRY, { input });
  return data.createRegistry;
}

export async function updateRegistry(
  input: UpdateRegistryInput,
): Promise<Registry> {
  const data = await graphqlRequestWithAuth<
    { updateRegistry: Registry },
    { input: UpdateRegistryInput }
  >(UPDATE_REGISTRY, { input });
  return data.updateRegistry;
}

export async function archiveRegistry(id: string): Promise<Registry> {
  const data = await graphqlRequestWithAuth<
    { archiveRegistry: Registry },
    { id: string }
  >(ARCHIVE_REGISTRY, { id });
  return data.archiveRegistry;
}

export async function addRegistryEntry(
  input: AddRegistryEntryInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { addRegistryEntry: RegistryEntry },
    { input: AddRegistryEntryInput }
  >(ADD_REGISTRY_ENTRY, { input });
  return data.addRegistryEntry;
}

export async function updateRegistryEntry(
  input: UpdateRegistryEntryInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { updateRegistryEntry: RegistryEntry },
    { input: UpdateRegistryEntryInput }
  >(UPDATE_REGISTRY_ENTRY, { input });
  return data.updateRegistryEntry;
}

export async function verifyRegistryEntry(
  input: VerifyRegistryEntryInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { verifyRegistryEntry: RegistryEntry },
    { input: VerifyRegistryEntryInput }
  >(VERIFY_REGISTRY_ENTRY, { input });
  return data.verifyRegistryEntry;
}

export async function rejectRegistryEntry(
  input: RejectRegistryEntryInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { rejectRegistryEntry: RegistryEntry },
    { input: RejectRegistryEntryInput }
  >(REJECT_REGISTRY_ENTRY, { input });
  return data.rejectRegistryEntry;
}

export async function suspendRegistryEntry(
  input: SuspendRegistryEntryInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { suspendRegistryEntry: RegistryEntry },
    { input: SuspendRegistryEntryInput }
  >(SUSPEND_REGISTRY_ENTRY, { input });
  return data.suspendRegistryEntry;
}

export async function changeRegistryEntryMembershipStatus(
  input: ChangeRegistryEntryMembershipStatusInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { changeRegistryEntryMembershipStatus: RegistryEntry },
    { input: ChangeRegistryEntryMembershipStatusInput }
  >(CHANGE_REGISTRY_ENTRY_MEMBERSHIP_STATUS, { input });
  return data.changeRegistryEntryMembershipStatus;
}

export async function setRegistryEntryDirectoryVisibility(
  input: SetRegistryEntryDirectoryVisibilityInput,
): Promise<RegistryEntry> {
  const data = await graphqlRequestWithAuth<
    { setRegistryEntryDirectoryVisibility: RegistryEntry },
    { input: SetRegistryEntryDirectoryVisibilityInput }
  >(SET_REGISTRY_ENTRY_DIRECTORY_VISIBILITY, { input });
  return data.setRegistryEntryDirectoryVisibility;
}

export async function requestRegistryCsvUploadUrl(
  registryId: string,
  contentType: string,
  fileName: string,
): Promise<RegistryCsvUploadUrl> {
  const data = await graphqlRequestWithAuth<
    { requestRegistryCsvUploadUrl: RegistryCsvUploadUrl },
    { registryId: string; contentType: string; fileName: string }
  >(REQUEST_REGISTRY_CSV_UPLOAD_URL, { registryId, contentType, fileName });
  return data.requestRegistryCsvUploadUrl;
}

export async function bulkImportRegistryEntries(
  registryId: string,
  storageKey: string,
): Promise<RegistryImportJob> {
  const data = await graphqlRequestWithAuth<
    { bulkImportRegistryEntries: RegistryImportJob },
    { registryId: string; storageKey: string }
  >(BULK_IMPORT_REGISTRY_ENTRIES, { registryId, storageKey });
  return data.bulkImportRegistryEntries;
}

export async function sendRegistryBroadcast(
  input: SendRegistryBroadcastInput,
): Promise<RegistryBroadcast> {
  const data = await graphqlRequestWithAuth<
    { sendRegistryBroadcast: RegistryBroadcast },
    { input: SendRegistryBroadcastInput }
  >(SEND_REGISTRY_BROADCAST, { input });
  return data.sendRegistryBroadcast;
}
