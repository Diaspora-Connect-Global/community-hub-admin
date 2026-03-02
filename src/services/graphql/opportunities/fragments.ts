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
    ownerType
    ownerId
    owner {
      ...OpportunityOwnerInfo
    }
    type
    category
    subCategory
    title
    description
    responsibilities
    requirements
    workMode
    engagementType
    location
    visibility
    applicationMethod
    externalLink
    applicationEmail
    status
    priorityLevel
    salaryMin
    salaryMax
    salaryCurrency
    deadline
    applicationCount
    skills
    tags
    isSavedByCurrentUser
    hasCurrentUserApplied
    currentUserApplicationId
    createdAt
    updatedAt
    publishedAt
    closedAt
  }
`;

/** Slim opportunity for lists (no long text) */
export const OPPORTUNITY_CARD_FRAGMENT = `
  fragment OpportunityCardInfo on OpportunityType {
    id
    title
    type
    category
    status
    priorityLevel
    location
    workMode
    engagementType
    deadline
    applicationCount
    owner {
      ...OpportunityOwnerInfo
    }
    isSavedByCurrentUser
    hasCurrentUserApplied
    createdAt
    publishedAt
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
    resumeFileRef {
      ...FileRefInfo
    }
  }
`;
