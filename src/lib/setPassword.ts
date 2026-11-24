/**
 * Logic for the public "set your password" page that a new administrator reaches
 * from the welcome email.
 *
 * The backend has no token-link flow: an admin account is a normal account, and the
 * password is set with the one-time-code reset flow (`forgotPassword(email)` sends the
 * code, `resetPassword(email, resetCode, newPassword)` consumes it). Both mutations
 * answer with a status STRING instead of throwing ("Password reset failed: ..." on error).
 *
 * Kept free of React and of any GraphQL client so it can be unit-tested; the page injects
 * the two requests.
 */

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same character class auth-service accepts as a "special character".
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export type SetPasswordErrorKey =
  | "errEmail"
  | "errCode"
  | "errTooShort"
  | "errTooLong"
  | "errUpper"
  | "errLower"
  | "errNumber"
  | "errSpecial"
  | "errMismatch"
  | "errInvalidCode"
  | "errWeak"
  | "errGeneric"
  | "errSend";

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Mirrors auth-service's password strength rule (length 12-128, upper, lower, digit, symbol). */
export function passwordIssue(password: string): SetPasswordErrorKey | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "errTooShort";
  if (password.length > PASSWORD_MAX_LENGTH) return "errTooLong";
  if (!/[A-Z]/.test(password)) return "errUpper";
  if (!/[a-z]/.test(password)) return "errLower";
  if (!/[0-9]/.test(password)) return "errNumber";
  if (!SPECIAL_RE.test(password)) return "errSpecial";
  return null;
}

export interface SetPasswordParams {
  email: string;
  code: string;
}

/** Optional prefill from the link (`?email=` and `?code=`); never trusted beyond prefilling. */
export function readSetPasswordParams(search: string): SetPasswordParams {
  const params = new URLSearchParams(search);
  const clean = (v: string | null, max: number) => (v ?? "").trim().slice(0, max);
  return { email: clean(params.get("email"), 254), code: clean(params.get("code"), 32) };
}

/** Returns the server's failure message, or null when the status string means success. */
export function gatewayFailure(result: string | null | undefined): string | null {
  if (typeof result !== "string") return "";
  if (/failed/i.test(result)) return result.replace(/^Password reset failed:\s*/i, "").trim();
  return null;
}

export function classifyFailure(message: string): SetPasswordErrorKey {
  if (/common|breach|pwned|compromised|weak/i.test(message)) return "errWeak";
  if (/invalid|expired|incorrect|not found|used|code/i.test(message)) return "errInvalidCode";
  return "errGeneric";
}

export interface SetPasswordApi {
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (input: { email: string; resetCode: string; newPassword: string }) => Promise<string>;
}

export type SetPasswordOutcome = { ok: true } | { ok: false; error: SetPasswordErrorKey };

export async function requestCode(email: string, api: SetPasswordApi): Promise<SetPasswordOutcome> {
  if (!isValidEmail(email)) return { ok: false, error: "errEmail" };
  try {
    const result = await api.forgotPassword(email.trim());
    return gatewayFailure(result) === null ? { ok: true } : { ok: false, error: "errSend" };
  } catch {
    return { ok: false, error: "errSend" };
  }
}

export async function submitNewPassword(
  input: { email: string; code: string; password: string; confirm: string },
  api: SetPasswordApi,
): Promise<SetPasswordOutcome> {
  if (!isValidEmail(input.email)) return { ok: false, error: "errEmail" };
  if (!input.code.trim()) return { ok: false, error: "errCode" };
  const issue = passwordIssue(input.password);
  if (issue) return { ok: false, error: issue };
  if (input.password !== input.confirm) return { ok: false, error: "errMismatch" };
  try {
    const result = await api.resetPassword({
      email: input.email.trim(),
      resetCode: input.code.trim(),
      newPassword: input.password,
    });
    const failure = gatewayFailure(result);
    return failure === null ? { ok: true } : { ok: false, error: classifyFailure(failure) };
  } catch {
    return { ok: false, error: "errGeneric" };
  }
}
