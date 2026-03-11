export const COMMUNITY_CORE_FRAGMENT = `
  fragment CommunityCoreFields on Community {
    id
    name
    description
    visibility
    joinPolicy
    memberCount
    avatarUrl
    coverUrl
    website
    contactEmail
    communityRules
    whoCanPost
    countriesServed
    createdAt
  }
`;

export const MEMBER_DETAILS_FRAGMENT = `
  fragment MemberDetailsFields on MemberDetails {
    userId
    role
    status
    joinedAt
  }
`;

export const ASSOCIATION_FRAGMENT = `
  fragment AssociationFields on Association {
    id
    name
    description
    visibility
    joinPolicy
    contactEmail
    website
    countriesServed
    avatarUrl
    createdAt
  }
`;

export const MODERATION_LOG_FRAGMENT = `
  fragment ModerationLogFields on ModerationLog {
    id
    entityId
    entityType
    action
    performedBy
    targetUser
    details
    createdAt
  }
`;
