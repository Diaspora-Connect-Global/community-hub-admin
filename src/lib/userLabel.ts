/**
 * Human-readable label for a person, for display anywhere in the console.
 *
 * PRODUCT RULE: a user's ID (UUID or any fragment of one) must never be shown
 * to anyone — admins included. Callers pass whatever human identity they have
 * (name, email, @username); when none is available they get `fallback`
 * (typically `t("common.unknownUser")`), never an id.
 *
 * Defence in depth: some backends fabricate a "display name" out of the user
 * id when the profile lookup misses. Any candidate that looks like an id (a
 * UUID, a hex/uuid fragment, or an `xxxxxxxx…` truncation) is skipped rather
 * than rendered.
 */
export interface UserLabelParts {
  name?: string | null;
  email?: string | null;
  username?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A bare hex run (a UUID fragment) or a truncated id ending in an ellipsis.
const ID_FRAGMENT_RE = /^[0-9a-f-]{6,}(…|\.\.\.)?$/i;

/** True when `value` looks like a user id or a fragment of one. */
export function looksLikeId(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (UUID_RE.test(v)) return true;
  // Require at least one digit so short hex-looking words ("decade", "facade") pass.
  return ID_FRAGMENT_RE.test(v) && /\d/.test(v);
}

function clean(value?: string | null): string | null {
  const v = value?.trim();
  if (!v || looksLikeId(v)) return null;
  return v;
}

export function userLabel(parts: UserLabelParts, fallback: string): string {
  const name = clean(parts.name);
  if (name) return name;
  const email = clean(parts.email);
  if (email) return email;
  const username = clean(parts.username);
  if (username) return username.startsWith("@") ? username : `@${username}`;
  return fallback;
}

/**
 * True when an audit/resource `type` names a person (user, admin, member…), so
 * its `resourceId` is a user id and must not be rendered.
 */
export function isPersonResourceType(type?: string | null): boolean {
  return /USER|ADMIN|MEMBER|ACCOUNT|PROFILE|PERSON/i.test(type ?? "");
}
