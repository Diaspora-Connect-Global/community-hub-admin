export const ASSOCIATION_SUMMARY_FRAGMENT = `
  fragment AssociationSummaryFields on Association {
    id
    name
    description
    memberCount
    joinPolicy
  }
`;

export const ASSOCIATION_DETAIL_FRAGMENT = `
  fragment AssociationDetailFields on Association {
    id
    name
    description
    joinPolicy
    visibility
    defaultGroupId
    memberCount
    avatarUrl
    createdAt
    updatedAt
  }
`;

export const ASSOCIATION_MEMBER_FRAGMENT = `
  fragment AssociationMemberFields on AssociationMember {
    userId
    role
    status
    joinedAt
  }
`;
