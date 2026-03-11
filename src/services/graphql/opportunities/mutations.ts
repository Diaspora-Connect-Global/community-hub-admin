import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type {
  CreateOpportunityInput,
  CreateOpportunityResponse,
  UpdateOpportunityInput,
  ReviewApplicationInput,
} from "./types";

const CREATE_OPPORTUNITY = `
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input) {
      id
    }
  }
`;

const UPDATE_OPPORTUNITY = `
  mutation UpdateOpportunity($id: String!, $input: UpdateOpportunityInput!) {
    updateOpportunity(id: $id, input: $input)
  }
`;

const PUBLISH_OPPORTUNITY = `
  mutation PublishOpportunity($id: String!) {
    publishOpportunity(id: $id)
  }
`;

const CLOSE_OPPORTUNITY = `
  mutation CloseOpportunity($id: String!, $reason: String) {
    closeOpportunity(id: $id, reason: $reason)
  }
`;

const DELETE_OPPORTUNITY = `
  mutation DeleteOpportunity($id: String!) {
    deleteOpportunity(id: $id)
  }
`;

const REVIEW_APPLICATION = `
  mutation ReviewApplication($applicationId: String!, $notes: String) {
    reviewApplication(applicationId: $applicationId, notes: $notes)
  }
`;

const ACCEPT_APPLICATION = `
  mutation AcceptApplication($id: String!, $notes: String) {
    acceptApplication(id: $id, notes: $notes)
  }
`;

const REJECT_APPLICATION = `
  mutation RejectApplication($id: String!, $reason: String) {
    rejectApplication(id: $id, reason: $reason)
  }
`;

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<CreateOpportunityResponse> {
  const data = await graphqlRequestWithAuth<
    { createOpportunity: CreateOpportunityResponse },
    { input: CreateOpportunityInput }
  >(CREATE_OPPORTUNITY, { input });
  return data.createOpportunity;
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput,
): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { updateOpportunity: boolean },
    { id: string; input: UpdateOpportunityInput }
  >(UPDATE_OPPORTUNITY, { id, input });
  return data.updateOpportunity;
}

export async function publishOpportunity(id: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { publishOpportunity: boolean },
    { id: string }
  >(PUBLISH_OPPORTUNITY, { id });
  return data.publishOpportunity;
}

export async function closeOpportunity(id: string, reason?: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { closeOpportunity: boolean },
    { id: string; reason?: string }
  >(CLOSE_OPPORTUNITY, { id, reason });
  return data.closeOpportunity;
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { deleteOpportunity: boolean },
    { id: string }
  >(DELETE_OPPORTUNITY, { id });
  return data.deleteOpportunity;
}

export async function reviewApplication(input: ReviewApplicationInput): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { reviewApplication: boolean },
    { applicationId: string; notes?: string }
  >(REVIEW_APPLICATION, {
    applicationId: input.applicationId,
    notes: input.notes,
  });
  return data.reviewApplication;
}

export async function acceptApplication(id: string, notes?: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { acceptApplication: boolean },
    { id: string; notes?: string }
  >(ACCEPT_APPLICATION, { id, notes });
  return data.acceptApplication;
}

export async function rejectApplication(id: string, reason?: string): Promise<boolean> {
  const data = await graphqlRequestWithAuth<
    { rejectApplication: boolean },
    { id: string; reason?: string }
  >(REJECT_APPLICATION, { id, reason });
  return data.rejectApplication;
}
