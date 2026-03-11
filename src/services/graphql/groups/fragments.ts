export const GROUP_CARD_FRAGMENT = `
  fragment GroupCardFields on Group {
    id
    name
    description
    privacy
    memberCount
    avatarUrl
    category
  }
`;

export const GROUP_FULL_FRAGMENT = `
  fragment GroupFullFields on Group {
    id
    ownerId
    name
    description
    avatarUrl
    privacy
    category
    memberCount
    maxMembers
    owner {
      id
      firstName
      lastName
      avatarUrl
    }
    ownerName
    createdAt
    updatedAt
  }
`;

export const GROUP_MEMBER_FRAGMENT = `
  fragment GroupMemberFields on GroupMember {
    id
    userId
    groupId
    role
    status
    joinedAt
    createdAt
    profile {
      id
      firstName
      lastName
      avatarUrl
    }
  }
`;

export const JOIN_REQUEST_FRAGMENT = `
  fragment JoinRequestFields on JoinRequest {
    id
    groupId
    userId
    status
    message
    createdAt
    requesterProfile {
      id
      firstName
      lastName
      avatarUrl
    }
  }
`;
