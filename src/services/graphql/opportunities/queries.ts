import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  OPPORTUNITY_OWNER_FRAGMENT,
  OPPORTUNITY_FULL_FRAGMENT,
  OPPORTUNITY_CARD_FRAGMENT,
  FILE_REF_FRAGMENT,
  APPLICATION_ROW_FRAGMENT,
} from "./fragments";
import type {
  OpportunityType,
  OpportunityListResponse,
  ApplicationType,
  ApplicationListResponse,
  ListOpportunitiesInput,
  GetApplicationsInput,
} from "./types";

const GET_OPPORTUNITY = `
  ${OPPORTUNITY_OWNER_FRAGMENT}
  ${OPPORTUNITY_FULL_FRAGMENT}
  query GetOpportunity($id: String!) {
    opportunity(id: $id) {
      ...OpportunityFullInfo
    }
  }
`;

const LIST_OPPORTUNITIES = `
  ${OPPORTUNITY_OWNER_FRAGMENT}
  ${OPPORTUNITY_CARD_FRAGMENT}
  query ListOpportunities($input: ListOpportunitiesInput) {
    opportunities(input: $input) {
      total
      opportunities {
        ...OpportunityCardInfo
      }
    }
  }
`;

const GET_APPLICATIONS = `
  ${FILE_REF_FRAGMENT}
  ${APPLICATION_ROW_FRAGMENT}
  query GetApplications($input: GetApplicationsInput!) {
    getApplications(input: $input) {
      total
      applications {
        ...ApplicationRowInfo
      }
    }
  }
`;

const GET_APPLICATION = `
  ${FILE_REF_FRAGMENT}
  query GetApplication($id: String!) {
    application(id: $id) {
      id
      opportunityId
      applicantId
      status
      coverLetter
      customAnswers
      reviewNotes
      reviewedBy
      reviewedAt
      createdAt
      updatedAt
      resumeFileRef {
        ...FileRefInfo
      }
    }
  }
`;

export async function getOpportunity(id: string): Promise<OpportunityType | null> {
  const data = await graphqlRequestWithAuth<
    { opportunity: OpportunityType | null },
    { id: string }
  >(GET_OPPORTUNITY, { id });
  return data.opportunity;
}

export async function listOpportunities(
  input?: ListOpportunitiesInput,
): Promise<OpportunityListResponse> {
  const data = await graphqlRequestWithAuth<
    { opportunities: OpportunityListResponse },
    { input?: ListOpportunitiesInput }
  >(LIST_OPPORTUNITIES, { input });
  return data.opportunities;
}

export async function getApplications(
  input: GetApplicationsInput,
): Promise<ApplicationListResponse> {
  const data = await graphqlRequestWithAuth<
    { getApplications: ApplicationListResponse },
    { input: GetApplicationsInput }
  >(GET_APPLICATIONS, { input });
  return data.getApplications;
}

export async function getApplication(id: string): Promise<ApplicationType | null> {
  const data = await graphqlRequestWithAuth<
    { application: ApplicationType | null },
    { id: string }
  >(GET_APPLICATION, { id });
  return data.application;
}
