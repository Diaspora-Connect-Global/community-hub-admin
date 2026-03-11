export const POST_ATTACHMENT_FRAGMENT = `
  fragment PostAttachmentFields on PostAttachment {
    id
    type
    objectKey
    mimeType
    url
  }
`;

export const POST_ENGAGEMENT_FRAGMENT = `
  fragment PostEngagementFields on EngagementCounts {
    likes
    shares
    saves
    comments
  }
`;

export const POST_CARD_FRAGMENT = `
  fragment PostCardFields on Post {
    id
    authorType
    authorId
    text
    visibility
    status
    createdAt
    attachments {
      id
      type
      url
      mimeType
    }
    engagementCounts {
      likes
      comments
      shares
      saves
    }
  }
`;

export const POST_FULL_FRAGMENT = `
  fragment PostFullFields on Post {
    id
    authorType
    authorId
    text
    visibility
    status
    attachments {
      id
      type
      objectKey
      mimeType
      url
    }
    engagementCounts {
      likes
      shares
      saves
      comments
    }
    createdAt
    updatedAt
  }
`;
