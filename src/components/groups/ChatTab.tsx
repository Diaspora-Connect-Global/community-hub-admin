import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, AlertCircle, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore, getAccessToken } from "@/stores/authStore";
import { extractClaimsFromAccessToken } from "@/services/authentication/adminTokenClaims";
import {
  findOrCreateGroupConversation,
  getGroupMessages,
  sendGroupMessage,
  markGroupConversationAsRead,
} from "@/services/graphql/messaging";
import type { Message, MessageType } from "@/services/graphql/messaging/types";
import {
  messageSocket,
  type RealtimeMessage,
} from "@/services/websocket/messageSocket";
import type { GroupMember } from "@/services/graphql/groups/types";

interface Props {
  groupId: string;
  members: GroupMember[];
}

type ConnectionState = "connecting" | "connected" | "disconnected";

interface DisplayMessage extends Message {
  pending?: boolean;
  failed?: boolean;
  clientMessageId?: string;
}

const HISTORY_LIMIT = 50;
const SAME_SENDER_WINDOW_MS = 2 * 60 * 1000;
const SCROLL_BOTTOM_THRESHOLD_PX = 80;
const NON_TEXT_PLACEHOLDERS: Record<MessageType, string> = {
  TEXT: "",
  IMAGE: "[image]",
  FILE: "[file]",
  VIDEO: "[video]",
  AUDIO: "[audio]",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function memberDisplayName(
  members: GroupMember[],
  senderId: string,
  selfId: string | null,
): string {
  if (selfId && senderId === selfId) return "You";
  const m = members.find((mem) => mem.userId === senderId);
  if (m) {
    const name = `${m.profile?.firstName ?? ""} ${m.profile?.lastName ?? ""}`.trim();
    if (name) return name;
  }
  return senderId ? senderId.slice(0, 8) : "Unknown";
}

function memberAvatarUrl(
  members: GroupMember[],
  senderId: string,
): string | undefined {
  return members.find((m) => m.userId === senderId)?.profile?.avatarUrl;
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMs = Date.now() - t;
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortAscending(list: DisplayMessage[]): DisplayMessage[] {
  return [...list].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeMessages(
  existing: DisplayMessage[],
  incoming: Message[],
): DisplayMessage[] {
  const byId = new Map<string, DisplayMessage>();
  for (const msg of existing) byId.set(msg.id, msg);

  for (const fresh of incoming) {
    const prior = byId.get(fresh.id);
    if (prior) {
      byId.set(fresh.id, { ...prior, ...fresh, pending: false, failed: false });
    } else {
      byId.set(fresh.id, fresh);
    }
  }

  const pendingToKeep = existing.filter((m) => {
    if (!m.pending && !m.failed) return false;
    const matched = incoming.find(
      (inc) =>
        inc.senderId === m.senderId &&
        inc.content === m.content &&
        Math.abs(
          new Date(inc.createdAt).getTime() - new Date(m.createdAt).getTime(),
        ) < 30_000,
    );
    return !matched;
  });

  return sortAscending([...byId.values(), ...pendingToKeep]);
}

export default function ChatTab({ groupId, members }: Props) {
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);

  const myUserId = useMemo<string | null>(() => {
    const token = getAccessToken();
    const claims = token ? extractClaimsFromAccessToken(token) : null;
    return claims?.userId ?? claims?.sub ?? admin?.userId ?? null;
  }, [admin]);

  const [token] = useState<string | null>(() => getAccessToken());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    messageSocket.isConnected ? "connected" : "connecting",
  );
  const [showNewPill, setShowNewPill] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const conversationIdRef = useRef<string | null>(null);

  const isAtBottom = useCallback((): boolean => {
    const el = scrollRef.current;
    if (!el) return true;
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX
    );
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior });
      setShowNewPill(false);
      atBottomRef.current = true;
    });
  }, []);

  const handleScroll = useCallback(() => {
    const bottom = isAtBottom();
    atBottomRef.current = bottom;
    if (bottom) setShowNewPill(false);
  }, [isAtBottom]);

  const refreshLatest = useCallback(async () => {
    const cid = conversationIdRef.current;
    if (!cid) return;
    try {
      const res = await getGroupMessages(cid, HISTORY_LIMIT, 0);
      setMessages((prev) => mergeMessages(prev, res.messages));
    } catch (err) {
      console.error("[ChatTab] refresh failed", err);
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!token) return;
    setInitLoading(true);
    setInitError(null);
    try {
      const cid = await findOrCreateGroupConversation(groupId);
      conversationIdRef.current = cid;
      setConversationId(cid);
      messageSocket.connect(token);
      const res = await getGroupMessages(cid, HISTORY_LIMIT, 0);
      setMessages(sortAscending(res.messages));
      try {
        await markGroupConversationAsRead(cid);
      } catch {
        /* non-fatal */
      }
      requestAnimationFrame(() => scrollToBottom("auto"));
    } catch (err) {
      setInitError(err instanceof Error ? err.message : String(err));
    } finally {
      setInitLoading(false);
    }
  }, [groupId, token, scrollToBottom]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const offConnect = messageSocket.onConnect(() =>
      setConnectionState("connected"),
    );
    const offDisconnect = messageSocket.onDisconnect(() =>
      setConnectionState("disconnected"),
    );
    const offMessage = messageSocket.onMessage((m: RealtimeMessage) => {
      const cid = conversationIdRef.current;
      if (!cid || m.conversationId !== cid) return;
      const wasAtBottom = atBottomRef.current;
      void refreshLatest().then(() => {
        if (wasAtBottom) {
          scrollToBottom("smooth");
        } else {
          setShowNewPill(true);
        }
      });
    });

    if (messageSocket.isConnected) setConnectionState("connected");

    return () => {
      offConnect();
      offDisconnect();
      offMessage();
    };
  }, [refreshLatest, scrollToBottom]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || !conversationId || sending) return;
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimistic: DisplayMessage = {
      id: `pending-${clientMessageId}`,
      conversationId,
      senderId: myUserId ?? "self",
      type: "TEXT",
      content,
      createdAt: new Date().toISOString(),
      pending: true,
      clientMessageId,
    };

    setMessages((prev) => sortAscending([...prev, optimistic]));
    setDraft("");
    setSending(true);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      await sendGroupMessage({
        conversationId,
        messageType: "TEXT",
        content,
        clientMessageId,
        idempotencyKey: clientMessageId,
      });
      void refreshLatest();
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false, failed: true } : m,
        ),
      );
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }, [draft, conversationId, sending, myUserId, scrollToBottom, refreshLatest, toast]);

  const retrySend = useCallback(
    async (failed: DisplayMessage) => {
      if (!conversationId) return;
      const clientMessageId = failed.clientMessageId ?? failed.id;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failed.id ? { ...m, pending: true, failed: false } : m,
        ),
      );
      try {
        await sendGroupMessage({
          conversationId,
          messageType: "TEXT",
          content: failed.content,
          clientMessageId,
          idempotencyKey: clientMessageId,
        });
        void refreshLatest();
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failed.id ? { ...m, pending: false, failed: true } : m,
          ),
        );
        toast({
          title: "Retry failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    },
    [conversationId, refreshLatest, toast],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col h-[60vh] rounded-xl border border-border bg-card items-center justify-center text-muted-foreground">
        Please sign in to view chat.
      </div>
    );
  }

  const dotClass =
    connectionState === "connected"
      ? "bg-emerald-500"
      : connectionState === "connecting"
        ? "bg-amber-500 animate-pulse"
        : "bg-red-500";
  const stateLabel =
    connectionState === "connected"
      ? "Connected"
      : connectionState === "connecting"
        ? "Connecting…"
        : "Disconnected";

  return (
    <div className="flex flex-col h-[60vh] rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span>{stateLabel}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {messages.length > 0 && `${messages.length} message${messages.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-1"
        >
          {initLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading messages…
            </div>
          ) : initError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Couldn't load chat: {initError}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => void initialize()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No messages yet. Be the first to say hi.
            </div>
          ) : (
            messages.map((m, idx) => {
              const prev = messages[idx - 1];
              const isMine = !!myUserId && m.senderId === myUserId;
              const sameSenderRecent =
                !!prev &&
                prev.senderId === m.senderId &&
                new Date(m.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  SAME_SENDER_WINDOW_MS;
              const showHeader = !sameSenderRecent;
              const name = memberDisplayName(members, m.senderId, myUserId);
              const avatar = memberAvatarUrl(members, m.senderId);
              const placeholder = NON_TEXT_PLACEHOLDERS[m.type];
              const body = placeholder ? (
                <em className="text-muted-foreground">{placeholder}</em>
              ) : (
                <span className="whitespace-pre-wrap break-words">{m.content}</span>
              );

              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} ${
                    showHeader ? "mt-3" : "mt-0.5"
                  }`}
                >
                  {!isMine && (
                    <div className="w-7 shrink-0">
                      {showHeader ? (
                        <Avatar className="h-7 w-7">
                          {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                          <AvatarFallback className="text-[10px]">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
                  )}
                  <div
                    className={`flex flex-col max-w-[75%] ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {showHeader && (
                      <div className="flex items-center gap-2 px-1 mb-0.5 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">{name}</span>
                        <span>·</span>
                        <span>{formatRelative(m.createdAt)}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      } ${m.pending ? "opacity-60" : ""} ${
                        m.failed ? "ring-1 ring-destructive" : ""
                      }`}
                    >
                      {body}
                    </div>
                    {m.failed && (
                      <button
                        type="button"
                        onClick={() => void retrySend(m)}
                        className="mt-1 text-[11px] text-destructive hover:underline"
                      >
                        Failed — retry
                      </button>
                    )}
                    {m.pending && !m.failed && (
                      <span className="mt-1 text-[11px] text-muted-foreground">
                        Sending…
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomAnchorRef} />
        </div>

        {showNewPill && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1.5 shadow-md hover:opacity-90"
          >
            <ArrowDown className="h-3 w-3" />
            New messages
          </button>
        )}
      </div>

      <div className="border-t border-border p-3 bg-background">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              conversationId ? "Write a message…" : "Connecting to chat…"
            }
            disabled={!conversationId || initLoading}
            rows={1}
            className="min-h-[40px] max-h-32 resize-none flex-1"
          />
          <Button
            type="button"
            onClick={() => void send()}
            disabled={!conversationId || sending || !draft.trim()}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}
