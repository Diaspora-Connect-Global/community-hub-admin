import { graphqlRequestWithAuth } from "@/services/authentication/adminAuthService";
import type { SendMessageInput } from "./types";

/**
 * Returns the conversationId. Idempotent for groups — the server returns the
 * existing conversation if one exists for the given groupId.
 */
export async function findOrCreateGroupConversation(
  groupId: string,
  participantIds: string[] = [],
): Promise<string> {
  const mutation = `
    mutation CreateConversation(
      $type: String!
      $participantIds: [String!]!
      $groupId: String
    ) {
      createConversation(
        type: $type
        participantIds: $participantIds
        groupId: $groupId
      )
    }
  `;
  const data = await graphqlRequestWithAuth<{ createConversation: string }>(
    mutation,
    { type: "GROUP", participantIds, groupId },
  );
  return data.createConversation;
}

export async function sendGroupMessage(input: SendMessageInput): Promise<string> {
  const mutation = `
    mutation SendMessage(
      $conversationId: String!
      $messageType: String!
      $content: String!
      $mentions: [String!]
      $replyToId: String
      $idempotencyKey: String
      $clientMessageId: String
    ) {
      sendMessage(
        conversationId: $conversationId
        messageType: $messageType
        content: $content
        mentions: $mentions
        replyToId: $replyToId
        idempotencyKey: $idempotencyKey
        clientMessageId: $clientMessageId
      )
    }
  `;
  const data = await graphqlRequestWithAuth<{ sendMessage: string }>(mutation, {
    conversationId: input.conversationId,
    messageType: input.messageType,
    content: input.content,
    mentions: input.mentions,
    replyToId: input.replyToId,
    idempotencyKey: input.idempotencyKey,
    clientMessageId: input.clientMessageId,
  });
  return data.sendMessage;
}

export async function markGroupConversationAsRead(conversationId: string): Promise<boolean> {
  const mutation = `
    mutation MarkConversationAsRead($conversationId: String!) {
      markConversationAsRead(conversationId: $conversationId)
    }
  `;
  const data = await graphqlRequestWithAuth<{ markConversationAsRead: boolean }>(
    mutation,
    { conversationId },
  );
  return data.markConversationAsRead;
}
