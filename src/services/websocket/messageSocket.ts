import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_MESSAGE_WS_URL ??
  // Fall back to the GraphQL endpoint origin (gateway also hosts Socket.IO).
  (import.meta.env.VITE_GRAPHQL_ENDPOINT
    ? new URL(import.meta.env.VITE_GRAPHQL_ENDPOINT as string).origin
    : "https://api.diaspoplug.net");

/** Payload received from the backend via `message:new`. */
export interface RealtimeMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "file" | "video" | "audio";
  timestamp: string;
  /** Backend encrypts content; fetch via `getMessages` for plaintext. */
  encryptedData?: unknown;
  mentions?: string[];
  replyToId?: string;
  attachments?: Array<{
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    gcsPath?: string;
  }>;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
}

export interface MessageDeliveryPayload {
  messageId: string;
  conversationId?: string;
  userId: string;
  status: "delivered";
}

export interface MessageReadPayload {
  messageId: string;
  conversationId?: string;
  userId: string;
  status: "read";
}

export interface ConversationReadPayload {
  conversationId: string;
  userId: string;
}

export interface ConversationReadAckPayload {
  conversationId: string;
  updatedCount: number;
}

export interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
  timestamp?: number;
}

export interface PresenceResponse {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface OnlineUsersResponse {
  onlineUsers: string[];
  count: number;
}

export interface PongPayload {
  timestamp: number;
}

export interface MessageSentPayload {
  messageId: string;
  conversationId: string;
}

type Listener<T> = (payload: T) => void;
type MessageListener = (msg: RealtimeMessage) => void;
type ConnectListener = () => void;
type DisconnectListener = (reason: string) => void;

/**
 * Singleton Socket.IO client for the message gateway. The admin's session
 * token (same one used for GraphQL) authenticates the socket — the message
 * gateway accepts either a JWT or a session id.
 */
class MessageSocketClient {
  private socket: Socket | null = null;
  private messageListeners = new Set<MessageListener>();
  private connectListeners = new Set<ConnectListener>();
  private disconnectListeners = new Set<DisconnectListener>();
  private typingStartListeners = new Set<Listener<TypingPayload>>();
  private typingStopListeners = new Set<Listener<TypingPayload>>();
  private messageDeliveryListeners = new Set<Listener<MessageDeliveryPayload>>();
  private messageReadListeners = new Set<Listener<MessageReadPayload>>();
  private conversationReadListeners = new Set<Listener<ConversationReadPayload>>();
  private conversationReadAckListeners = new Set<Listener<ConversationReadAckPayload>>();
  private presenceUpdateListeners = new Set<Listener<PresenceUpdate>>();
  private presenceResponseListeners = new Set<Listener<PresenceResponse>>();
  private onlineUsersResponseListeners = new Set<Listener<OnlineUsersResponse>>();
  private pongListeners = new Set<Listener<PongPayload>>();
  private messageSentListeners = new Set<Listener<MessageSentPayload>>();

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  connect(token: string): void {
    if (!token?.trim()) return;
    if (this.socket?.connected) return;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const cleaned = token.replace(/^Bearer\s+/i, "").trim();
    this.socket = io(SOCKET_URL, {
      path: "/socket.io/",
      auth: { token: cleaned },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this.connectListeners.forEach((cb) => cb());
    });
    this.socket.on("disconnect", (reason: string) => {
      this.disconnectListeners.forEach((cb) => cb(reason));
    });
    this.socket.on("message:new", (data: RealtimeMessage) => {
      this.messageListeners.forEach((cb) => cb(data));
    });
    this.socket.on("typing:start", (data: TypingPayload) => {
      this.typingStartListeners.forEach((cb) => cb(data));
    });
    this.socket.on("typing:stop", (data: TypingPayload) => {
      this.typingStopListeners.forEach((cb) => cb(data));
    });
    this.socket.on("message:delivery", (data: MessageDeliveryPayload) => {
      this.messageDeliveryListeners.forEach((cb) => cb(data));
    });
    this.socket.on("message:read", (data: MessageReadPayload) => {
      this.messageReadListeners.forEach((cb) => cb(data));
    });
    this.socket.on("conversation:read", (data: ConversationReadPayload) => {
      this.conversationReadListeners.forEach((cb) => cb(data));
    });
    this.socket.on("conversation:read:ack", (data: ConversationReadAckPayload) => {
      this.conversationReadAckListeners.forEach((cb) => cb(data));
    });
    this.socket.on("presence:update", (data: PresenceUpdate) => {
      this.presenceUpdateListeners.forEach((cb) => cb(data));
    });
    this.socket.on("presence:response", (data: PresenceResponse) => {
      this.presenceResponseListeners.forEach((cb) => cb(data));
    });
    this.socket.on("onlineUsers:response", (data: OnlineUsersResponse) => {
      this.onlineUsersResponseListeners.forEach((cb) => cb(data));
    });
    this.socket.on("pong", (data: PongPayload) => {
      this.pongListeners.forEach((cb) => cb(data));
    });
    this.socket.on("message:sent", (data: MessageSentPayload) => {
      this.messageSentListeners.forEach((cb) => cb(data));
    });
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    try {
      this.socket.disconnect();
    } catch {
      /* swallow */
    }
    this.socket = null;
  }

  emitTypingStart(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("typing:start", { conversationId });
  }

  emitTypingStop(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("typing:stop", { conversationId });
  }

  emitConversationRead(conversationId: string, userId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("conversation:read", { conversationId, userId });
  }

  emitMessageRead(
    messageId: string,
    userId: string,
    conversationId: string,
  ): void {
    if (!this.socket?.connected) return;
    this.socket.emit("message:read", { messageId, userId, conversationId });
  }

  emitQueryPresence(userId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("query:presence", { userId });
  }

  emitQueryOnlineUsers(userIds: string[]): void {
    if (!this.socket?.connected) return;
    this.socket.emit("query:onlineUsers", { userIds });
  }

  emitPing(): void {
    if (!this.socket?.connected) return;
    this.socket.emit("ping");
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onConnect(listener: ConnectListener): () => void {
    this.connectListeners.add(listener);
    return () => {
      this.connectListeners.delete(listener);
    };
  }

  onDisconnect(listener: DisconnectListener): () => void {
    this.disconnectListeners.add(listener);
    return () => {
      this.disconnectListeners.delete(listener);
    };
  }

  onTypingStart(listener: Listener<TypingPayload>): () => void {
    this.typingStartListeners.add(listener);
    return () => {
      this.typingStartListeners.delete(listener);
    };
  }

  onTypingStop(listener: Listener<TypingPayload>): () => void {
    this.typingStopListeners.add(listener);
    return () => {
      this.typingStopListeners.delete(listener);
    };
  }

  onMessageDelivery(listener: Listener<MessageDeliveryPayload>): () => void {
    this.messageDeliveryListeners.add(listener);
    return () => {
      this.messageDeliveryListeners.delete(listener);
    };
  }

  onMessageRead(listener: Listener<MessageReadPayload>): () => void {
    this.messageReadListeners.add(listener);
    return () => {
      this.messageReadListeners.delete(listener);
    };
  }

  onConversationRead(listener: Listener<ConversationReadPayload>): () => void {
    this.conversationReadListeners.add(listener);
    return () => {
      this.conversationReadListeners.delete(listener);
    };
  }

  onConversationReadAck(
    listener: Listener<ConversationReadAckPayload>,
  ): () => void {
    this.conversationReadAckListeners.add(listener);
    return () => {
      this.conversationReadAckListeners.delete(listener);
    };
  }

  onPresenceUpdate(listener: Listener<PresenceUpdate>): () => void {
    this.presenceUpdateListeners.add(listener);
    return () => {
      this.presenceUpdateListeners.delete(listener);
    };
  }

  onPresenceResponse(listener: Listener<PresenceResponse>): () => void {
    this.presenceResponseListeners.add(listener);
    return () => {
      this.presenceResponseListeners.delete(listener);
    };
  }

  onOnlineUsersResponse(listener: Listener<OnlineUsersResponse>): () => void {
    this.onlineUsersResponseListeners.add(listener);
    return () => {
      this.onlineUsersResponseListeners.delete(listener);
    };
  }

  onPong(listener: Listener<PongPayload>): () => void {
    this.pongListeners.add(listener);
    return () => {
      this.pongListeners.delete(listener);
    };
  }

  onMessageSent(listener: Listener<MessageSentPayload>): () => void {
    this.messageSentListeners.add(listener);
    return () => {
      this.messageSentListeners.delete(listener);
    };
  }
}

export const messageSocket = new MessageSocketClient();
