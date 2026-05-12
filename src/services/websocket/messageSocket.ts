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

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onConnect(listener: ConnectListener): () => void {
    this.connectListeners.add(listener);
    return () => this.connectListeners.delete(listener);
  }

  onDisconnect(listener: DisconnectListener): () => void {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }
}

export const messageSocket = new MessageSocketClient();
