/**
 * "A post may not be empty": visible text or at least one attachment. Mirrors the
 * server rule (post-feed-service), which is authoritative; this gives instant
 * feedback. Not content: whitespace, invisible formatting characters
 * (zero-width space/joiner, BOM, soft hyphen, bidi marks), empty markup. A
 * written mention (`@name`) is content.
 */
const INVISIBLE =
  /[­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ]/g;
const MARKUP = /<[^>]*>|&nbsp;|&#160;|&#xA0;/gi;

export const POST_EMPTY_CODE = "POST_EMPTY";
export const POST_EMPTY_HINT = "Add some text or at least one attachment to publish.";
export const POST_EMPTY_MESSAGE = "Your post is empty. Add some text or at least one photo, video or file.";

export function hasMeaningfulPostText(text: string | null | undefined): boolean {
  if (typeof text !== "string" || text.length === 0) return false;
  return text.replace(MARKUP, "").replace(INVISIBLE, "").trim().length > 0;
}

export function canSubmitPost(text: string | null | undefined, attachmentCount: number): boolean {
  return hasMeaningfulPostText(text) || attachmentCount > 0;
}

/** True when a thrown request error carries the server's POST_EMPTY refusal. */
export function isPostEmptyError(err: unknown): boolean {
  const e = err as {
    errors?: Array<{ extensions?: { code?: unknown } }>;
    response?: { errors?: Array<{ extensions?: { code?: unknown } }> };
  } | null;
  const list = e?.errors ?? e?.response?.errors;
  return Array.isArray(list) && list.some((x) => x?.extensions?.code === POST_EMPTY_CODE);
}
