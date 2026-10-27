/**
 * Browser-only post drafts. Privacy: the consoles run on shared office machines, so
 * every draft is keyed by an opaque hash of (signed-in admin, owning entity) and ALL
 * drafts are deleted on sign-out. Every storage access is guarded: blocked storage
 * must never break posting.
 */
import type { MentionInput } from "@/services/graphql/posts";

export const DRAFT_PREFIX = "composer_draft:v1:";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface ComposerDraft {
  text: string;
  visibility: string;
  mentions: MentionInput[];
  savedAt: number;
}

/** Non-cryptographic 53-bit hash (cyrb53) — only needs to be opaque, not secret. */
function opaqueHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Null when we do not know who is signed in or which entity owns the composer. */
export function draftKey(adminId: string | null | undefined, ownerId: string | null | undefined): string | null {
  if (!adminId || !ownerId) return null;
  return `${DRAFT_PREFIX}${opaqueHash(`${adminId}|${ownerId}`)}`;
}

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveDraft(key: string | null, draft: Omit<ComposerDraft, "savedAt">): void {
  const s = store();
  if (!s || !key) return;
  try {
    s.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // quota / blocked storage — drafts are best-effort
  }
}

export function loadDraft(key: string | null): ComposerDraft | null {
  const s = store();
  if (!s || !key) return null;
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<ComposerDraft>;
    if (typeof d.text !== "string" || typeof d.savedAt !== "number") return null;
    if (Date.now() - d.savedAt > MAX_AGE_MS) {
      s.removeItem(key);
      return null;
    }
    return {
      text: d.text,
      visibility: typeof d.visibility === "string" ? d.visibility : "",
      mentions: Array.isArray(d.mentions) ? d.mentions : [],
      savedAt: d.savedAt,
    };
  } catch {
    return null;
  }
}

export function clearDraft(key: string | null): void {
  const s = store();
  if (!s || !key) return;
  try {
    s.removeItem(key);
  } catch {
    // ignore
  }
}

/** Sign-out: remove every composer draft on this browser, whoever wrote it. */
export function clearAllDrafts(): void {
  const s = store();
  if (!s) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const k = s.key(i);
      if (k && k.startsWith(DRAFT_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => s.removeItem(k));
  } catch {
    // ignore
  }
}
