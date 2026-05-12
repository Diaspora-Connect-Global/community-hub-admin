import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type { MessageListResponse, SignedUploadUrl } from "./types";

export async function getGroupMessages(
  conversationId: string,
  limit = 50,
  offset = 0,
): Promise<MessageListResponse> {
  const query = `
    query GetMessages($conversationId: String!, $limit: Int, $offset: Int) {
      getMessages(conversationId: $conversationId, limit: $limit, offset: $offset) {
        messages {
          id
          conversationId
          senderId
          type
          content
          mentions {
            userId
            username
          }
          replyToId
          attachments {
            fileName
            fileSize
            mimeType
            gcsPath
          }
          isEdited
          editedAt
          isDeleted
          createdAt
        }
        total
        hasMore
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getMessages: MessageListResponse }>(
    query,
    { conversationId, limit, offset },
  );
  return data.getMessages;
}

export async function getChatUploadUrl(
  contentType: string,
  category: string = "chat",
): Promise<SignedUploadUrl> {
  const query = `
    query GetUploadUrl($contentType: String!, $category: String!) {
      getUploadUrl(contentType: $contentType, category: $category) {
        uploadUrl
        publicUrl
        objectKey
        expiresAt
      }
    }
  `;
  const data = await graphqlRequestWithAuth<{ getUploadUrl: SignedUploadUrl }>(
    query,
    { contentType, category },
  );
  return data.getUploadUrl;
}
