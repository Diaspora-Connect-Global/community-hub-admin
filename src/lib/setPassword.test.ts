import { describe, it, expect, vi } from "vitest";
import {
  passwordIssue,
  readSetPasswordParams,
  requestCode,
  submitNewPassword,
  type SetPasswordApi,
} from "./setPassword";

const GOOD = "Correct-Horse-9-Battery";
const api = (over: Partial<SetPasswordApi> = {}): SetPasswordApi => ({
  forgotPassword: vi.fn().mockResolvedValue("Password reset instructions sent to a@b.co"),
  resetPassword: vi.fn().mockResolvedValue("Password reset successfully! You can now log in."),
  ...over,
});
const input = { email: "a@b.co", code: "123456", password: GOOD, confirm: GOOD };

describe("passwordIssue", () => {
  it("applies the backend strength rule", () => {
    expect(passwordIssue("Short1!")).toBe("errTooShort");
    expect(passwordIssue("a".repeat(129))).toBe("errTooLong");
    expect(passwordIssue("lowercase-only-123")).toBe("errUpper");
    expect(passwordIssue("UPPERCASE-ONLY-123")).toBe("errLower");
    expect(passwordIssue("No-Digits-Here-Ok")).toBe("errNumber");
    expect(passwordIssue("NoSymbolsHere123")).toBe("errSpecial");
    expect(passwordIssue(GOOD)).toBeNull();
  });
});

describe("readSetPasswordParams", () => {
  it("reads and bounds email and code, tolerating absence", () => {
    expect(readSetPasswordParams("")).toEqual({ email: "", code: "" });
    expect(readSetPasswordParams("?email=a%40b.co&code=%20123456")).toEqual({ email: "a@b.co", code: "123456" });
    expect(readSetPasswordParams(`?code=${"9".repeat(100)}`).code).toHaveLength(32);
  });
});

describe("requestCode", () => {
  it("rejects a bad email without calling the API", async () => {
    const a = api();
    expect(await requestCode("nope", a)).toEqual({ ok: false, error: "errEmail" });
    expect(a.forgotPassword).not.toHaveBeenCalled();
  });
  it("succeeds, and reports a failure string or a thrown error as errSend", async () => {
    expect(await requestCode("a@b.co", api())).toEqual({ ok: true });
    const failed = api({ forgotPassword: vi.fn().mockResolvedValue("Password reset failed: boom") });
    expect(await requestCode("a@b.co", failed)).toEqual({ ok: false, error: "errSend" });
    const thrown = api({ forgotPassword: vi.fn().mockRejectedValue(new Error("net")) });
    expect(await requestCode("a@b.co", thrown)).toEqual({ ok: false, error: "errSend" });
  });
});

describe("submitNewPassword", () => {
  it("validates before calling the API: missing code, weak password, mismatch", async () => {
    const a = api();
    expect(await submitNewPassword({ ...input, code: " " }, a)).toEqual({ ok: false, error: "errCode" });
    expect(await submitNewPassword({ ...input, password: "short", confirm: "short" }, a)).toEqual({
      ok: false,
      error: "errTooShort",
    });
    expect(await submitNewPassword({ ...input, confirm: GOOD + "x" }, a)).toEqual({ ok: false, error: "errMismatch" });
    expect(a.resetPassword).not.toHaveBeenCalled();
  });
  it("sends the trimmed code and the password to the mutation on success", async () => {
    const a = api();
    expect(await submitNewPassword({ ...input, code: " 123456 " }, a)).toEqual({ ok: true });
    expect(a.resetPassword).toHaveBeenCalledWith({ email: "a@b.co", resetCode: "123456", newPassword: GOOD });
  });
  it("maps an expired/used/invalid code, a weak password and anything else", async () => {
    const fail = (m: string) => api({ resetPassword: vi.fn().mockResolvedValue(`Password reset failed: ${m}`) });
    expect(await submitNewPassword(input, fail("Invalid reset code"))).toEqual({ ok: false, error: "errInvalidCode" });
    expect(await submitNewPassword(input, fail("Reset code has expired"))).toEqual({ ok: false, error: "errInvalidCode" });
    expect(await submitNewPassword(input, fail("Password is too common"))).toEqual({ ok: false, error: "errWeak" });
    expect(await submitNewPassword(input, fail("Internal server error"))).toEqual({ ok: false, error: "errGeneric" });
    const thrown = api({ resetPassword: vi.fn().mockRejectedValue(new Error("net")) });
    expect(await submitNewPassword(input, thrown)).toEqual({ ok: false, error: "errGeneric" });
  });
});
