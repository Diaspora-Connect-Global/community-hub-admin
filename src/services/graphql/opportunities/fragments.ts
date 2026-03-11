/**
 * GraphQL fragments for Opportunity Service types.
 * Reuse across queries and mutations.
 */

export const OPPORTUNITY_OWNER_FRAGMENT = `
  fragment OpportunityOwnerInfo on OpportunityOwnerType {
    id
    name
    avatarUrl
    type
  }
`;

export const FILE_REF_FRAGMENT = `
  fragment FileRefInfo on FileRefType {
    path
    filename
    mimeType
    sizeBytes
  }
`;

/** Full opportunity fields; use in single opportunity and list items as needed */
export const OPPORTUNITY_FULL_FRAGMENT = `
  fragment OpportunityFullInfo on OpportunityType {
    id
    title
    description
    type
    category
    status
    visibility
    applicationMethod
    applicationCount
    responsibilities
    requirements
    workMode
    engagementType
    location
    externalLink
    applicationEmail
    salaryMin
    salaryMax
    salaryCurrency
    deadline
    skills
    tags
    publishedAt
    closedAt
    createdAt
    updatedAt
    owner {
      ...OpportunityOwnerInfo
    }
  }
`;

/** Slim opportunity for lists (no long text) */
export const OPPORTUNITY_CARD_FRAGMENT = `
  fragment OpportunityCardInfo on OpportunityType {
    id
    title
    description
    type
    category
    status
    visibility
    applicationMethod
    applicationCount
    deadline
    createdAt
    updatedAt
    publishedAt
    owner {
      ...OpportunityOwnerInfo
    }
  }
`;

/** Application with optional opportunity (for getApplications / application) */
export const APPLICATION_FULL_FRAGMENT = `
  fragment ApplicationFullInfo on ApplicationType {
    id
    opportunityId
    applicantId
    status
    resumeFileRef {
      ...FileRefInfo
    }
    coverLetter
    customAnswers
    reviewNotes
    reviewedBy
    reviewedAt
    createdAt
    updatedAt
    opportunity {
      ...OpportunityCardInfo
    }
  }
`;

/** Application without nested opportunity (for getApplications list) */
export const APPLICATION_ROW_FRAGMENT = `
  fragment ApplicationRowInfo on ApplicationType {
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
  }
`;
