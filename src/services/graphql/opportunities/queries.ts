import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import {
  OPPORTUNITY_OWNER_FRAGMENT,
  OPPORTUNITY_FULL_FRAGMENT,
  OPPORTUNITY_CARD_FRAGMENT,
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

type OpportunityWithNullableCount = Omit<OpportunityType, "applicationCount"> & {
  applicationCount: number | null;
};

function normalizeOpportunity(
  opportunity: OpportunityWithNullableCount,
): OpportunityType {
  return {
    ...opportunity,
    applicationCount: opportunity.applicationCount ?? 0,
  };
}

const GET_OPPORTUNITY = `
  ${OPPORTUNITY_OWNER_FRAGMENT}
  ${OPPORTUNITY_FULL_FRAGMENT}
  query GetOpportunity($id: String!) {
    getOpportunity(id: $id) {
      ...OpportunityFullInfo
    }
  }
`;

const LIST_OPPORTUNITIES = `
  ${OPPORTUNITY_OWNER_FRAGMENT}
  ${OPPORTUNITY_CARD_FRAGMENT}
  query ListOpportunities($input: ListOpportunitiesInput) {
    listOpportunities(input: $input) {
      total
      opportunities {
        ...OpportunityCardInfo
      }
    }
  }
`;

const GET_APPLICATIONS = `
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
  query GetApplication($id: String!) {
    getApplication(id: $id) {
      id
      opportunityId
      applicantId
      status
      coverLetter
      reviewNotes
      reviewedBy
      reviewedAt
      createdAt
      updatedAt
      opportunity {
        id
        title
      }
    }
  }
`;

export async function getOpportunity(id: string): Promise<OpportunityType | null> {
  const data = await graphqlRequestWithAuth<
    { getOpportunity: OpportunityWithNullableCount | null },
    { id: string }
  >(GET_OPPORTUNITY, { id });
  return data.getOpportunity ? normalizeOpportunity(data.getOpportunity) : null;
}

export async function listOpportunities(
  input?: ListOpportunitiesInput,
): Promise<OpportunityListResponse> {
  const data = await graphqlRequestWithAuth<
    {
      listOpportunities: {
        opportunities: OpportunityWithNullableCount[];
        total: number;
      };
    },
    { input?: ListOpportunitiesInput }
  >(LIST_OPPORTUNITIES, { input });

  return {
    total: data.listOpportunities.total,
    opportunities: data.listOpportunities.opportunities.map(normalizeOpportunity),
  };
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
    { getApplication: ApplicationType | null },
    { id: string }
  >(GET_APPLICATION, { id });
  return data.getApplication;
}
