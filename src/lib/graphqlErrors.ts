import i18n from "@/i18n";
import { GraphQLRequestError } from "@/services/graphql/client";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * True when `text` carries something that looks like an internal id: a UUID
 * (even glued to a word, e.g. `circle_<uuid>`), or a run of 8+ hex characters
 * mixing digits and letters (a UUID fragment, an unhyphenated id, an ObjectId).
 * Token-based, so it stays linear on long input.
 */
export function containsId(text: string): boolean {
  if (UUID_RE.test(text)) return true;
  return text
    .split(/[^0-9a-z]+/i)
    .some((token) => token.length >= 8 && /^[0-9a-f]+$/i.test(token) && /\d/.test(token) && /[a-f]/i.test(token));
}

/** The translated generic fallback ("Something went wrong. Please try again."). */
function genericFallback(): string {
  return i18n.t("common.errorTryAgain");
}

/**
 * A server-provided message (e.g. `{ success: false, message }`), or `fallback`
 * when it is empty or names an id. Removing the id from "Association <id> not
 * found" would leave broken grammar, so the whole message gives way.
 */
export function safeServerMessage(message: string | null | undefined, fallback: string = genericFallback()): string {
  const text = message?.trim();
  if (!text || containsId(text)) return fallback;
  return text;
}

/**
 * A short, user-safe message for a failed request: the server's own messages
 * (never anything that names an id), else `fallback`, else a translated generic
 * message. Use this wherever an error reaches a toast, banner or state.
 */
export function graphqlErrorMessage(err: unknown, fallback: string = genericFallback()): string {
  if (err instanceof GraphQLRequestError) {
    const messages = err.errors.map((e) => e?.message?.trim()).filter((m): m is string => Boolean(m));
    return safeServerMessage(messages.join("; "), fallback);
  }
  if (err instanceof Error) return safeServerMessage(err.message, fallback);
  return fallback;
}

/** `graphqlErrorMessage` for an optional error: null when there is none. */
export function graphqlErrorText(err: unknown, fallback: string = genericFallback()): string | null {
  return err ? graphqlErrorMessage(err, fallback) : null;
}
