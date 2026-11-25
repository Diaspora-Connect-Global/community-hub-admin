import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/services/graphql/authentication/passwordMutations", () => ({
  forgotPasswordMutation: vi.fn(),
  resetPasswordMutation: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }));

import "@/i18n";
import i18n from "@/i18n";
import {
  forgotPasswordMutation,
  resetPasswordMutation,
} from "@/services/graphql/authentication/passwordMutations";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

const forgot = vi.mocked(forgotPasswordMutation);
const reset = vi.mocked(resetPasswordMutation);

beforeAll(() => {
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
  void i18n.changeLanguage("en");
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

async function toResetStep() {
  forgot.mockResolvedValue("Password reset instructions sent to a@b.co");
  render(<ResetPasswordDialog open onOpenChange={() => {}} initialEmail="admin@example.org" />);
  fireEvent.click(screen.getByRole("button", { name: /send me a code/i }));
  await screen.findByLabelText(/one-time code/i);
}

describe("community ResetPasswordDialog", () => {
  it("requests the code from the real backend and answers generically", async () => {
    await toResetStep();
    expect(forgot).toHaveBeenCalledWith("admin@example.org");
    expect(screen.getByRole("status").textContent).toMatch(/if an account exists/i);
  });

  it("describes the real 12-character rule", async () => {
    await toResetStep();
    expect(screen.getByText(/at least 12 characters/i)).toBeTruthy();
  });

  it("refuses an 8-character password without calling the server", async () => {
    await toResetStep();
    type(/one-time code/i, "123456");
    type(/^new password/i, "Abcdef1!");
    type(/confirm new password/i, "Abcdef1!");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/at least 12 characters/i);
    expect(reset).not.toHaveBeenCalled();
  });

  it("submits a policy-conforming password to resetPassword", async () => {
    await toResetStep();
    reset.mockResolvedValue("Password reset successfully!");
    type(/one-time code/i, "123456");
    type(/^new password/i, "Correct-Horse-9-Battery");
    type(/confirm new password/i, "Correct-Horse-9-Battery");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));
    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({
        email: "admin@example.org",
        resetCode: "123456",
        newPassword: "Correct-Horse-9-Battery",
      }),
    );
  });

  it("shows no success when the server refuses the request", async () => {
    forgot.mockResolvedValue("Password reset failed: boom");
    render(<ResetPasswordDialog open onOpenChange={() => {}} initialEmail="admin@example.org" />);
    fireEvent.click(screen.getByRole("button", { name: /send me a code/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/could not send/i);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
