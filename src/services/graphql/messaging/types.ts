export type MessageType = "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO";

export interface MessageMention {
  userId: string;
  username?: string;
}

export interface MessageAttachment {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  gcsPath?: string;
  publicUrl?: string;
}

export interface MessageAttachmentInput {
  publicUrl: string;
  mimeType: string;
}

export interface SignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  expiresAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  mentions?: MessageMention[];
  replyToId?: string;
  attachments?: MessageAttachment[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export interface SendMessageInput {
  conversationId: string;
  messageType: MessageType;
  content: string;
  mentions?: string[];
  replyToId?: string;
  idempotencyKey?: string;
  clientMessageId?: string;
  attachments?: MessageAttachmentInput[];
}
