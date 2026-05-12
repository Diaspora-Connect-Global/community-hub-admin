import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Send, AlertCircle, ArrowDown, Paperclip, X,
  FileIcon, Play, Check, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore, getAccessToken } from "@/stores/authStore";
import { extractClaimsFromAccessToken } from "@/services/authentication/adminTokenClaims";
import {
  findOrCreateGroupConversation, getGroupMessages, sendGroupMessage,
  markGroupConversationAsRead, getChatUploadUrl, uploadChatFile,
} from "@/services/graphql/messaging";
import type {
  Message, MessageAttachment, MessageAttachmentInput, MessageType,
} from "@/services/graphql/messaging/types";
import { messageSocket, type RealtimeMessage } from "@/services/websocket/messageSocket";
import type { GroupMember } from "@/services/graphql/groups/types";

interface Props { groupId: string; members: GroupMember[] }

type ConnectionState = "connecting" | "connected" | "disconnected";
type ReceiptStatus = "pending" | "sent" | "delivered" | "read";

interface DisplayMessage extends Message {
  pending?: boolean;
  failed?: boolean;
  clientMessageId?: string;
  receiptStatus?: ReceiptStatus;
}

interface PendingAttachment { id: string; file: File; uploading: boolean }

const HISTORY_LIMIT = 50;
const SAME_SENDER_WINDOW_MS = 2 * 60 * 1000;
const SCROLL_BOTTOM_THRESHOLD_PX = 80;
const TYPING_STOP_DEBOUNCE_MS = 2500;
const TYPING_LOCAL_IDLE_MS = 5000;
const PRESENCE_PING_MS = 60_000;

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function memberDisplayName(members: GroupMember[], senderId: string, selfId: string | null): string {
  if (selfId && senderId === selfId) return "You";
  const m = members.find((mem) => mem.userId === senderId);
  if (m) {
    const name = `${m.profile?.firstName ?? ""} ${m.profile?.lastName ?? ""}`.trim();
    if (name) return name;
  }
  return senderId ? senderId.slice(0, 8) : "Unknown";
}

function memberAvatarUrl(members: GroupMember[], senderId: string): string | undefined {
  return members.find((m) => m.userId === senderId)?.profile?.avatarUrl;
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const d = Date.now() - t;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function sortAscending(list: DisplayMessage[]): DisplayMessage[] {
  return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function mergeMessages(existing: DisplayMessage[], incoming: Message[]): DisplayMessage[] {
  const byId = new Map<string, DisplayMessage>();
  for (const msg of existing) byId.set(msg.id, msg);
  for (const fresh of incoming) {
    const prior = byId.get(fresh.id);
    byId.set(fresh.id, prior
      ? { ...prior, ...fresh, pending: false, failed: false, receiptStatus: prior.receiptStatus ?? "sent" }
      : { ...fresh, receiptStatus: "sent" });
  }
  const pendingToKeep = existing.filter((m) => {
    if (!m.pending && !m.failed) return false;
    return !incoming.find((inc) =>
      inc.senderId === m.senderId && inc.content === m.content &&
      Math.abs(new Date(inc.createdAt).getTime() - new Date(m.createdAt).getTime()) < 30_000,
    );
  });
  return sortAscending([...byId.values(), ...pendingToKeep]);
}

function mimeToMessageType(mime: string): MessageType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "FILE";
}

function attachmentSourceUrl(a: MessageAttachment): string | undefined {
  return a.publicUrl ?? a.gcsPath;
}

function newClientMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function typingLabel(typingIds: string[], members: GroupMember[], selfId: string | null): string | null {
  const others = typingIds.filter((id) => id !== selfId);
  if (others.length === 0) return null;
  if (others.length >= 3) return "Several people are typing…";
  const names = others.map((id) => memberDisplayName(members, id, selfId));
  return names.length === 1 ? `${names[0]} is typing…` : `${names[0]} and ${names[1]} are typing…`;
}

export default function ChatTab({ groupId, members }: Props) {
  const { toast } = useToast();
  const admin = useAuthStore((s) => s.admin);

  const myUserId = useMemo<string | null>(() => {
    const tok = getAccessToken();
    const claims = tok ? extractClaimsFromAccessToken(tok) : null;
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
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const conversationIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingUserTimersRef = useRef<Map<string, number>>(new Map());

  const memberIdsKey = useMemo(() => members.map((m) => m.userId).sort().join(","), [members]);

  const isAtBottom = useCallback((): boolean => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX;
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

  const emitBulkRead = useCallback(() => {
    const cid = conversationIdRef.current;
    if (!cid || !myUserId) return;
    messageSocket.emitConversationRead(cid, myUserId);
  }, [myUserId]);

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
      try { await markGroupConversationAsRead(cid); } catch { /* non-fatal */ }
      emitBulkRead();
      requestAnimationFrame(() => scrollToBottom("auto"));
    } catch (err) {
      setInitError(err instanceof Error ? err.message : String(err));
    } finally {
      setInitLoading(false);
    }
  }, [groupId, token, scrollToBottom, emitBulkRead]);

  useEffect(() => { void initialize(); }, [initialize]);

  useEffect(() => {
    const ids = memberIdsKey ? memberIdsKey.split(",").filter(Boolean) : [];
    const unsub: Array<() => void> = [];

    unsub.push(messageSocket.onConnect(() => {
      setConnectionState("connected");
      if (ids.length > 0) messageSocket.emitQueryOnlineUsers(ids);
    }));
    unsub.push(messageSocket.onDisconnect(() => setConnectionState("disconnected")));
    unsub.push(messageSocket.onMessage((m: RealtimeMessage) => {
      const cid = conversationIdRef.current;
      if (!cid || m.conversationId !== cid) return;
      const wasAtBottom = atBottomRef.current;
      void refreshLatest().then(() => {
        if (wasAtBottom) {
          scrollToBottom("smooth");
          if (myUserId && m.senderId !== myUserId) emitBulkRead();
        } else {
          setShowNewPill(true);
        }
      });
    }));
    unsub.push(messageSocket.onTypingStart(({ conversationId: cid, userId }) => {
      if (cid !== conversationIdRef.current || (myUserId && userId === myUserId)) return;
      setTypingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      const timers = typingUserTimersRef.current;
      const existing = timers.get(userId);
      if (existing) window.clearTimeout(existing);
      timers.set(userId, window.setTimeout(() => {
        setTypingUserIds((cur) => cur.filter((id) => id !== userId));
        timers.delete(userId);
      }, TYPING_LOCAL_IDLE_MS));
    }));
    unsub.push(messageSocket.onTypingStop(({ conversationId: cid, userId }) => {
      if (cid !== conversationIdRef.current) return;
      setTypingUserIds((prev) => prev.filter((id) => id !== userId));
      const timers = typingUserTimersRef.current;
      const ex = timers.get(userId);
      if (ex) { window.clearTimeout(ex); timers.delete(userId); }
    }));
    unsub.push(messageSocket.onMessageDelivery(({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === messageId && m.receiptStatus !== "read"
          ? { ...m, receiptStatus: "delivered" } : m,
      ));
    }));
    unsub.push(messageSocket.onMessageRead(({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === messageId ? { ...m, receiptStatus: "read" } : m,
      ));
    }));
    unsub.push(messageSocket.onConversationRead(({ conversationId: cid, userId }) => {
      if (cid !== conversationIdRef.current || (myUserId && userId === myUserId)) return;
      const readerTs = Date.now();
      setMessages((prev) => prev.map((m) => {
        if (m.senderId !== myUserId) return m;
        const ts = new Date(m.createdAt).getTime();
        return Number.isFinite(ts) && ts <= readerTs ? { ...m, receiptStatus: "read" } : m;
      }));
    }));
    unsub.push(messageSocket.onConversationReadAck(() => { /* no UI yet */ }));
    unsub.push(messageSocket.onMessageSent(({ messageId, conversationId: cid }) => {
      if (cid !== conversationIdRef.current) return;
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        if (m.receiptStatus === "delivered" || m.receiptStatus === "read") return m;
        return { ...m, receiptStatus: "sent", pending: false };
      }));
    }));
    unsub.push(messageSocket.onOnlineUsersResponse(({ onlineUsers }) => {
      setOnlineUserIds(new Set(onlineUsers));
    }));
    unsub.push(messageSocket.onPresenceUpdate(({ userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId); else next.delete(userId);
        return next;
      });
    }));

    if (messageSocket.isConnected) setConnectionState("connected");

    return () => {
      unsub.forEach((fn) => fn());
      const timers = typingUserTimersRef.current;
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, [refreshLatest, scrollToBottom, emitBulkRead, myUserId, memberIdsKey]);

  useEffect(() => {
    if (!conversationId || initLoading || !memberIdsKey) return;
    const ids = memberIdsKey.split(",").filter(Boolean);
    if (ids.length > 0 && messageSocket.isConnected) messageSocket.emitQueryOnlineUsers(ids);
  }, [conversationId, initLoading, memberIdsKey]);

  useEffect(() => {
    const id = window.setInterval(() => messageSocket.emitPing(), PRESENCE_PING_MS);
    return () => window.clearInterval(id);
  }, []);

  const sendTypingStop = useCallback(() => {
    const cid = conversationIdRef.current;
    if (cid) messageSocket.emitTypingStop(cid);
  }, []);

  const handleDraftChange = useCallback((next: string) => {
    setDraft(next);
    const cid = conversationIdRef.current;
    if (!cid) return;
    if (next.trim().length > 0) {
      messageSocket.emitTypingStart(cid);
      if (typingStopTimerRef.current) window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = window.setTimeout(() => {
        sendTypingStop();
        typingStopTimerRef.current = null;
      }, TYPING_STOP_DEBOUNCE_MS);
    } else if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
      sendTypingStop();
    }
  }, [sendTypingStop]);

  const cancelTypingTimer = useCallback(() => {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
  }, []);

  const onPickFiles = useCallback(() => { fileInputRef.current?.click(); }, []);

  const onFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const next: PendingAttachment[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list.item(i);
      if (file) next.push({ id: newClientMessageId(), file, uploading: false });
    }
    if (next.length > 0) setPendingFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  }, []);

  const removePending = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const uploadsInProgress = pendingFiles.some((p) => p.uploading);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!conversationId || sending) return;
    if (content.length === 0 && pendingFiles.length === 0) return;

    cancelTypingTimer();
    sendTypingStop();

    const clientMessageId = newClientMessageId();
    const filesSnapshot = pendingFiles;
    const hasAttachments = filesSnapshot.length > 0;
    const dominantType: MessageType = hasAttachments
      ? mimeToMessageType(filesSnapshot[0].file.type || "") : "TEXT";
    const outgoingContent = hasAttachments && content.length === 0 ? " " : content;

    const optimistic: DisplayMessage = {
      id: `pending-${clientMessageId}`,
      conversationId,
      senderId: myUserId ?? "self",
      type: dominantType,
      content: outgoingContent,
      attachments: hasAttachments ? filesSnapshot.map((p) => ({
        fileName: p.file.name, fileSize: p.file.size,
        mimeType: p.file.type || "application/octet-stream",
      })) : undefined,
      createdAt: new Date().toISOString(),
      pending: true,
      clientMessageId,
      receiptStatus: "pending",
    };

    setMessages((prev) => sortAscending([...prev, optimistic]));
    setDraft("");
    setSending(true);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      let attachmentInputs: MessageAttachmentInput[] | undefined;
      if (hasAttachments) {
        setPendingFiles((prev) => prev.map((p) => ({ ...p, uploading: true })));
        const uploads = await Promise.all(filesSnapshot.map(async (p) => {
          const mime = p.file.type || "application/octet-stream";
          const signed = await getChatUploadUrl(mime, "chat");
          await uploadChatFile(signed.uploadUrl, p.file);
          return { publicUrl: signed.publicUrl, mimeType: mime };
        }));
        attachmentInputs = uploads;
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? {
          ...m,
          attachments: filesSnapshot.map((p, idx) => ({
            fileName: p.file.name, fileSize: p.file.size,
            mimeType: p.file.type || "application/octet-stream",
            publicUrl: uploads[idx]?.publicUrl,
            gcsPath: uploads[idx]?.publicUrl,
          })),
        } : m));
      }

      await sendGroupMessage({
        conversationId,
        messageType: dominantType,
        content: outgoingContent,
        clientMessageId,
        idempotencyKey: clientMessageId,
        attachments: attachmentInputs,
      });
      setPendingFiles([]);
      void refreshLatest();
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id
        ? { ...m, pending: false, failed: true, receiptStatus: "pending" } : m));
      setPendingFiles((prev) => prev.map((p) => ({ ...p, uploading: false })));
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }, [draft, conversationId, sending, myUserId, scrollToBottom, refreshLatest,
      toast, pendingFiles, cancelTypingTimer, sendTypingStop]);

  const retrySend = useCallback(async (failed: DisplayMessage) => {
    if (!conversationId) return;
    const clientMessageId = failed.clientMessageId ?? failed.id;
    setMessages((prev) => prev.map((m) => m.id === failed.id
      ? { ...m, pending: true, failed: false, receiptStatus: "pending" } : m));
    try {
      await sendGroupMessage({
        conversationId,
        messageType: failed.type,
        content: failed.content,
        clientMessageId,
        idempotencyKey: clientMessageId,
      });
      void refreshLatest();
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === failed.id
        ? { ...m, pending: false, failed: true, receiptStatus: "pending" } : m));
      toast({
        title: "Retry failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }, [conversationId, refreshLatest, toast]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  if (!token) {
    return (
      <div className="flex flex-col h-[60vh] rounded-xl border border-border bg-card items-center justify-center text-muted-foreground">
        Please sign in to view chat.
      </div>
    );
  }

  const dotClass = connectionState === "connected" ? "bg-emerald-500"
    : connectionState === "connecting" ? "bg-amber-500 animate-pulse" : "bg-red-500";
  const stateLabel = connectionState === "connected" ? "Connected"
    : connectionState === "connecting" ? "Connecting…" : "Disconnected";

  const typingText = typingLabel(typingUserIds, members, myUserId);
  const canSend = !!conversationId && !sending && !uploadsInProgress
    && (draft.trim().length > 0 || pendingFiles.length > 0);

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
        <div ref={scrollRef} onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-1">
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
              <Button variant="outline" size="sm" onClick={() => void initialize()}>Retry</Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No messages yet. Be the first to say hi.
            </div>
          ) : (
            messages.map((m, idx) => (
              <MessageRow
                key={m.id}
                m={m}
                prev={messages[idx - 1]}
                isMine={!!myUserId && m.senderId === myUserId}
                members={members}
                myUserId={myUserId}
                isOnline={onlineUserIds.has(m.senderId)}
                onRetry={() => void retrySend(m)}
              />
            ))
          )}
        </div>

        {showNewPill && (
          <button type="button" onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1.5 shadow-md hover:opacity-90">
            <ArrowDown className="h-3 w-3" />
            New messages
          </button>
        )}
      </div>

      {typingText && (
        <div className="px-4 py-1 text-[11px] text-muted-foreground border-t border-border bg-background">
          {typingText}
        </div>
      )}

      <div className="border-t border-border p-3 bg-background">
        {pendingFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingFiles.map((p) => (
              <div key={p.id}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/40 pl-3 pr-1 py-1 text-xs">
                {p.uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileIcon className="h-3 w-3" />}
                <span className="max-w-[180px] truncate">{p.file.name}</span>
                <button type="button" onClick={() => removePending(p.id)} disabled={p.uploading}
                  className="rounded-full p-1 hover:bg-background disabled:opacity-50" aria-label="Remove attachment">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesSelected} />
          <Button type="button" variant="ghost" size="icon" onClick={onPickFiles}
            disabled={!conversationId || initLoading || sending}
            className="shrink-0" aria-label="Attach files">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={conversationId ? "Write a message…" : "Connecting to chat…"}
            disabled={!conversationId || initLoading}
            rows={1}
            className="min-h-[40px] max-h-32 resize-none flex-1"
          />
          <Button type="button" onClick={() => void send()} disabled={!canSend} className="shrink-0">
            {sending || uploadsInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}

interface MessageRowProps {
  m: DisplayMessage;
  prev: DisplayMessage | undefined;
  isMine: boolean;
  members: GroupMember[];
  myUserId: string | null;
  isOnline: boolean;
  onRetry: () => void;
}

function MessageRow({ m, prev, isMine, members, myUserId, isOnline, onRetry }: MessageRowProps) {
  const sameSenderRecent = !!prev && prev.senderId === m.senderId &&
    new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < SAME_SENDER_WINDOW_MS;
  const showHeader = !sameSenderRecent;
  const name = memberDisplayName(members, m.senderId, myUserId);
  const avatar = memberAvatarUrl(members, m.senderId);
  const hasContent = m.content.trim().length > 0;
  const attachments = m.attachments ?? [];

  return (
    <div className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} ${showHeader ? "mt-3" : "mt-0.5"}`}>
      {!isMine && (
        <div className="w-7 shrink-0">
          {showHeader && (
            <div className="relative">
              <Avatar className="h-7 w-7">
                {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
              )}
            </div>
          )}
        </div>
      )}
      <div className={`flex flex-col max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        {showHeader && (
          <div className="flex items-center gap-2 px-1 mb-0.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{name}</span>
            <span>·</span>
            <span>{formatRelative(m.createdAt)}</span>
          </div>
        )}
        <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isMine ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        } ${m.pending ? "opacity-60" : ""} ${m.failed ? "ring-1 ring-destructive" : ""}`}>
          {attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-1">
              {attachments.map((a, ai) => <AttachmentView key={ai} att={a} idx={ai} isMine={isMine} />)}
            </div>
          )}
          {hasContent && <span className="whitespace-pre-wrap break-words">{m.content}</span>}
          {!hasContent && attachments.length === 0 && <em className="text-muted-foreground">[empty]</em>}
        </div>
        {isMine && <ReceiptIndicator status={m.receiptStatus} failed={!!m.failed} />}
        {m.failed && (
          <button type="button" onClick={onRetry}
            className="mt-1 text-[11px] text-destructive hover:underline">
            Failed — retry
          </button>
        )}
      </div>
    </div>
  );
}

function AttachmentView({ att, idx, isMine }: { att: MessageAttachment; idx: number; isMine: boolean }) {
  const url = attachmentSourceUrl(att);
  const label = att.fileName?.trim() || `Attachment ${idx + 1}`;
  const mime = att.mimeType ?? "";
  const cardBase = isMine ? "bg-primary/20 text-primary-foreground" : "bg-background/60 text-foreground";

  if (!url) {
    return (
      <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${cardBase}`}>
        <FileIcon className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </div>
    );
  }
  if (mime.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt={label} className="max-h-64 max-w-full rounded object-cover" loading="lazy" />
      </a>
    );
  }
  if (mime.startsWith("video/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:opacity-90 ${cardBase}`}>
        <Play className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </a>
    );
  }
  if (mime.startsWith("audio/")) {
    return <audio controls src={url} className="max-w-full" preload="metadata" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:opacity-90 ${cardBase}`}>
      <FileIcon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </a>
  );
}

function ReceiptIndicator({ status, failed }: { status?: ReceiptStatus; failed: boolean }) {
  if (failed) return null;
  const s: ReceiptStatus = status ?? "sent";
  if (s === "pending") return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />Sending…
    </span>
  );
  if (s === "sent") return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Check className="h-3 w-3" />Sent
    </span>
  );
  if (s === "delivered") return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <CheckCheck className="h-3 w-3" />Delivered
    </span>
  );
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-sky-500">
      <CheckCheck className="h-3 w-3" />Read
    </span>
  );
}
