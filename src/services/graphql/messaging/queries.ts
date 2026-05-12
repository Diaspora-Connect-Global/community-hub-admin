import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type { MessageListResponse } from "./types";

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
